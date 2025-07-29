import { TextField, TextFieldProps, TextFieldVariants } from '@mui/material';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Highlighter from './Highlighter';
import SuggestionsOverlay from './SuggestionsOverlay';
import {
    BaseSuggestionData,
    DefaultDisplayTransform,
    DefaultMarkupTemplate,
    DefaultTrigger,
    MentionData,
    MentionsTextFieldOptions,
    SuggestionData,
    SuggestionDataSource,
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
     * Collection of initiation options for the field
     */
    options?: MentionsTextFieldOptions;

    /**
     * If true, mentions will be highlighted with text color (theme.palette.primary.main)
     * instead of background color.
     * @default false
     */
    highlightTextColor?: boolean;

    /**
     * If true, shows the trigger character (@ or #) in the displayed mention text.
     * @default false
     */
    showTriggerInDisplay?: boolean;
}

export type MentionsTextFieldProps<
    T extends BaseSuggestionData,
    Variant extends TextFieldVariants = TextFieldVariants,
> = Omit<TextFieldProps<Variant>, 'onChange' | 'defaultValue'> & MentionsTextFieldBaseProps<T>;

function MentionsTextField<T extends BaseSuggestionData>(props: MentionsTextFieldProps<T>): ReactNode {
    const [stateValue, setStateValue] = useState<string>(props.defaultValue || '');

    const [inputRef, setInputRef] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const suggestionsMouseDown = useRef(false);

    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

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
        highlightTextColor,
        options,
        showTriggerInDisplay,
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
        { childIndex, querySequenceStart, querySequenceEnd, plainTextValue: _plainTextValue }: SuggestionsQueryInfo,
    ) => {
        const dataSource = dataSources[childIndex];

        const { markup, displayTransform, appendSpaceOnAdd, onAdd } = dataSource;

        const start = mapPlainTextIndex(finalValue, dataSources, querySequenceStart, 'START', showTriggerInDisplay);
        if (!isNumber(start)) {
            return;
        }

        const end = start + querySequenceEnd - querySequenceStart;

        let insert = makeMentionsMarkup(markup || DefaultMarkupTemplate, suggestion.id, suggestion.display);
        let displayValue = (displayTransform || DefaultDisplayTransform)(suggestion.id, suggestion.display);

        // Add trigger prefix if showTriggerInDisplay is true
        if (showTriggerInDisplay) {
            const trigger = dataSource.trigger || DefaultTrigger;
            displayValue = trigger + displayValue;
        }

        if (appendSpaceOnAdd) {
            insert += ' ';
            displayValue += ' ';
        }

        const newCaretPosition = querySequenceStart + displayValue.length;
        setSelectionStart(newCaretPosition);
        setSelectionEnd(newCaretPosition);
        // Propagate change
        const newValue = spliceString(finalValue, start, end, insert);
        const mentions = getMentions(newValue, dataSources, showTriggerInDisplay);

        const newPlainTextValue = getPlainText(newValue, dataSources, props.multiline, showTriggerInDisplay);

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
            showTriggerInDisplay,
        );

        // In case a mention is deleted, also adjust the new plain text value
        newPlainTextValue = getPlainText(newValue, dataSources, props.multiline, showTriggerInDisplay);

        // Save current selection after change to be able to restore caret position after rerendering
        let selectionStartAfter = ev.target.selectionStart;
        let selectionEndAfter = ev.target.selectionEnd;

        // Adjust selection range in case a mention will be deleted by the characters outside of the
        // selection range that are automatically deleted
        const cursorPosition = ev.target.selectionStart || 0;
        const startOfMention = findStartOfMentionInPlainText(
            finalValue,
            dataSources,
            cursorPosition,
            showTriggerInDisplay,
        );

        if (startOfMention !== undefined && selectionEndAfter !== null && selectionEndAfter > startOfMention) {
            // only if a deletion has taken place
            const data = (ev.nativeEvent as any).data;
            selectionStartAfter = startOfMention + (data ? data.length : 0);
            selectionEndAfter = selectionStartAfter;
        }

        setSelectionStart(selectionStartAfter);
        setSelectionEnd(selectionEndAfter);

        const mentions = getMentions(newValue, dataSources, showTriggerInDisplay);

        // Propagate change
        const onChange = props.onChange || setStateValue;
        onChange(newValue, newPlainTextValue, mentions);
    };

    const handleSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setSelectionStart(ev.target.selectionStart);
        setSelectionEnd(ev.target.selectionEnd);
        props.onSelect?.(ev);
    };

    const inputFieldText = getPlainText(finalValue, dataSources, props.multiline, showTriggerInDisplay);

    const inputProps: TextFieldProps = {
        ...others,
        value: inputFieldText,
        onChange: handleChange,
        onSelect: handleSelect,
        onBlur: handleBlur,
        inputProps: {
            sx: {
                overscrollBehavior: 'none',
                color: highlightTextColor ? 'transparent' : 'inherit',
                caretColor: highlightTextColor ? 'black' : 'inherit',
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
                showTriggerInDisplay={showTriggerInDisplay}
            />
            <TextField inputRef={(ref) => setInputRef(ref)} {...inputProps} />
            <SuggestionsOverlay
                value={finalValue}
                dataSources={dataSources}
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
                cursorRef={cursorRef}
                loading={false}
                onSelect={addMention}
                onMouseDown={handleSuggestionsMouseDown}
                options={options}
                showTriggerInDisplay={showTriggerInDisplay}
            />
        </>
    );
}

export default MentionsTextField;
