import { useState } from 'react';
import { Position } from './MentionsTextField';
import { Box } from '@mui/material';
import React from 'react';

interface HighlighterProps {
    containerRef: React.RefObject<HTMLDivElement>;
}

const Highlighter: React.FC<HighlighterProps> = ({ containerRef }) => {
    const [position, setPosition] = useState<Position>({ top: 0, left: 0, right: 0 });

    return <Box ref={containerRef}></Box>;
};

export default Highlighter;
