import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Mention from '../src/Mention';

const theme = createTheme();

function renderMention(props: React.ComponentProps<typeof Mention>) {
    return render(
        <ThemeProvider theme={theme}>
            <Mention {...props} />
        </ThemeProvider>,
    );
}

describe('Mention', () => {
    it('renders the display text', () => {
        renderMention({ display: 'Kaladin Stormblessed' });
        expect(screen.getByText('Kaladin Stormblessed')).toBeInTheDocument();
    });

    it('renders a highlight overlay by default', () => {
        const { container } = renderMention({ display: 'Kaladin' });
        // Outer span + absolute highlight overlay
        expect(container.querySelectorAll('span')).toHaveLength(2);
    });

    it('omits the highlight overlay when highlightTextColor is true', () => {
        const { container } = renderMention({ display: 'Kaladin', highlightTextColor: true });
        expect(container.querySelectorAll('span')).toHaveLength(1);
    });
});
