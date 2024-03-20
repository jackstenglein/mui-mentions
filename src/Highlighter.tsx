import { Box, InputBaseComponentProps, OutlinedInput } from '@mui/material';
import React, { ReactNode } from 'react';
import Mention from './Mention';
import { BaseSuggestionData, SuggestionDataSource } from './types';
import { iterateMentionsMarkup } from './utils/utils';

interface HighlighterProps<T extends BaseSuggestionData> {
    /** Ref applied to the main container of the highlighter. */
    containerRef: React.RefObject<HTMLDivElement>;

    /** Ref applied to the element which keeps track of the cursor position. */
    cursorRef: React.RefObject<HTMLSpanElement>;

    /** The start of the selected text range in the plain text value. */
    selectionStart: number | null;

    /** The end of the selected text range in the plain text value. */
    selectionEnd: number | null;

    /** The markup value string. */
    value: string;

    /** The suggestion data sources used in the makup string. */
    dataSources: SuggestionDataSource<T>[];
}

function InternalHighlighter<T extends BaseSuggestionData>(props: HighlighterProps<T>): ReactNode {
    const { containerRef, cursorRef, selectionEnd, selectionStart, value, dataSources } = props;
    const components: JSX.Element[] = [];

    const handleMention = (_markup: string, index: number, _plainTextIndex: number, id: string, display: string) => {
        components.push(<Mention key={`${id}-${index}`} display={display} />);
    };

    const handlePlainText = (text: string, index: number, indexInPlaintext: number) => {
        if (
            selectionStart &&
            selectionStart === selectionEnd &&
            selectionStart >= indexInPlaintext &&
            selectionStart <= indexInPlaintext + text.length
        ) {
            const splitIndex = selectionStart - indexInPlaintext;
            const startText = text.substring(0, splitIndex);
            const endText = text.substring(splitIndex);

            if (startText) {
                components.push(
                    <Box key={`${index}-${indexInPlaintext}-precursor`} component='span' visibility='hidden'>
                        {text.substring(0, splitIndex)}
                    </Box>,
                );
            }

            components.push(<Box key='cursor' ref={cursorRef} component='span' visibility='hidden'></Box>);

            if (endText) {
                components.push(
                    <Box key={`${index}-${indexInPlaintext}-postcursor`} component='span' visibility='hidden'>
                        {text.substring(splitIndex)}
                    </Box>,
                );
            }
        } else {
            components.push(
                <Box key={`${index}-${indexInPlaintext}`} component='span' visibility='hidden'>
                    {text}
                </Box>,
            );
        }
    };

    iterateMentionsMarkup(value, dataSources, handleMention, handlePlainText);

    return (
        <Box
            ref={containerRef}
            sx={{ height: 1, width: 1, whiteSpace: 'pre-wrap', overflow: 'hidden', overscrollBehavior: 'none' }}
        >
            {components}
            <Box component='span' visibility='hidden'>
                .
            </Box>
        </Box>
    );
}

function Highlighter<T extends BaseSuggestionData>(props: HighlighterProps<T>) {
    return (
        <OutlinedInput
            inputComponent={InternalHighlighter as React.ElementType<InputBaseComponentProps>}
            inputProps={props}
            sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            multiline
            fullWidth
            minRows={3}
            maxRows={7}
        ></OutlinedInput>
    );
}

export default Highlighter;
