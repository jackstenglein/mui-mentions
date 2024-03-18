import { CircularProgress, List, Paper } from '@mui/material';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import Suggestion from './Suggestion';
import {
    Data,
    countSuggestions,
    getDataProvider,
    getEndOfLastMention,
    getPlainText,
    makeTriggerRegex,
    mapPlainTextIndex,
    readConfigFromChildren,
} from './utils/utils';
import { DataSource, SuggestionMap } from './MentionsTextField';

interface SuggestionsOverlayProps {
    /** Whether the suggestions overlay is open. */
    open: boolean;

    value: string;

    dataSources: DataSource[];

    selectionStart: number | null;
    selectionEnd: number | null;

    /** Whether the suggestions data is loading. */
    loading: boolean;

    scrollFocusedIntoView: boolean;

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

    ignoreAccents?: boolean;
}

const SuggestionsOverlay: React.FC<React.PropsWithChildren<SuggestionsOverlayProps>> = ({
    value,
    dataSources,
    selectionStart,
    selectionEnd,
    loading,
    scrollFocusedIntoView,
    containerRef,
    onSelect,
    onMouseDown,
    left,
    right,
    top,
}) => {
    const ulElement = useRef<HTMLUListElement>(null);
    const [suggestions, setSuggestions] = useState<SuggestionMap>({});
    const [focusIndex, setFocusIndex] = useState(0);

    // useEffect(() => {
    //     const current = ulElement.current;
    //     if (!scrollFocusedIntoView || !current || current.offsetHeight >= current.scrollHeight) {
    //         return;
    //     }

    //     const scrollTop = current.scrollTop;

    //     let { top, bottom } = current.children[focusIndex].getBoundingClientRect();
    //     const { top: topContainer } = current.getBoundingClientRect();
    //     top = top - topContainer + scrollTop;
    //     bottom = bottom - topContainer + scrollTop;

    //     if (top < scrollTop) {
    //         current.scrollTop = top;
    //     } else if (bottom > current.offsetHeight) {
    //         current.scrollTop = bottom - current.offsetHeight;
    //     }
    // }, [scrollFocusedIntoView, ulElement, focusIndex]);

    const queryDataSource = useCallback(
        (
            source: DataSource,
            query: string,
            sourceIndex: number,
            querySequenceStart: number,
            querySequenceEnd: number,
            fullText: string,
        ) => {
            const dataProvider = getDataProvider(source.data, source.ignoreAccents);
            const results = dataProvider(query);

            if (results instanceof Array) {
                setSuggestions((s) => {
                    return {
                        ...s,
                        [sourceIndex]: {
                            queryInfo: {
                                childIndex: sourceIndex,
                                query,
                                querySequenceStart,
                                querySequenceEnd,
                                plainTextValue: fullText,
                            },
                            results,
                        },
                    };
                });
            }
        },
        [setSuggestions],
    );

    useEffect(() => {
        setSuggestions({});

        if (!selectionStart || selectionStart !== selectionEnd) {
            return;
        }

        const config = readConfigFromChildren(dataSources);
        const plainText = getPlainText(value, config);

        const positionInValue = mapPlainTextIndex(plainText, config, selectionStart, 'NULL');
        if (!positionInValue) {
            return;
        }

        const substringStartIndex = getEndOfLastMention(plainText.substring(0, positionInValue), config);
        const substring = plainText.substring(substringStartIndex, selectionStart);

        // Check if suggestions have to be shown:
        // Match the trigger patterns of all Mention children on the extracted substring
        dataSources.forEach((source, sourceIndex) => {
            if (!source) {
                return;
            }

            const regex = makeTriggerRegex(source.trigger, source.allowSpaceInQuery);
            const match = substring.match(regex);
            if (match) {
                const querySequenceStart = substringStartIndex + substring.indexOf(match[1], match.index);
                queryDataSource(
                    source,
                    match[2],
                    sourceIndex,
                    querySequenceStart,
                    querySequenceStart + match[1].length,
                    plainText,
                );
            }
        });
    }, [setSuggestions, selectionStart, selectionEnd, dataSources, value, queryDataSource]);

    const clearSuggestions = useCallback(() => {
        setSuggestions({});
        setFocusIndex(0);
    }, [setSuggestions, setFocusIndex]);

    const handleSelect = useCallback(
        (result: Data, queryInfo: any) => {
            onSelect(result, queryInfo);
            clearSuggestions();
        },
        [onSelect, clearSuggestions],
    );

    const handleMouseEnter = useCallback(
        (focusIndex: number) => {
            setFocusIndex(focusIndex);
            // setScrollFocusedIntoView(false);
        },
        [setFocusIndex],
    );

    const renderedSuggestions = useMemo(() => {
        return Object.values(suggestions).reduce(
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
                        onClick={() => handleSelect(result, queryInfo)}
                        onMouseEnter={() => handleMouseEnter(index)}
                    />
                )),
            ],
            [],
        );
    }, [suggestions, handleSelect, handleMouseEnter, focusIndex]);

    if (selectionStart === null || selectionStart !== selectionEnd) {
        // The user either is not typing or has highlighted text, so we shouldn't show the suggestions
        return null;
    }

    if (loading) {
        return <CircularProgress />;
    }

    if (renderedSuggestions.length === 0) {
        return null;
    }

    return (
        <>
            <KeyboardListener
                suggestions={suggestions}
                clearSuggestions={clearSuggestions}
                onSelect={handleSelect}
                focusIndex={focusIndex}
                setFocusIndex={setFocusIndex}
            />
            <Paper
                elevation={8}
                ref={containerRef}
                onMouseDown={onMouseDown}
                sx={{
                    left,
                    top,
                    right,
                }}
            >
                <List ref={ulElement}>{renderedSuggestions}</List>
            </Paper>
        </>
    );
};

export default SuggestionsOverlay;

enum Key {
    Tab = 'Tab',
    Return = 'Enter',
    Escape = 'Escape',
    Up = 'ArrowUp',
    Down = 'ArrowDown',
}

interface KeyboardListenerProps {
    suggestions: SuggestionMap;
    clearSuggestions: () => void;
    focusIndex: number;
    setFocusIndex: (v: number) => void;
    onSelect: (result: Data, queryInfo: any) => void;
}

const KeyboardListener: React.FC<KeyboardListenerProps> = ({
    suggestions,
    clearSuggestions,
    focusIndex,
    setFocusIndex,
    onSelect,
}) => {
    useEffect(() => {
        const shiftFocus = (delta: number) => {
            const suggestionsCount = countSuggestions(suggestions);
            setFocusIndex((suggestionsCount + focusIndex + delta) % suggestionsCount);
            // setScrollFocusedIntoView(true);
        };

        const selectFocused = () => {
            // TODO: improve typing
            const { result, queryInfo } = Object.values(suggestions).reduce(
                (acc, { results, queryInfo }) => [...acc, ...results.map((result: Data) => ({ result, queryInfo }))],
                [],
            )[focusIndex];
            onSelect(result, queryInfo);
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
            switch (ev.key) {
                case Key.Escape: {
                    clearSuggestions();
                    break;
                }
                case Key.Down: {
                    shiftFocus(+1);
                    break;
                }
                case Key.Up: {
                    shiftFocus(-1);
                    break;
                }

                case Key.Return:
                case Key.Tab: {
                    selectFocused();
                    break;
                }
                default: {
                    return;
                }
            }

            ev.preventDefault();
            ev.stopPropagation();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [suggestions, clearSuggestions, focusIndex, setFocusIndex, onSelect]);

    return null;
};
