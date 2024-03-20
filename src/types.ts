/**
 * The minimum data of a suggestion.
 */
export interface BaseSuggestionData {
    /** The id of the suggestion data. */
    id: string;

    /** The user-facing display string of the suggestion data. */
    display?: string;
}

/**
 * Generic suggestion data type.
 */
export type SuggestionData<T extends BaseSuggestionData> = T;

/** The default trigger used to show the suggestions overlay. */
export const DefaultTrigger = '@';

/** The default markup template used if a {@link SuggestionDataSource} does not provide one. */
export const DefaultMarkupTemplate = '@[__display__](__id__)';

/**
 * Returns the default display string for the given suggestion.
 * @param id The id of the suggestion to get the display string for.
 * @param display The default display string of the suggestion.
 * @returns The default display string for the suggestion.
 */
export function DefaultDisplayTransform(id: string, display?: string): string {
    return display || id;
}

/**
 * A data source for suggestions displayed in the pop up.
 */
export interface SuggestionDataSource<T extends BaseSuggestionData> {
    /**
     * The character sequence upon which to trigger querying data.
     * @default '@'
     */
    trigger?: string;

    /**
     * The template string inserted into the value for mentions. Defaults to {@link DefaultMarkupTemplate}.
     */
    markup?: string;

    /**
     * A custom regular expression for parsing the markup for mentions. If not provided,
     * it is automatically dervied from {@link markup}.
     */
    regex?: RegExp;

    /** The suggestion data to display. */
    data: SuggestionData<T>[];

    /**
     * Whether to keep the suggestion overlay open when a space is typed.
     * @default false
     */
    allowSpaceInQuery?: boolean;

    /**
     * Whether to ignore accents and other diacritical marks while querying
     * the data.
     * @default false
     */
    ignoreAccents?: boolean;

    /**
     * Whether to automatically append a space after a mention is added.
     * @default false
     */
    appendSpaceOnAdd?: boolean;

    /**
     * Returns the display string for the given suggestion.
     * @param id The id of the suggestion to get the display string for.
     * @param display The default display string of the suggestion.
     * @returns The display string for the suggestion.
     * @default (id, display) => display || id;
     */
    displayTransform?: (id: string, display?: string) => string;

    /**
     * Callback invokved when a suggestion is selected and added to the TextField.
     * @param suggestion The added suggestion.
     * @param start The start index of the suggestion in the value.
     * @param end The end index of the suggestion in the value.
     */
    onAdd?: (suggestion: SuggestionData<T>, start: number, end: number) => void;
}

/** A suggestion displayed to the user in the editor pop up. */
export interface Suggestions<T extends BaseSuggestionData> {
    /** The query that generated the suggestions. */
    queryInfo: SuggestionsQueryInfo;

    /** The results of the query. */
    results: SuggestionData<T>[];
}

/** Info related to the query which triggered a suggestion. */
export interface SuggestionsQueryInfo {
    /** The index of the data source of the suggestion. */
    childIndex: number;

    /** The query which triggered the suggestion. */
    query: string;

    /** The index of the start of the query in the textfield value. */
    querySequenceStart: number;

    /** The index of the end of the query in the textfield value. */
    querySequenceEnd: number;

    /** The plain text version of the value. */
    plainTextValue: string;
}

/** A map from data source index to suggestions. */
export interface SuggestionsMap<T extends BaseSuggestionData> {
    [index: number]: Suggestions<T>;
}
