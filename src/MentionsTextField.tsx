import { Box, TextField, TextFieldProps, TextFieldVariants } from '@mui/material';
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
    value: string;

    /**
     * Callback invoked as the value of the TextField changes.
     * @param newValue The new markup value of the TextField.
     * @param newPlainText The new plain text value of the TextField, with
     *   mention markup converted to display strings.
     * @param mentions A list of mentions in the TextField.
     */
    onChange: (newValue: string, newPlainText: string, mentions: MentionData[]) => void;

    /**
     * A list of data sources used to populate the suggestions overlay.
     */
    dataSources: SuggestionDataSource<T>[];
}

export type MentionsTextFieldProps<
    T extends BaseSuggestionData,
    Variant extends TextFieldVariants = TextFieldVariants,
> = Omit<TextFieldProps<Variant>, 'onChange'> & MentionsTextFieldBaseProps<T>;

function MentionsTextField<T extends BaseSuggestionData>(props: MentionsTextFieldProps<T>): ReactNode {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const suggestionsMouseDown = useRef(false);

    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

    useEffect(() => {
        const input = inputRef.current;
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
        const input = inputRef.current;
        if (!input || (input.selectionStart === selectionStart && input.selectionEnd === selectionEnd)) {
            return;
        }
        input.setSelectionRange(selectionStart, selectionEnd);
    }, [selectionStart, selectionEnd, inputRef]);

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
        const dataSource = props.dataSources[childIndex];

        const { markup, displayTransform, appendSpaceOnAdd, onAdd } = dataSource;

        const start = mapPlainTextIndex(props.value, props.dataSources, querySequenceStart, 'START');
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
        const newValue = spliceString(props.value, start, end, insert);
        const mentions = getMentions(newValue, props.dataSources);
        const newPlainTextValue = spliceString(plainTextValue, querySequenceStart, querySequenceEnd, displayValue);

        props.onChange(newValue, newPlainTextValue, mentions);
        onAdd?.(suggestion, start, end);
    };

    const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = props.value || '';

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
            props.dataSources,
        );

        // In case a mention is deleted, also adjust the new plain text value
        newPlainTextValue = getPlainText(newValue, props.dataSources);

        // Save current selection after change to be able to restore caret position after rerendering
        let selectionStartAfter = ev.target.selectionStart;
        let selectionEndAfter = ev.target.selectionEnd;

        // Adjust selection range in case a mention will be deleted by the characters outside of the
        // selection range that are automatically deleted
        const startOfMention = findStartOfMentionInPlainText(value, props.dataSources, ev.target.selectionStart || 0);
        if (startOfMention !== undefined && selectionEndAfter !== null && selectionEndAfter > startOfMention) {
            // only if a deletion has taken place
            const data = (ev.nativeEvent as any).data;
            selectionStartAfter = startOfMention + (data ? data.length : 0);
            selectionEndAfter = selectionStartAfter;
        }

        setSelectionStart(selectionStartAfter);
        setSelectionEnd(selectionEndAfter);

        const mentions = getMentions(newValue, props.dataSources);

        // Propagate change
        props.onChange(newValue, newPlainTextValue, mentions);
    };

    const handleSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setSelectionStart(ev.target.selectionStart);
        setSelectionEnd(ev.target.selectionEnd);
        props.onSelect?.(ev);
    };

    const { value, dataSources, ...others } = props;
    const inputProps: TextFieldProps = {
        ...others,
        value: getPlainText(value, dataSources),
        onChange: handleChange,
        onSelect: handleSelect,
        onBlur: handleBlur,
        inputProps: {
            sx: { overscrollBehavior: 'none' },
        },
    };

    return (
        <Box>
            <Box id='mui-mentions-control' sx={{ position: 'relative' }}>
                <Highlighter
                    highlighterRef={highlighterRef}
                    cursorRef={cursorRef}
                    selectionStart={selectionStart}
                    selectionEnd={selectionEnd}
                    value={value}
                    dataSources={dataSources}
                    inputRef={inputRef}
                    multiline={inputProps.multiline}
                />
                <TextField inputRef={inputRef} {...inputProps} />
            </Box>
            <SuggestionsOverlay
                value={props.value}
                dataSources={props.dataSources}
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
                cursorRef={cursorRef}
                loading={false}
                onSelect={addMention}
                onMouseDown={handleSuggestionsMouseDown}
            />
        </Box>
    );
}

export default MentionsTextField;
