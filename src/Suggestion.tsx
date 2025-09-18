import { ListItemButton } from '@mui/material';
import React, { ReactNode, type JSX } from 'react';
import { BaseSuggestionData, DefaultDisplayTransform, SuggestionData } from './types';

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

    /** A function to customize the suggestion renderer. */
    renderSuggestion?: (props: SuggestionProps<T>) => JSX.Element;

    /** Called when the suggestion is clicked. */
    onClick?: React.MouseEventHandler<HTMLDivElement>;

    /** Called when the user mouses over the suggestion. */
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
}

function Suggestion<T extends BaseSuggestionData>(props: SuggestionProps<T>): ReactNode {
    const { renderSuggestion, suggestion, focused, onClick, onMouseEnter } = props;

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
            {display}
        </ListItemButton>
    );
}

export default Suggestion;
