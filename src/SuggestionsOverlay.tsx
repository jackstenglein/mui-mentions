import { CircularProgress, List, Paper, Popper, Stack } from '@mui/material';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Suggestion from './Suggestion';
import {
    BaseSuggestionData,
    DefaultTrigger,
    SuggestionData,
    SuggestionDataSource,
    Suggestions,
    SuggestionsMap,
    SuggestionsQueryInfo,
} from './types';
import {
    countSuggestions,
    getDataProvider,
    getEndOfLastMention,
    getPlainText,
    makeTriggerRegex,
    mapPlainTextIndex,
} from './utils/utils';

interface SuggestionsOverlayProps<T extends BaseSuggestionData> {
    /** The markup value string. */
    value: string;

    /** An array of data sources used in the markup string. */
    dataSources: SuggestionDataSource<T>[];

    /** The start of the selected text range in the plain text value. */
    selectionStart: number | null;

    /** The end of the selected text range in the plain text value. */
    selectionEnd: number | null;

    /** Whether the suggestions data is loading. */
    loading: boolean;

    /** A ref to the element which keeps track of the cursor position. */
    cursorRef: React.RefObject<HTMLSpanElement | null>;

    /** Callback invoked with the selected suggestion. */
    onSelect: (
        { id, display }: SuggestionData<T>,
        { childIndex, querySequenceStart, querySequenceEnd, plainTextValue }: SuggestionsQueryInfo,
    ) => void;

    /** Callback invoked on mouse down in the suggestions overlay. */
    onMouseDown: () => void;
}

function SuggestionsOverlay<T extends BaseSuggestionData>(props: SuggestionsOverlayProps<T>) {
    const { value, dataSources, selectionStart, selectionEnd, cursorRef, onSelect, onMouseDown } = props;
    const ulElement = useRef<HTMLUListElement>(null);
    const [suggestions, setSuggestions] = useState<SuggestionsMap<T>>({});
    const [focusIndex, setFocusIndex] = useState(0);
    const [scrollFocusedIntoView, setScrollFocusedIntoView] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const current = ulElement.current;
        if (!scrollFocusedIntoView || !current || current.children.length === 0) {
            return;
        }

        const scrollTop = current.scrollTop;

        let { top, bottom } = current.children[focusIndex].getBoundingClientRect();
        const { top: topContainer } = current.getBoundingClientRect();
        top = top - topContainer + scrollTop;
        bottom = bottom - topContainer + scrollTop;

        if (top < scrollTop) {
            // Handles scrolling up as focusIndex decreases
            current.scrollTop = top;
        } else if (bottom > current.offsetHeight + scrollTop) {
            // Handles scrolling down as focusIndex increases
            current.scrollTop = bottom - current.offsetHeight;
        }

        setScrollFocusedIntoView(false);
    }, [scrollFocusedIntoView, ulElement, focusIndex, setScrollFocusedIntoView]);

    const queryDataSource = useCallback(
        async (
            source: SuggestionDataSource<T>,
            query: string,
            sourceIndex: number,
            querySequenceStart: number,
            querySequenceEnd: number,
            fullText: string,
        ) => {
            try {
                const dataProvider = getDataProvider(source.data, source.ignoreAccents);
                setLoading(true);
                const results = await dataProvider(query);
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
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        },
        [setSuggestions],
    );

    useEffect(() => {
        setSuggestions({});

        if (!selectionStart || selectionStart !== selectionEnd) {
            return;
        }

        const plainText = getPlainText(value, dataSources);

        const positionInValue = mapPlainTextIndex(plainText, dataSources, selectionStart, 'NULL');
        if (!positionInValue) {
            return;
        }

        const substringStartIndex = getEndOfLastMention(plainText.substring(0, positionInValue), dataSources);
        const substring = plainText.substring(substringStartIndex, selectionStart);

        // Check if suggestions have to be shown:
        // Match the trigger patterns of all Mention children on the extracted substring
        dataSources.forEach((source, sourceIndex) => {
            if (!source) {
                return;
            }

            const regex = makeTriggerRegex(source.trigger || DefaultTrigger, source.allowSpaceInQuery);
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
        (result: SuggestionData<T>, queryInfo: any) => {
            onSelect(result, queryInfo);
            clearSuggestions();
        },
        [onSelect, clearSuggestions],
    );

    const handleMouseEnter = useCallback(
        (focusIndex: number) => {
            setFocusIndex(focusIndex);
        },
        [setFocusIndex],
    );

    const renderedSuggestions = useMemo(() => {
        return Object.values(suggestions).reduce(
            (accResults, { results, queryInfo }) => [
                ...accResults,
                ...results.map((result: SuggestionData<T>, index: number) => (
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
        // The user either is not typing or has highlighted text,
        // so we shouldn't show the suggestions
        return null;
    }

    if (!loading && renderedSuggestions.length === 0) {
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
                setScrollFocusedIntoView={setScrollFocusedIntoView}
                loading={loading}
            />
            <Popper open={true} anchorEl={cursorRef.current} placement='bottom-start' sx={{ zIndex: 2 }}>
                <Paper elevation={8} onMouseDown={onMouseDown}>
                    <List ref={ulElement} sx={{ width: '300px', maxHeight: '40vh', overflow: 'auto' }}>
                        {renderedSuggestions.length > 0
                            ? renderedSuggestions
                            : loading && (
                                  <Stack justifyContent='center' alignItems='center' height='40vh'>
                                      <CircularProgress />
                                  </Stack>
                              )}
                    </List>
                </Paper>
            </Popper>
        </>
    );
}

export default SuggestionsOverlay;

enum Key {
    Tab = 'Tab',
    Return = 'Enter',
    Escape = 'Escape',
    Up = 'ArrowUp',
    Down = 'ArrowDown',
}

interface KeyboardListenerProps<T extends BaseSuggestionData> {
    suggestions: SuggestionsMap<T>;
    clearSuggestions: () => void;
    focusIndex: number;
    setFocusIndex: (v: number) => void;
    setScrollFocusedIntoView: (v: boolean) => void;
    onSelect: (result: SuggestionData<T>, queryInfo: any) => void;
    loading: boolean;
}

function KeyboardListener<T extends BaseSuggestionData>(props: KeyboardListenerProps<T>): ReactNode {
    const { suggestions, clearSuggestions, focusIndex, setFocusIndex, setScrollFocusedIntoView, onSelect, loading } =
        props;

    useEffect(() => {
        const shiftFocus = (delta: number) => {
            if (loading) return;

            const suggestionsCount = countSuggestions(suggestions);
            setFocusIndex((suggestionsCount + focusIndex + delta) % suggestionsCount);
            setScrollFocusedIntoView(true);
        };

        const selectFocused = () => {
            if (loading) return;

            const { result, queryInfo }: { result: SuggestionData<T>; queryInfo: SuggestionsQueryInfo } = Object.values(
                suggestions,
            ).reduce(
                (acc: Suggestions<T>[], { results, queryInfo }: Suggestions<T>) => [
                    ...acc,
                    ...results.map((result: SuggestionData<T>) => ({ result, queryInfo })),
                ],
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
    }, [suggestions, clearSuggestions, focusIndex, setFocusIndex, onSelect, setScrollFocusedIntoView, loading]);

    return null;
}
