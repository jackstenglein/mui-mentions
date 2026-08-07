import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import Suggestion from '../src/Suggestion';
import { users } from './fixtures';

const theme = createTheme();

function renderSuggestion(props: Partial<React.ComponentProps<typeof Suggestion>> = {}) {
    const suggestion = users[0];
    return render(
        <ThemeProvider theme={theme}>
            <Suggestion id={suggestion.id} query='kal' index={0} suggestion={suggestion} {...props} />
        </ThemeProvider>,
    );
}

describe('Suggestion', () => {
    it('renders the suggestion display text', () => {
        renderSuggestion();
        expect(screen.getByRole('option', { name: 'Kaladin Stormblessed' })).toBeInTheDocument();
    });

    it('falls back to id when display is missing', () => {
        renderSuggestion({ suggestion: { id: 'syl' } });
        expect(screen.getByRole('option', { name: 'syl' })).toBeInTheDocument();
    });

    it('marks the option as selected when focused', () => {
        renderSuggestion({ focused: true });
        expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
    });

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        renderSuggestion({ onClick });
        await user.click(screen.getByRole('option'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('calls onMouseEnter when hovered', async () => {
        const user = userEvent.setup();
        const onMouseEnter = vi.fn();
        renderSuggestion({ onMouseEnter });
        await user.hover(screen.getByRole('option'));
        expect(onMouseEnter).toHaveBeenCalledOnce();
    });

    it('uses a custom renderSuggestion when provided', () => {
        renderSuggestion({
            renderSuggestion: ({ suggestion }) => <div data-testid='custom'>{suggestion.display}</div>,
        });
        expect(screen.getByTestId('custom')).toHaveTextContent('Kaladin Stormblessed');
        expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    describe('avatar', () => {
        it('does not render an avatar by default', () => {
            const { container } = renderSuggestion();
            expect(container.querySelector('.MuiAvatar-root')).not.toBeInTheDocument();
        });

        it('does not render an avatar when showAvatar is false', () => {
            const { container } = renderSuggestion({ showAvatar: false });
            expect(container.querySelector('.MuiAvatar-root')).not.toBeInTheDocument();
        });

        it('renders initials from a multi-word display name when showAvatar is true', () => {
            const { container } = renderSuggestion({ showAvatar: true });
            const avatar = container.querySelector('.MuiAvatar-root');
            expect(avatar).toBeInTheDocument();
            expect(avatar).toHaveTextContent('KS');
            expect(avatar?.querySelector('img')).not.toBeInTheDocument();
        });

        it('renders the first two characters as initials for a single-word display', () => {
            const { container } = renderSuggestion({
                showAvatar: true,
                suggestion: { id: 'syl', display: 'Syl' },
            });
            expect(container.querySelector('.MuiAvatar-root')).toHaveTextContent('SY');
        });

        it('derives initials from the id when display is missing', () => {
            const { container } = renderSuggestion({
                showAvatar: true,
                suggestion: { id: 'teft' },
            });
            expect(container.querySelector('.MuiAvatar-root')).toHaveTextContent('TE');
        });

        it('renders an image avatar when suggestion.image is set', () => {
            renderSuggestion({
                showAvatar: true,
                suggestion: {
                    id: 'kaladin',
                    display: 'Kaladin Stormblessed',
                    image: 'https://example.com/kaladin.png',
                },
            });
            const img = screen.getByRole('img', { name: 'Kaladin Stormblessed' });
            expect(img).toHaveAttribute('src', 'https://example.com/kaladin.png');
        });

        it('applies avatarSx to the Avatar', () => {
            const { container } = renderSuggestion({
                showAvatar: true,
                avatarSx: { width: 32, height: 32 },
            });
            const avatar = container.querySelector('.MuiAvatar-root');
            expect(avatar).toBeInTheDocument();
            expect(avatar).toHaveStyle({ width: '32px', height: '32px' });
        });
    });
});
