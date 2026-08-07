import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef, useState } from 'react';
import { describe, expect, it, Mock, vi } from 'vitest';
import MentionsTextField, { MentionsTextFieldProps } from '../src/MentionsTextField';
import { BaseSuggestionData, MentionData } from '../src/types';
import { defaultDataSources, markupValue, plainTextValue, users } from './fixtures';

const theme = createTheme();

function renderField(props: Partial<MentionsTextFieldProps<BaseSuggestionData>> = {}) {
    return render(
        <ThemeProvider theme={theme}>
            <MentionsTextField label='Mentions' dataSources={defaultDataSources} {...props} />
        </ThemeProvider>,
    );
}

function ControlledMentionsTextField(
    props: Partial<MentionsTextFieldProps<BaseSuggestionData>> & {
        onChangeSpy?: (value: string, plainText: string, mentions: MentionData[]) => void;
    },
) {
    const { onChangeSpy, defaultValue = '', ...rest } = props;
    const [value, setValue] = useState(defaultValue);

    return (
        <MentionsTextField
            label='Mentions'
            dataSources={defaultDataSources}
            {...rest}
            value={value}
            onChange={(newValue, plainText, mentions) => {
                setValue(newValue);
                onChangeSpy?.(newValue, plainText, mentions);
            }}
        />
    );
}

function renderControlled(props: Partial<React.ComponentProps<typeof ControlledMentionsTextField>> = {}) {
    const onChangeSpy = props.onChangeSpy ?? vi.fn();
    const result = render(
        <ThemeProvider theme={theme}>
            <ControlledMentionsTextField {...props} onChangeSpy={onChangeSpy} />
        </ThemeProvider>,
    );
    return { ...result, onChangeSpy };
}

describe('MentionsTextField', () => {
    it('renders a labeled text field', () => {
        renderField();
        expect(screen.getByLabelText('Mentions')).toBeInTheDocument();
    });

    it('displays plain text for a controlled markup value', () => {
        renderField({ value: markupValue });
        expect(screen.getByLabelText('Mentions')).toHaveValue(plainTextValue);
    });

    it('displays plain text for an uncontrolled defaultValue', () => {
        renderField({ defaultValue: markupValue });
        expect(screen.getByLabelText('Mentions')).toHaveValue(plainTextValue);
    });

    it('calls onChange with markup, plain text, and mentions when typing', async () => {
        const user = userEvent.setup();
        const { onChangeSpy } = renderControlled();

        const input = screen.getByLabelText('Mentions');
        await user.type(input, 'Hi');

        expect(onChangeSpy).toHaveBeenCalled();
        const [lastMarkup, lastPlain, lastMentions] = (onChangeSpy as Mock).mock.calls.at(-1)!;
        expect(lastMarkup).toBe('Hi');
        expect(lastPlain).toBe('Hi');
        expect(lastMentions).toEqual([]);
    });

    it('shows suggestions after typing the trigger character', async () => {
        const user = userEvent.setup();
        renderControlled();

        const input = screen.getByLabelText('Mentions');
        await user.click(input);
        await user.type(input, '@kal');

        expect(await screen.findByRole('option', { name: 'Kaladin Stormblessed' })).toBeInTheDocument();
    });

    it('inserts a mention when a suggestion is selected', async () => {
        const user = userEvent.setup();
        const { onChangeSpy } = renderControlled();

        const input = screen.getByLabelText('Mentions');
        await user.click(input);
        await user.type(input, '@kal');

        await user.click(await screen.findByRole('option', { name: 'Kaladin Stormblessed' }));

        await waitFor(() => {
            expect(onChangeSpy).toHaveBeenCalledWith('@[Kaladin Stormblessed](kaladin)', 'Kaladin Stormblessed', [
                expect.objectContaining({
                    id: 'kaladin',
                    display: 'Kaladin Stormblessed',
                }),
            ]);
        });
    });

    it('appends a space after a mention when appendSpaceOnAdd is set', async () => {
        const user = userEvent.setup();
        const onAdd = vi.fn();
        const { onChangeSpy } = renderControlled({
            dataSources: [{ data: users, appendSpaceOnAdd: true, onAdd }],
        });

        const input = screen.getByLabelText('Mentions');
        await user.click(input);
        await user.type(input, '@kal');
        await user.click(await screen.findByRole('option', { name: 'Kaladin Stormblessed' }));

        await waitFor(() => {
            expect(onChangeSpy).toHaveBeenCalledWith(
                '@[Kaladin Stormblessed](kaladin) ',
                'Kaladin Stormblessed ',
                expect.any(Array),
            );
        });
        expect(onAdd).toHaveBeenCalledWith(users[0], expect.any(Number), expect.any(Number));
    });

    it('forwards an inputRef to the underlying input', () => {
        const inputRef = createRef<HTMLInputElement | HTMLTextAreaElement>();
        renderField({ inputRef });
        expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
        expect(inputRef.current).toHaveAttribute('type', 'text');
    });

    it('supports a custom trigger character', async () => {
        const user = userEvent.setup();
        renderControlled({
            dataSources: [{ data: users, trigger: '#' }],
        });

        const input = screen.getByLabelText('Mentions');
        await user.click(input);
        await user.type(input, '#sha');

        expect(await screen.findByRole('option', { name: 'Shallan Davar' })).toBeInTheDocument();
    });

    it('updates uncontrolled state when typing without onChange', async () => {
        const user = userEvent.setup();
        renderField({ defaultValue: '' });

        const input = screen.getByLabelText('Mentions');
        await user.type(input, 'Hello');
        expect(input).toHaveValue('Hello');
    });
});
