import { ListItemButton } from '@mui/material';
import React, { ReactNode } from 'react';
import { BaseSuggestionData, DefaultDisplayTransform, SuggestionData, SuggestionProps } from './types';

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
