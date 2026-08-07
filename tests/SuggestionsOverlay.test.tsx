import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import SuggestionsOverlay from '../src/SuggestionsOverlay';
import { defaultDataSources, users } from './fixtures';

const theme = createTheme();

function renderOverlay(
    props: Partial<React.ComponentProps<typeof SuggestionsOverlay>> & {
        selectionStart?: number | null;
        selectionEnd?: number | null;
        value?: string;
    } = {},
) {
    const cursorRef = createRef<HTMLSpanElement>();
    const onSelect = vi.fn();
    const onMouseDown = vi.fn();

    const result = render(
        <ThemeProvider theme={theme}>
            <span ref={cursorRef} />
            <SuggestionsOverlay
                value={props.value ?? 'Hello @kal'}
                dataSources={defaultDataSources}
                selectionStart={props.selectionStart === undefined ? 10 : props.selectionStart}
                selectionEnd={props.selectionEnd === undefined ? 10 : props.selectionEnd}
                cursorRef={cursorRef}
                loading={false}
                onSelect={onSelect}
                onMouseDown={onMouseDown}
                {...props}
            />
        </ThemeProvider>,
    );

    return { ...result, onSelect, onMouseDown, cursorRef };
}

describe('SuggestionsOverlay', () => {
    it('renders nothing when there is no caret selection', () => {
        const { container } = renderOverlay({ selectionStart: null, selectionEnd: null });
        expect(container.querySelector('[role="option"]')).toBeNull();
    });

    it('renders nothing when the selection is a range', () => {
        const { container } = renderOverlay({ selectionStart: 2, selectionEnd: 5, value: 'Hello' });
        expect(container.querySelector('[role="option"]')).toBeNull();
    });

    it('shows matching suggestions for a trigger query', async () => {
        renderOverlay();
        await waitFor(() => {
            expect(screen.getByRole('option', { name: 'Kaladin Stormblessed' })).toBeInTheDocument();
        });
        expect(screen.queryByRole('option', { name: 'Shallan Davar' })).not.toBeInTheDocument();
    });

    it('calls onSelect when a suggestion is clicked', async () => {
        const user = userEvent.setup();
        const { onSelect } = renderOverlay();

        const option = await screen.findByRole('option', { name: 'Kaladin Stormblessed' });
        await user.click(option);

        expect(onSelect).toHaveBeenCalledWith(
            users[0],
            expect.objectContaining({
                childIndex: 0,
                query: 'kal',
            }),
        );
    });

    it('navigates suggestions with arrow keys and selects with Enter', async () => {
        const user = userEvent.setup();
        const { onSelect } = renderOverlay({
            value: 'Hello @',
            selectionStart: 7,
            selectionEnd: 7,
        });

        await screen.findByRole('option', { name: 'Kaladin Stormblessed' });

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');

        expect(onSelect).toHaveBeenCalledWith(
            users[1],
            expect.objectContaining({
                query: '',
            }),
        );
    });

    it('clears suggestions when Escape is pressed', async () => {
        const user = userEvent.setup();
        renderOverlay();

        await screen.findByRole('option', { name: 'Kaladin Stormblessed' });
        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('option')).not.toBeInTheDocument();
        });
    });

    it('loads suggestions from an async data source', async () => {
        const asyncSource = [
            {
                data: async (query: string) =>
                    users.filter((u) => u.display?.toLowerCase().includes(query.toLowerCase())),
            },
        ];

        renderOverlay({
            dataSources: asyncSource,
            value: 'Hi @sha',
            selectionStart: 7,
            selectionEnd: 7,
        });

        expect(await screen.findByRole('option', { name: 'Shallan Davar' })).toBeInTheDocument();
    });
});
