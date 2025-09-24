import { TextField, TextFieldProps, TextFieldVariants } from '@mui/material';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Highlighter from './Highlighter';
import SuggestionsOverlay from './SuggestionsOverlay';
import {
    BaseSuggestionData,
    DefaultDisplayTransform,
    DefaultMarkupTemplate,
    MentionData,
    SuggestionData,
    SuggestionDataSource,
    SuggestionOverlaySlotProps,
    SuggestionsQueryInfo,
} from './types';
import {
    applyChangeToValue,
    findStartOfMentionInPlainText,
    getMentions,
    getPlainText,
    isNumber,
    makeMentionsMarkup,
    mapPlainTextIndex,
    spliceString,
} from './utils/utils';

interface MentionsTextFieldBaseProps<T extends BaseSuggestionData> {
    /**
     * The current value of the TextField, potentially containing mention
     * markup.
     */
    value?: string;

    /** The default value. Use when the component is not controlled. */
    defaultValue?: string;

    /**
     * Callback invoked as the value of the TextField changes.
     * @param newValue The new markup value of the TextField.
     * @param newPlainText The new plain text value of the TextField, with
     *   mention markup converted to display strings.
     * @param mentions A list of mentions in the TextField.
     */
    onChange?: (newValue: string, newPlainText: string, mentions: MentionData[]) => void;

    /**
     * A list of data sources used to populate the suggestions overlay.
     */
    dataSources: SuggestionDataSource<T>[];

    /**
     * The color of the mention highlights.
     * @default 'primary.light'
     */
    highlightColor?: string;

    /**
     * A ref to the underlying input element.
     */
    inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;

    /**
     * If true, mentions will be highlighted with text color instead of background color.
     * The text color will be set to hightlightColor (or color if highlightColor is unspecified).
     * @default false
     */
    highlightTextColor?: boolean;

    /**
     * The additional props for inner components. Currently only `suggestionsOverlay` is supported.
     */
    slotProps?: {
        suggestionsOverlay?: SuggestionOverlaySlotProps;
    };
}

export type MentionsTextFieldProps<
    T extends BaseSuggestionData,
    Variant extends TextFieldVariants = TextFieldVariants,
> = Omit<TextFieldProps<Variant>, 'onChange' | 'defaultValue' | 'inputRef'> & MentionsTextFieldBaseProps<T>;

function MentionsTextField<T extends BaseSuggestionData>(props: MentionsTextFieldProps<T>): ReactNode {
    const [stateValue, setStateValue] = useState<string>(props.defaultValue || '');

    const [inputRef, setInputRef] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const suggestionsMouseDown = useRef(false);

    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

    // Function to handle both internal and external refs
    const handleInputRef = (ref: HTMLInputElement | HTMLTextAreaElement | null) => {
        setInputRef(ref);

        // Also set the external ref if provided
        if (externalInputRef) {
            if (typeof externalInputRef === 'function') {
                externalInputRef(ref);
            } else if (externalInputRef && 'current' in externalInputRef && typeof externalInputRef !== 'function') {
                (externalInputRef as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current =
                    ref;
            }
        }
    };

    useEffect(() => {
        const input = inputRef;
        const onScroll = () => {
            if (!highlighterRef.current || !input) {
                return;
            }
            highlighterRef.current.scrollLeft = input.scrollLeft;
            highlighterRef.current.scrollTop = input.scrollTop;
        };

        input?.addEventListener('scroll', onScroll);
        return () => input?.removeEventListener('scroll', onScroll);
    }, [inputRef, highlighterRef]);

    useEffect(() => {
        const input = inputRef;
        if (!input || (input.selectionStart === selectionStart && input.selectionEnd === selectionEnd)) {
            return;
        }
        input.setSelectionRange(selectionStart, selectionEnd);
    }, [selectionStart, selectionEnd, inputRef]);

    const {
        value,
        defaultValue: _defaultValue,
        dataSources,
        highlightColor,
        inputRef: externalInputRef,
        highlightTextColor,
        ...others
    } = props;
    const finalValue = value !== undefined ? value : stateValue;

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
        suggestion: SuggestionData<T>,
        { childIndex, querySequenceStart, querySequenceEnd, plainTextValue }: SuggestionsQueryInfo,
    ) => {
        const dataSource = dataSources[childIndex];

        const { markup, displayTransform, appendSpaceOnAdd, onAdd } = dataSource;

        const start = mapPlainTextIndex(finalValue, dataSources, querySequenceStart, 'START');
        if (!isNumber(start)) {
            return;
        }

        const end = start + querySequenceEnd - querySequenceStart;

        let insert = makeMentionsMarkup(markup || DefaultMarkupTemplate, suggestion.id, suggestion.display);
        let displayValue = (displayTransform || DefaultDisplayTransform)(suggestion.id, suggestion.display);

        if (appendSpaceOnAdd) {
            insert += ' ';
            displayValue += ' ';
        }

        const newCaretPosition = querySequenceStart + displayValue.length;
        setSelectionStart(newCaretPosition);
        setSelectionEnd(newCaretPosition);

        // Propagate change
        const newValue = spliceString(finalValue, start, end, insert);
        const mentions = getMentions(newValue, dataSources);
        const newPlainTextValue = spliceString(plainTextValue, querySequenceStart, querySequenceEnd, displayValue);

        const onChange = props.onChange || setStateValue;
        onChange(newValue, newPlainTextValue, mentions);
        onAdd?.(suggestion, start, end);
    };

    const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
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
            finalValue,
            newPlainTextValue,
            selectionStartBefore,
            selectionEndBefore,
            ev.target.selectionEnd || 0,
            dataSources,
            props.multiline,
        );

        // In case a mention is deleted, also adjust the new plain text value
        newPlainTextValue = getPlainText(newValue, dataSources);

        // Save current selection after change to be able to restore caret position after rerendering
        let selectionStartAfter = ev.target.selectionStart;
        let selectionEndAfter = ev.target.selectionEnd;

        // Adjust selection range in case a mention will be deleted by the characters outside of the
        // selection range that are automatically deleted
        const startOfMention = findStartOfMentionInPlainText(finalValue, dataSources, ev.target.selectionStart || 0);
        if (startOfMention !== undefined && selectionEndAfter !== null && selectionEndAfter > startOfMention) {
            // only if a deletion has taken place
            const data = (ev.nativeEvent as any).data;
            selectionStartAfter = startOfMention + (data ? data.length : 0);
            selectionEndAfter = selectionStartAfter;
        }

        setSelectionStart(selectionStartAfter);
        setSelectionEnd(selectionEndAfter);

        const mentions = getMentions(newValue, dataSources);

        // Propagate change
        const onChange = props.onChange || setStateValue;
        onChange(newValue, newPlainTextValue, mentions);
    };

    const handleSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setSelectionStart(ev.target.selectionStart);
        setSelectionEnd(ev.target.selectionEnd);
        props.onSelect?.(ev);
    };

    const inputProps: TextFieldProps = {
        ...others,
        value: getPlainText(finalValue, dataSources, props.multiline),
        onChange: handleChange,
        onSelect: handleSelect,
        onBlur: handleBlur,
        slotProps: {
            htmlInput: {
                sx: {
                    overscrollBehavior: 'none',
                    color: highlightTextColor ? 'transparent' : undefined,
                    caretColor: highlightTextColor ? (theme) => theme.palette.text.primary : undefined,
                },
            },
        },
    };

    return (
        <>
            <Highlighter
                highlighterRef={highlighterRef}
                cursorRef={cursorRef}
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
                value={finalValue}
                dataSources={dataSources}
                inputRef={inputRef}
                multiline={inputProps.multiline}
                color={highlightColor || props.color}
                highlightTextColor={highlightTextColor}
            />
            <TextField inputRef={handleInputRef} {...inputProps} />
            <SuggestionsOverlay
                value={finalValue}
                dataSources={dataSources}
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
                cursorRef={cursorRef}
                loading={false}
                onSelect={addMention}
                onMouseDown={handleSuggestionsMouseDown}
                slotProps={props.slotProps?.suggestionsOverlay}
            />
        </>
    );
}

export default MentionsTextField;
