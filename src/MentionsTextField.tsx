import { Box, TextField, TextFieldProps, TextFieldVariants } from '@mui/material';
import React, { Children, useMemo, useState } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import Highlighter from './Highlighter';
import SuggestionsOverlay from './SuggestionsOverlay';
import {
    Data,
    MentionData,
    applyChangeToValue,
    countSuggestions,
    findStartOfMentionInPlainText,
    getDataProvider,
    getEndOfLastMention,
    getMentions,
    getPlainText,
    isHTMLTextAreaElement,
    isNumber,
    makeMentionsMarkup,
    makeTriggerRegex,
    mapPlainTextIndex,
    readConfigFromChildren,
    spliceString,
} from './utils/utils';

export interface Position {
    top: number;
    left: number;
    right: number;
}

interface Suggestion {
    queryInfo: {
        childIndex: number;
        query: string;
        querySequenceStart: number;
        querySequenceEnd: number;
        plainTextValue: string;
    };
    results: Data[];
}

export interface SuggestionMap {
    [index: number]: Suggestion;
}

export interface DataSource {
    trigger: string;
    data: Data[];
    markup: string;
    regex?: RegExp;
    allowSpaceInQuery?: boolean;
    displayTransform?: (id: string, display: string) => string;
    ignoreAccents?: boolean;
}

interface MentionsTextFieldBaseProps {
    value: string;
    onChange: (newValue: string, newPlainText: string, mentions: MentionData[]) => void;
    dataSources: DataSource[];

    allowSuggestionsAboveCursor?: boolean;
    forceSuggestionsAboveCursor?: boolean;
}

type MentionsTextFieldProps<Variant extends TextFieldVariants = TextFieldVariants> = Omit<
    TextFieldProps<Variant>,
    'onChange'
> &
    MentionsTextFieldBaseProps;

const MentionsInput: React.FC<MentionsTextFieldProps> = (props) => {
    const inputElement = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const containerElement = useRef<HTMLElement>(null);
    const highlighterElement = useRef<HTMLDivElement>(null);
    const suggestionsElement = useRef<HTMLDivElement>(null);

    const suggestionsMouseDown = useRef(false);

    const suggestionsOverlayPosition = useSuggestionsOverlayPosition({
        allowSuggestionsAboveCursor: props.allowSuggestionsAboveCursor,
        forceSuggestionsAboveCursor: props.forceSuggestionsAboveCursor,
        suggestionsElement,
        highlighterElement,
        containerElement,
    });

    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

    const [scrollFocusedIntoView, setScrollFocusedIntoView] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            if (!highlighterElement.current || !inputElement.current) {
                return;
            }
            highlighterElement.current.scrollLeft = inputElement.current.scrollLeft;
            highlighterElement.current.scrollTop = inputElement.current.scrollTop;
            console.log('Scroll effect: ', highlighterElement.current.scrollTop);
        };

        inputElement.current?.addEventListener('scroll', onScroll);
        return () => inputElement.current?.removeEventListener('scroll', onScroll);
    }, [inputElement, highlighterElement]);

    const handleBlur = () => {
        if (!suggestionsMouseDown.current) {
            setSelectionStart(null);
            setSelectionEnd(null);
        }
        suggestionsMouseDown.current = false;
    };

    const handleSuggestionsMouseDown = () => {
        suggestionsMouseDown.current = true;
    };

    const addMention = (
        { id, display }: Data,
        {
            childIndex,
            querySequenceStart,
            querySequenceEnd,
            plainTextValue,
        }: { childIndex: number; querySequenceStart: number; querySequenceEnd: number; plainTextValue: string },
    ) => {
        // Insert mention in the marked up value at the correct position
        const config = readConfigFromChildren(props.dataSources);
        const mentionsChild = config[childIndex];
        const { markup, displayTransform /*appendSpaceOnAdd, onAdd*/ } = mentionsChild;

        const start = mapPlainTextIndex(props.value, config, querySequenceStart, 'START');
        if (!isNumber(start)) {
            return;
        }

        const end = start + querySequenceEnd - querySequenceStart;

        let insert = makeMentionsMarkup(markup, id, display);

        // TODO: potentially add back
        // if (appendSpaceOnAdd) {
        //     insert += ' ';
        // }
        const newValue = spliceString(props.value, start, end, insert);

        // Refocus input and set caret position to end of mention
        inputElement.current?.focus();

        let displayValue = displayTransform(id, display);

        // TODO: potentially add back
        // if (appendSpaceOnAdd) {
        //     displayValue += ' ';
        // }
        const newCaretPosition = querySequenceStart + displayValue.length;
        setSelectionStart(newCaretPosition);
        setSelectionEnd(newCaretPosition);

        // Propagate change
        const mentions = getMentions(newValue, config);
        const newPlainTextValue = spliceString(plainTextValue, querySequenceStart, querySequenceEnd, displayValue);

        props.onChange(newValue, newPlainTextValue, mentions);

        // TODO: potentially add back
        // if (onAdd) {
        //     onAdd(id, display, start, end);
        // }
    };

    const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = props.value || '';
        const config = readConfigFromChildren(props.dataSources);

        let newPlainTextValue = ev.target.value;

        let selectionStartBefore = selectionStart;
        if (!isNumber(selectionStartBefore)) {
            selectionStartBefore = ev.target.selectionStart;
        }

        let selectionEndBefore = selectionEnd;
        if (!isNumber(selectionEndBefore)) {
            selectionEndBefore = ev.target.selectionEnd;
        }

        // Derive the new value to set by applying the local change in the textarea's plain text
        const newValue = applyChangeToValue(
            value,
            newPlainTextValue,
            selectionStartBefore,
            selectionEndBefore,
            ev.target.selectionEnd || 0,
            config,
        );

        // In case a mention is deleted, also adjust the new plain text value
        newPlainTextValue = getPlainText(newValue, config);

        // Save current selection after change to be able to restore caret position after rerendering
        let selectionStartAfter = ev.target.selectionStart;
        let selectionEndAfter = ev.target.selectionEnd;
        let selectionAfterMentionChange = false;

        // Adjust selection range in case a mention will be deleted by the characters outside of the
        // selection range that are automatically deleted
        const startOfMention = findStartOfMentionInPlainText(value, config, selectionStart || 0);

        if (startOfMention !== undefined && selectionEndAfter !== null && selectionEndAfter > startOfMention) {
            // only if a deletion has taken place
            const data = (ev.nativeEvent as any).data;
            selectionStartAfter = startOfMention + (data ? data.length : 0);
            selectionEndAfter = selectionStart;
            selectionAfterMentionChange = true;
        }

        setSelectionStart(selectionStartAfter);
        setSelectionEnd(selectionEndAfter);

        const mentions = getMentions(newValue, config);

        // Propagate change
        props.onChange(newValue, newPlainTextValue, mentions);
    };

    const handleSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setSelectionStart(ev.target.selectionStart);
        setSelectionEnd(ev.target.selectionEnd);
        props.onSelect?.(ev);
    };

    const { value, onChange, dataSources, allowSuggestionsAboveCursor, forceSuggestionsAboveCursor, ...others } = props;
    const inputProps: TextFieldProps = {
        ...others,
        value: getPlainText(value, readConfigFromChildren(dataSources)),
        onChange: handleChange,
        onSelect: handleSelect,
        onBlur: handleBlur,
        inputProps: {
            sx: { overscrollBehavior: 'none' },
        },
    };

    return (
        <Box ref={containerElement}>
            <TextField multiline fullWidth minRows={3} maxRows={7} />

            <Box id='mui-mentions-control' sx={{ position: 'relative' }}>
                <Highlighter
                    containerRef={highlighterElement}
                    inputRef={inputElement}
                    value={value}
                    dataSources={dataSources}
                />
                <TextField inputRef={inputElement} {...inputProps} />
            </Box>
            <SuggestionsOverlay
                open={selectionStart !== undefined}
                value={props.value}
                dataSources={props.dataSources}
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
                containerRef={suggestionsElement}
                // TODO
                scrollFocusedIntoView={scrollFocusedIntoView}
                loading={false}
                left={suggestionsOverlayPosition?.left || 0}
                top={suggestionsOverlayPosition?.top || 0}
                right={suggestionsOverlayPosition?.right || 0}
                onSelect={addMention}
                onMouseDown={handleSuggestionsMouseDown}
            />
        </Box>
    );
};

export default MentionsInput;

/**
 * Checks whether the given clipboard event has data.
 * @param event The clipboard event to check.
 * @returns True if event.clipboardData is truthy.
 */
function hasClipboardData(event: ClipboardEvent): boolean {
    return Boolean(event.clipboardData);
}

interface UseSuggestionsOverlayPositionProps {
    caretPosition?: Position;
    allowSuggestionsAboveCursor?: boolean;
    forceSuggestionsAboveCursor?: boolean;

    suggestionsElement: React.RefObject<HTMLElement>;
    highlighterElement: React.RefObject<HTMLElement>;
    containerElement: React.RefObject<HTMLElement>;
}

function useSuggestionsOverlayPosition(props: UseSuggestionsOverlayPositionProps): Position | null {
    const {
        caretPosition,
        allowSuggestionsAboveCursor,
        forceSuggestionsAboveCursor,
        suggestionsElement,
        highlighterElement,
        containerElement,
    } = props;

    if (!caretPosition || !suggestionsElement || !suggestionsElement.current || !highlighterElement.current) {
        return null;
    }

    const suggestions = suggestionsElement.current;
    const highlighter = highlighterElement.current;

    // first get viewport-relative position (highlighter is offsetParent of caret):
    const caretOffsetParentRect = highlighter.getBoundingClientRect();
    const caretHeight = getComputedStyleLengthProp(highlighter, 'font-size');
    const viewportRelative = {
        left: caretOffsetParentRect.left + caretPosition.left,
        top: caretOffsetParentRect.top + caretPosition.top + caretHeight,
    };
    const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    const position: Position = {
        top: 0,
        left: 0,
        right: 0,
    };

    let left = caretPosition.left - highlighter.scrollLeft;
    let top = caretPosition.top - highlighter.scrollTop;
    // guard for mentions suggestions list clipped by right edge of window
    if (left + suggestions.offsetWidth > (containerElement.current?.offsetWidth || 0)) {
        position.right = 0;
    } else {
        position.left = left;
    }
    // guard for mentions suggestions list clipped by bottom edge of window if allowSuggestionsAboveCursor set to true.
    // move the list up above the caret if it's getting cut off by the bottom of the window, provided that the list height
    // is small enough to NOT cover up the caret
    if (
        (allowSuggestionsAboveCursor &&
            viewportRelative.top - highlighter.scrollTop + suggestions.offsetHeight > viewportHeight &&
            suggestions.offsetHeight < caretOffsetParentRect.top - caretHeight - highlighter.scrollTop) ||
        forceSuggestionsAboveCursor
    ) {
        position.top = top - suggestions.offsetHeight - caretHeight;
    } else {
        position.top = top;
    }

    return position;
}

/**
 * Returns the computed property value for the provided element.
 *
 * Note: According to spec and testing, can count on length values coming back in pixels.
 * See https://developer.mozilla.org/en-US/docs/Web/CSS/used_value#Difference_from_computed_value.
 *
 * @param element The element to get the property value for.
 * @param propertyName The name of the property to get.
 * @returns The computed property value for the element.
 */
function getComputedStyleLengthProp(element: HTMLElement, propertyName: string) {
    const length = parseFloat(window.getComputedStyle(element, null).getPropertyValue(propertyName));
    return isFinite(length) ? length : 0;
}
