import { ListItemButton } from '@mui/material';
import React from 'react';

type SuggestionModel = string | { id: string; display: string };

interface SuggestionProps {
    /** The id of the suggestion. */
    id: string;

    /** The search string generating the suggestion list. */
    query: string;

    /** The index of the suggestion. */
    index: number;

    /** The suggestion itself. */
    suggestion: SuggestionModel;

    /** Whether the suggestion is focused by the user. */
    focused?: boolean;

    /** A function to customize the suggestion renderer. */
    renderSuggestion?: (props: SuggestionProps) => JSX.Element;

    /** Called when the suggestion is clicked. */
    onClick?: React.MouseEventHandler<HTMLDivElement>;

    /** Called when the user mouses over the suggestion. */
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
}

const Suggestion: React.FC<SuggestionProps> = (props) => {
    const { renderSuggestion, suggestion, focused, onClick, onMouseEnter } = props;

    if (renderSuggestion) {
        return renderSuggestion(props);
    }

    const display = getDisplay(suggestion);
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
};

export default Suggestion;

/**
 * Returns the display string for the given suggestion.
 * @param suggestion The suggestion to get the display string for.
 * @returns The display string for the given suggestion.
 */
function getDisplay(suggestion: SuggestionModel): string {
    if (typeof suggestion === 'string') {
        return suggestion;
    }
    const { id, display } = suggestion;
    return display || id;
}
