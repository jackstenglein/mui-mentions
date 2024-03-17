import { CircularProgress, List, Paper } from '@mui/material';
import React, { useRef } from 'react';
import { useEffect } from 'react';
import Suggestion from './Suggestion';
import { Data } from './utils/utils';
import { SuggestionMap } from './MentionsTextField';

interface SuggestionsOverlayProps {
    id: string;
    suggestions: SuggestionMap;

    /** Whether the suggestions overlay is open. */
    open: boolean;

    /** Whether the suggestions data is loading. */
    loading: boolean;

    scrollFocusedIntoView: boolean;
    focusIndex: number;

    left: number;
    right: number;
    top: number;

    containerRef: React.RefObject<HTMLDivElement>;

    onSelect: (
        { id, display }: Data,
        {
            childIndex,
            querySequenceStart,
            querySequenceEnd,
            plainTextValue,
        }: {
            childIndex: number;
            querySequenceStart: number;
            querySequenceEnd: number;
            plainTextValue: string;
        },
    ) => void;

    onMouseDown: () => void;
    onMouseEnter: (index: number) => void;

    ignoreAccents?: boolean;
}

const SuggestionsOverlay: React.FC<React.PropsWithChildren<SuggestionsOverlayProps>> = ({
    open,
    loading,
    scrollFocusedIntoView,
    focusIndex,
    suggestions,
    containerRef,
    onSelect,
    onMouseDown,
    onMouseEnter,
}) => {
    const ulElement = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const current = ulElement.current;
        if (!scrollFocusedIntoView || !current || current.offsetHeight >= current.scrollHeight) {
            return;
        }

        const scrollTop = current.scrollTop;

        let { top, bottom } = current.children[focusIndex].getBoundingClientRect();
        const { top: topContainer } = current.getBoundingClientRect();
        top = top - topContainer + scrollTop;
        bottom = bottom - topContainer + scrollTop;

        if (top < scrollTop) {
            current.scrollTop = top;
        } else if (bottom > current.offsetHeight) {
            current.scrollTop = bottom - current.offsetHeight;
        }
    }, [scrollFocusedIntoView, ulElement, focusIndex]);

    if (!open) {
        return null;
    }

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper elevation={8} ref={containerRef} onMouseDown={onMouseDown}>
            <List ref={ulElement}>
                {Object.values(suggestions).reduce(
                    (accResults, { results, queryInfo }) => [
                        ...accResults,
                        ...results.map((result: Data, index: number) => (
                            <Suggestion
                                key={result.id}
                                id={result.id}
                                query={queryInfo.query}
                                index={index}
                                suggestion={result}
                                focused={index === focusIndex}
                                onClick={() => onSelect(result, queryInfo)}
                                onMouseEnter={() => onMouseEnter(index)}
                            />
                        )),
                    ],
                    [],
                )}
            </List>
        </Paper>
    );
};

export default SuggestionsOverlay;
