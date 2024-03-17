import { Box, TextField, TextFieldProps } from '@mui/material';
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

enum Key {
    Tab = 'Tab',
    Return = 'Enter',
    Escape = 'Escape',
    Up = 'ArrowUp',
    Down = 'ArrowDown',
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

interface MentionsInputProps {
    value: string;
    onChange: (
        event: React.ChangeEvent<HTMLInputElement>,
        newValue: string,
        newPlainTextValue: string,
        mentions: MentionData[],
    ) => void;
    trigger: string | RegExp;
    onSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent) => void;
    allowSuggestionsAboveCursor?: boolean;
    forceSuggestionsAboveCursor?: boolean;
    allowSpaceInQuery?: boolean;
    ignoreAccents?: boolean;
}

const MentionsInput: React.FC<React.PropsWithChildren<MentionsInputProps>> = (props) => {
    const inputElement = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const containerElement = useRef<HTMLElement>(null);
    const highlighterElement = useRef<HTMLDivElement>(null);
    const suggestionsElement = useRef<HTMLDivElement>(null);

    const suggestionsMouseDown = useRef(false);
    const isComposing = useRef(false);
    const queryId = useRef(0);

    const suggestionsOverlayPosition = useSuggestionsOverlayPosition({
        allowSuggestionsAboveCursor: props.allowSuggestionsAboveCursor,
        forceSuggestionsAboveCursor: props.forceSuggestionsAboveCursor,
        suggestionsElement,
        highlighterElement,
        containerElement,
    });

    const [suggestionsOverlayId] = useState(Math.random().toString(16).substring(2));

    const [suggestions, setSuggestions] = useState<SuggestionMap>({});
    const [focusIndex, setFocusIndex] = useState(0);
    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
    const [selectionAfterPaste, setSelectionAfterPaste] = useState(false);
    const [selectionAfterMentionChange, setSelectionAfterMentionChange] = useState(false);
    const [scrollFocusedIntoView, setScrollFocusedIntoView] = useState(false);
    const [caretPosition, setCaretPosition] = useState<Position | null>(null);

    const shiftFocus = (delta: number) => {
        const suggestionsCount = countSuggestions(suggestions);
        setFocusIndex((suggestionsCount + focusIndex + delta) % suggestionsCount);
        setScrollFocusedIntoView(true);
    };

    const selectFocused = () => {
        // TODO: improve typing
        const { result, queryInfo } = Object.values(suggestions).reduce(
            (acc, { results, queryInfo }) => [...acc, ...results.map((result: Data) => ({ result, queryInfo }))],
            [],
        )[focusIndex];
        addMention(result, queryInfo);

        setFocusIndex(0);
    };

    const handleKeyDown = (ev: React.KeyboardEvent) => {
        const suggestionsCount = countSuggestions(suggestions);

        if (suggestionsCount === 0 || !suggestionsElement.current) {
            // do not intercept key events if the suggestions overlay is not shown
            props.onKeyDown?.(ev);
            return;
        }

        switch (ev.key) {
            case Key.Escape: {
                clearSuggestions();
                break;
            }
            case Key.Down: {
                shiftFocus(+1);
                break;
            }
            case Key.Up: {
                shiftFocus(-1);
                break;
            }

            case Key.Return:
            case Key.Tab: {
                selectFocused();
                break;
            }
            default: {
                return;
            }
        }

        ev.preventDefault();
        ev.stopPropagation();
    };

    const handleBlur = (ev: React.FocusEvent) => {
        if (!suggestionsMouseDown.current) {
            setSelectionStart(null);
            setSelectionEnd(null);
        }
        suggestionsMouseDown.current = false;

        // TODO: extra stuff in this function to potentially copy? Not sure if necessary
    };

    const handleSuggestionsMouseDown = () => {
        suggestionsMouseDown.current = true;
    };

    const handleSuggestionsMouseEnter = (focusIndex: number) => {
        setFocusIndex(focusIndex);
        setScrollFocusedIntoView(false);
    };

    const handleCompositionStart = () => {
        isComposing.current = true;
    };

    const handleCompositionEnd = () => {
        isComposing.current = false;
    };

    const setSelection = (selectionStart: number | null, selectionEnd: number | null) => {
        if (selectionStart === null || selectionEnd === null) return;

        const el = inputElement.current;
        if (el?.setSelectionRange) {
            el.setSelectionRange(selectionStart, selectionEnd);
        } else if (el && (el as any).createTextRange) {
            const range = (el as any).createTextRange();
            range.collapse(true);
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
            range.select();
        }
    };

    const updateSuggestions = (
        currentQuery: number,
        childIndex: number,
        query: string,
        querySequenceStart: number,
        querySequenceEnd: number,
        plainTextValue: string,
        results: Data[],
    ) => {
        // neglect async results from previous queries
        if (currentQuery !== queryId.current) return;

        // save in property so that multiple sync state updates from different mentions sources
        // won't overwrite each other
        const newSuggestions = {
            ...suggestions,
            [childIndex]: {
                queryInfo: {
                    childIndex,
                    query,
                    querySequenceStart,
                    querySequenceEnd,
                    plainTextValue,
                },
                results,
            },
        };

        const suggestionsCount = countSuggestions(newSuggestions);
        setSuggestions(newSuggestions);
        setFocusIndex(focusIndex >= suggestionsCount ? Math.max(suggestionsCount - 1, 0) : focusIndex);
    };

    const queryData = (
        query: string,
        childIndex: number,
        querySequenceStart: number,
        querySequenceEnd: number,
        plainTextValue: string,
    ) => {
        const { children, ignoreAccents } = props;
        const mentionChild = Children.toArray(children)[childIndex] as React.ReactElement;
        const provideData = getDataProvider(mentionChild.props.data, ignoreAccents);
        const syncResult = provideData(query);

        if (syncResult instanceof Array) {
            updateSuggestions(
                queryId.current,
                childIndex,
                query,
                querySequenceStart,
                querySequenceEnd,
                plainTextValue,
                syncResult,
            );
        }
    };

    const updateMentionsQueries = (plainTextValue: string, caretPosition: number) => {
        // Invalidate previous queries. Async results for previous queries will be neglected.
        queryId.current++;
        setSuggestions({});

        const { value, children } = props;
        const config = readConfigFromChildren(children);

        const positionInValue = mapPlainTextIndex(value, config, caretPosition, 'NULL');

        // If caret is inside of mention, do not query
        if (positionInValue === null) {
            return;
        }

        // Extract substring in between the end of the previous mention and the caret
        const substringStartIndex = getEndOfLastMention(value.substring(0, positionInValue), config);
        const substring = plainTextValue.substring(substringStartIndex, caretPosition);

        // Check if suggestions have to be shown:
        // Match the trigger patterns of all Mention children on the extracted substring
        React.Children.forEach(children, (child, childIndex) => {
            if (!child) {
                return;
            }

            const regex = makeTriggerRegex(props.trigger, props.allowSpaceInQuery);
            const match = substring.match(regex);
            if (match) {
                const querySequenceStart = substringStartIndex + substring.indexOf(match[1], match.index);
                queryData(
                    match[2],
                    childIndex,
                    querySequenceStart,
                    querySequenceStart + match[1].length,
                    plainTextValue,
                );
            }
        });
    };

    const clearSuggestions = () => {
        // Invalidate previous queries. Async results for previous queries will be neglected.
        queryId.current++;
        setSuggestions({});
        setFocusIndex(0);
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
        const config = readConfigFromChildren(props.children);
        const mentionsChild = Children.toArray(props.children)[childIndex] as React.ReactElement;
        const { markup, displayTransform, appendSpaceOnAdd, onAdd } = mentionsChild.props;

        const start = mapPlainTextIndex(props.value, config, querySequenceStart, 'START');
        if (!isNumber(start)) {
            return;
        }

        const end = start + querySequenceEnd - querySequenceStart;

        let insert = makeMentionsMarkup(markup, id, display);

        if (appendSpaceOnAdd) {
            insert += ' ';
        }
        const newValue = spliceString(props.value, start, end, insert);

        // Refocus input and set caret position to end of mention
        inputElement.current?.focus();

        let displayValue = displayTransform(id, display);
        if (appendSpaceOnAdd) {
            displayValue += ' ';
        }
        const newCaretPosition = querySequenceStart + displayValue.length;
        setSelectionStart(newCaretPosition);
        setSelectionEnd(newCaretPosition);
        setSelectionAfterMentionChange(true);

        // Propagate change
        const eventMock = { target: { value: newValue } };
        const mentions = getMentions(newValue, config);
        const newPlainTextValue = spliceString(plainTextValue, querySequenceStart, querySequenceEnd, displayValue);

        props.onChange(eventMock as React.ChangeEvent<HTMLInputElement>, newValue, newPlainTextValue, mentions);

        if (onAdd) {
            onAdd(id, display, start, end);
        }

        // Make sure the suggestions overlay is closed
        clearSuggestions();
    };

    const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        console.log('Ev: ', ev);

        const value = props.value || '';
        const config = readConfigFromChildren(props.children);

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
        setSelectionAfterMentionChange(selectionAfterMentionChange);

        const mentions = getMentions(newValue, config);

        if ((ev.nativeEvent as any).isComposing && selectionStart === selectionEnd) {
            updateMentionsQueries(inputElement.current?.value || '', selectionStart || 0);
        }

        // Propagate change
        const eventMock = { ...ev, target: { ...ev.target, value: newValue } };
        props.onChange(eventMock, newValue, newPlainTextValue, mentions);
    };

    const handleSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        // keep track of selection range / caret position
        setSelectionStart(ev.target.selectionStart);
        setSelectionEnd(ev.target.selectionEnd);

        // do nothing while a IME composition session is active
        if (isComposing) return;

        // refresh suggestions queries
        const el = inputElement.current;
        if (ev.target.selectionStart === ev.target.selectionEnd) {
            updateMentionsQueries(el?.value || '', ev.target.selectionStart || 0);
        } else {
            clearSuggestions();
        }

        // sync highlighters scroll position
        // TODO
        // this.updateHighlighterScroll();

        props.onSelect?.(ev);
    };

    const inputProps: TextFieldProps = {
        value: getPlainText(props.value, readConfigFromChildren(props.children)),
        onChange: handleChange,
        onSelect: handleSelect,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        onCompositionStart: handleCompositionStart,
        onCompositionEnd: handleCompositionEnd,
    };

    return (
        <Box ref={containerElement}>
            <Box id='mui-mentions-control'>
                <Highlighter containerRef={highlighterElement} />
                <TextField inputRef={inputElement} {...inputProps} />
            </Box>
            <SuggestionsOverlay
                id={suggestionsOverlayId}
                open={selectionStart !== undefined}
                containerRef={suggestionsElement}
                // TODO
                suggestions={suggestions}
                scrollFocusedIntoView={scrollFocusedIntoView}
                focusIndex={focusIndex}
                loading={false}
                left={suggestionsOverlayPosition?.left || 0}
                top={suggestionsOverlayPosition?.top || 0}
                right={suggestionsOverlayPosition?.right || 0}
                onSelect={addMention}
                onMouseDown={handleSuggestionsMouseDown}
                onMouseEnter={handleSuggestionsMouseEnter}
                ignoreAccents={props.ignoreAccents}
            >
                {props.children}
            </SuggestionsOverlay>
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
