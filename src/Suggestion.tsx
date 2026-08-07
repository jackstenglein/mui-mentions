import { Avatar, ListItemAvatar, ListItemButton } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import React, { ReactNode, type JSX } from 'react';
import { BaseSuggestionData, DefaultDisplayTransform, SuggestionData } from './types';

function getInitials(display: string): string {
    const parts = display.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return display.slice(0, 2).toUpperCase();
}

interface SuggestionProps<T extends BaseSuggestionData> {
    /** The id of the suggestion. */
    id: string;

    /** The search string generating the suggestion list. */
    query: string;

    /** The index of the suggestion. */
    index: number;

    /** The suggestion itself. */
    suggestion: SuggestionData<T>;

    /** Whether the suggestion is focused by the user. */
    focused?: boolean;

    /** Whether to show an avatar for this suggestion. Falls back to initials when no image is set. */
    showAvatar?: boolean;

    /** MUI sx prop applied to the Avatar. Use to customize background color, text color, size, etc. */
    avatarSx?: SxProps<Theme>;

    /** A function to customize the suggestion renderer. */
    renderSuggestion?: (props: SuggestionProps<T>) => JSX.Element;

    /** Called when the suggestion is clicked. */
    onClick?: React.MouseEventHandler<HTMLDivElement>;

    /** Called when the user mouses over the suggestion. */
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
}

function Suggestion<T extends BaseSuggestionData>(props: SuggestionProps<T>): ReactNode {
    const { renderSuggestion, suggestion, focused, showAvatar, avatarSx, onClick, onMouseEnter } = props;

    if (renderSuggestion) {
        return renderSuggestion(props);
    }

    const display = DefaultDisplayTransform(suggestion.id, suggestion.display);
    return (
        <ListItemButton
            role='option'
            aria-selected={focused}
            selected={focused}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
        >
            {showAvatar && (
                <ListItemAvatar>
                    <Avatar src={suggestion.image} alt={display} sx={avatarSx}>
                        {getInitials(display)}
                    </Avatar>
                </ListItemAvatar>
            )}
            {display}
        </ListItemButton>
    );
}

export default Suggestion;
