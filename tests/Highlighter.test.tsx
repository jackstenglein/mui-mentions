import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import React, { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import Highlighter from '../src/Highlighter';
import { defaultDataSources, markupValue } from './fixtures';

const theme = createTheme();

function renderHighlighter(props: Partial<React.ComponentProps<typeof Highlighter>> = {}) {
    const highlighterRef = createRef<HTMLDivElement>();
    const cursorRef = createRef<HTMLSpanElement>();
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    const input = document.createElement('input');
    parent.appendChild(input);

    Object.defineProperty(input, 'clientWidth', { value: 200 });
    Object.defineProperty(input, 'clientHeight', { value: 40 });
    Object.defineProperty(input, 'offsetLeft', { value: 8 });
    Object.defineProperty(input, 'offsetTop', { value: 8 });

    const result = render(
        <ThemeProvider theme={theme}>
            <Highlighter
                highlighterRef={highlighterRef}
                cursorRef={cursorRef}
                inputRef={input}
                selectionStart={props.selectionStart ?? null}
                selectionEnd={props.selectionEnd ?? null}
                value={props.value ?? markupValue}
                dataSources={defaultDataSources}
                {...props}
            />
        </ThemeProvider>,
    );

    return { ...result, highlighterRef, cursorRef, input, parent };
}

describe('Highlighter', () => {
    it('renders mention display text from markup', () => {
        renderHighlighter();
        expect(screen.getByText('Kaladin Stormblessed')).toBeInTheDocument();
        expect(screen.getByText((content) => content.startsWith('Hello,'))).toBeInTheDocument();
        expect(screen.getByText('!')).toBeInTheDocument();
    });

    it('places a cursor marker when selection is a caret', () => {
        const { cursorRef } = renderHighlighter({
            selectionStart: 3,
            selectionEnd: 3,
            value: 'Hello',
        });
        expect(cursorRef.current).not.toBeNull();
    });

    it('portals the highlighter into the input parent', () => {
        const { parent, highlighterRef } = renderHighlighter();
        expect(parent.contains(highlighterRef.current)).toBe(true);
    });
});
