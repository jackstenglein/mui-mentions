import { useLayoutEffect, useState } from 'react';
import { DataSource, Position } from './MentionsTextField';
import { Box, Input, InputBase, InputBaseComponentProps, OutlinedInput } from '@mui/material';
import React from 'react';
import { iterateMentionsMarkup, readConfigFromChildren } from './utils/utils';
import Mention from './Mention';

interface HighlighterProps {
    containerRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
    value: string;
    dataSources: DataSource[];
}

const InternalHighlighter: React.FC<HighlighterProps> = ({ containerRef, inputRef, value, dataSources }) => {
    const components: JSX.Element[] = [];

    const handleMention = (
        _markup: string,
        index: number,
        _plainTextIndex: number,
        id: string,
        display: string,
        _mentionIndex: number,
        _start: number,
    ) => {
        components.push(<Mention key={`${id}-${index}`} display={display} />);
    };

    const handlePlainText = (text: string) => {
        components.push(
            <Box component='span' visibility='hidden'>
                {text}
            </Box>,
        );
    };

    const config = readConfigFromChildren(dataSources);
    iterateMentionsMarkup(value, config, handleMention, handlePlainText);

    return (
        <Box
            ref={containerRef}
            sx={{ height: 1, width: 1, whiteSpace: 'pre-wrap', overflow: 'scroll', overscrollBehavior: 'none' }}
        >
            {components}
            <Box component='span' visibility='hidden'>
                .
            </Box>
        </Box>
    );
};

const Highlighter: React.FC<HighlighterProps> = (props) => {
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
};

export default Highlighter;
