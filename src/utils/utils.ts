import invariant from 'invariant';
import {
    BaseSuggestionData,
    DefaultDisplayTransform,
    DefaultMarkupTemplate,
    MentionData,
    SuggestionData,
    SuggestionDataSource,
    SuggestionsMap,
} from '../types';
import lettersDiacritics from './diacritics';

enum Placeholders {
    id = '__id__',
    display = '__display__',
}

/**
 * Checks whether the given value is a number.
 * @param val The value to check
 * @returns True if val is a number;
 */
export function isNumber(val: any): val is number {
    return typeof val === 'number';
}

/**
 * Combines the given regular expressions into a single regexp joined by
 * the or operator: |
 * @param regExps The regular expressions to combine.
 * @returns A combined regular expression.
 */
function combineRegExps(regExps: RegExp[]): RegExp {
    const serializedRegexParser = /^\/(.+)\/(\w+)?$/;
    return new RegExp(
        regExps
            .map((regex) => {
                const [, regexString, regexFlags] = serializedRegexParser.exec(regex.toString()) || [];

                invariant(
                    !regexFlags,
                    `RegExp flags are not supported. Change /${regexString}/${regexFlags} into /${regexString}/`,
                );

                return `(${regexString})`;
            })
            .join('|'),
        'g',
    );
}

/**
 * Returns the number of placeholders used in the given markup template.
 * @param markup The markup template used for mentions.
 * @returns The number of placeholders in the template.
 */
function countPlaceholders(markup: string): number {
    let count = 0;
    if (markup.indexOf(Placeholders.id) >= 0) count++;
    if (markup.indexOf(Placeholders.display) >= 0) count++;
    return count;
}

/**
 * Finds the index of the given parameter's capturing group in the given markup template.
 * @param markup The markup template used for mentions.
 * @param parameterName The parameter name to find.
 * @returns The index of the parameter's capturing group.
 */
function findIndexOfCapturingGroup(markup: string, parameterName: 'id' | 'display'): number {
    invariant(
        parameterName === 'id' || parameterName === 'display',
        `Second arg must be either "id" or "display", got: "${parameterName}"`,
    );

    const indexDisplay = markup.indexOf(Placeholders.display);
    const indexId = markup.indexOf(Placeholders.id);

    invariant(
        indexDisplay >= 0 || indexId >= 0,
        `The markup '${markup}' does not contain at least one of the placeholders '__id__' or '__display__'`,
    );

    if (indexDisplay >= 0 && indexId >= 0) {
        // both placeholders are used, return 0 or 1 depending on the position of the requested parameter
        return (parameterName === 'id' && indexId <= indexDisplay) ||
            (parameterName === 'display' && indexDisplay <= indexId)
            ? 0
            : 1;
    }

    // just one placeholder is being used, we'll use the captured string for both parameters
    return 0;
}

/**
 * Searches the provided value for the mentions markup in the provided config and passes each found mention
 * to the provided processor functions.
 * @param value The value to search for the mentions markup.
 * @param dataSources An array of all DataSources used in the markup.
 * @param markupProcessor A callback function that processes each mention markup instance.
 * @param plainTextProcessor A callback function that processes each plain text instance.
 */
export function iterateMentionsMarkup<T extends BaseSuggestionData>(
    value: string,
    dataSources: SuggestionDataSource<T>[],
    markupProcessor: (
        match: string,
        matchIndex: number,
        plainTextIndex: number,
        id: string,
        display: string,
        mentionIndex: number,
        start: number,
    ) => void,
    plainTextProcessor?: (value: string, start: number, currentIndex: number) => void,
    multiline?: boolean,
) {
    const regex = combineRegExps(
        dataSources.map((ds) =>
            ds.regex
                ? verifyCapturingGroups(ds.regex, ds.markup || DefaultMarkupTemplate)
                : markupToRegex(ds.markup || DefaultMarkupTemplate),
        ),
    );

    let accOffset = 2; // first is whole match, second is the capturing group of first regexp component
    const captureGroupOffsets = dataSources.map(({ markup }) => {
        const result = accOffset;
        // + 1 is for the capturing group we add around each regexp component in combineRegExps
        accOffset += countPlaceholders(markup || DefaultMarkupTemplate) + 1;
        return result;
    });

    let match: RegExpExecArray | null;
    let start = 0;
    let currentPlainTextIndex = 0;

    // detect all mention markup occurrences in the value and iterate the matches
    while ((match = regex.exec(value)) !== null) {
        const offset = captureGroupOffsets.find((o) => !!match?.[o]);
        if (offset === undefined) {
            continue;
        }

        const mentionChildIndex = captureGroupOffsets.indexOf(offset);
        const { markup, displayTransform } = dataSources[mentionChildIndex];
        const idPos = offset + findIndexOfCapturingGroup(markup || DefaultMarkupTemplate, 'id');
        const displayPos = offset + findIndexOfCapturingGroup(markup || DefaultMarkupTemplate, 'display');

        const id = match[idPos];
        const display = displayTransform
            ? displayTransform(id, match[displayPos])
            : DefaultDisplayTransform(id, match[displayPos], multiline);

        const substr = value.substring(start, match.index);
        plainTextProcessor?.(substr, start, currentPlainTextIndex);
        currentPlainTextIndex += substr.length;

        markupProcessor(match[0], match.index, currentPlainTextIndex, id, display, mentionChildIndex, start);
        currentPlainTextIndex += display.length;
        start = regex.lastIndex;
    }

    if (start < value.length) {
        plainTextProcessor?.(value.substring(start), start, currentPlainTextIndex);
    }
}

/**
 * Converts the given value to plain text.
 * @param value The value which possibly contains mention markup.
 * @param dataSources An array of all DataSources used in the markup.
 * @param multiline Whether the value is being converted in a multiline textfield.
 * @returns value with mention markup converted to plain text.
 */
export function getPlainText<T extends BaseSuggestionData>(
    value: string,
    dataSources: SuggestionDataSource<T>[],
    multiline?: boolean,
): string {
    let result = '';
    iterateMentionsMarkup(
        value,
        dataSources,
        (_match, _index, _plainTextIndex, _id, display) => {
            result += display;
        },
        (plainText) => {
            result += plainText;
        },
        multiline,
    );
    return result;
}

/**
 * Verifies that the given regex and markup have the same number of capturing groups. If true,
 * regex is returned unchanged. If false, an error is thrown.
 * @param regex The regex to check.
 * @param markup The markup string to check.
 * @returns regex, if the capturing groups match.
 */
const verifyCapturingGroups = (regex: RegExp, markup: string) => {
    const numberOfGroups = (new RegExp(regex.toString() + '|').exec('')?.length || 0) - 1;
    const numberOfPlaceholders = countPlaceholders(markup);

    invariant(
        numberOfGroups === numberOfPlaceholders,
        `Number of capturing groups in RegExp ${regex.toString()} (${numberOfGroups}) does not match the number of placeholders in the markup '${markup}' (${numberOfPlaceholders})`,
    );

    return regex;
};

/**
 * Converts the given markup to a RegExp.
 * @param markup The markup to convert.
 * @returns The RegExp for the given markup string.
 */
const markupToRegex = (markup: string) => {
    const escapedMarkup = escapeRegex(markup);

    const charAfterDisplay = markup[markup.indexOf(Placeholders.display) + Placeholders.display.length];
    const charAfterId = markup[markup.indexOf(Placeholders.id) + Placeholders.id.length];

    return new RegExp(
        escapedMarkup
            .replace(Placeholders.display, `([^${escapeRegex(charAfterDisplay || '')}]+?)`)
            .replace(Placeholders.id, `([^${escapeRegex(charAfterId || '')}]+?)`),
    );
};

/**
 * Escapes RegExp special characters in the provided string.
 * https://stackoverflow.com/a/9310752/5142490
 * @param str The string to escape.
 * @returns str with the RegExp special characters escaped.
 */
const escapeRegex = (str: string) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * Applies changes from the given plain text value to the given markup value, guided
 * by the selected text ranges before and after the change.
 * @param value The current markup string.
 * @param plainTextValue The new plain text string.
 * @param selectionStartBefore The start of the selected text range before the change.
 * @param selectionEndBefore The end of the selected text range before the change.
 * @param selectionEndAfter The end of the selected text range after the change.
 * @param dataSources An array of DataSources used in the markup string.
 * @param multiline Whether the value is for a multiline text field.
 */
export function applyChangeToValue<T extends BaseSuggestionData>(
    value: string,
    plainTextValue: string,
    selectionStartBefore: number | null,
    selectionEndBefore: number | null,
    selectionEndAfter: number,
    dataSources: SuggestionDataSource<T>[],
    multiline?: boolean,
) {
    const oldPlainTextValue = getPlainText(value, dataSources, multiline);

    const lengthDelta = oldPlainTextValue.length - plainTextValue.length;
    if (selectionStartBefore === null) {
        selectionStartBefore = selectionEndAfter + lengthDelta;
    }

    if (selectionEndBefore === null) {
        selectionEndBefore = selectionStartBefore;
    }

    // Fixes an issue with replacing combined characters for complex input. Eg like acented letters on OSX
    if (
        selectionStartBefore === selectionEndBefore &&
        selectionEndBefore === selectionEndAfter &&
        oldPlainTextValue.length === plainTextValue.length
    ) {
        selectionStartBefore = selectionStartBefore - 1;
    }

    // extract the insertion from the new plain text value
    let insert = plainTextValue.slice(selectionStartBefore, selectionEndAfter);

    // handling for Backspace key with no range selection
    let spliceStart = Math.min(selectionStartBefore, selectionEndAfter);

    let spliceEnd = selectionEndBefore;
    if (selectionStartBefore === selectionEndAfter) {
        // handling for Delete key with no range selection
        spliceEnd = Math.max(selectionEndBefore, selectionStartBefore + lengthDelta);
    }

    let mappedSpliceStart = mapPlainTextIndex(value, dataSources, spliceStart, 'START');
    let mappedSpliceEnd = mapPlainTextIndex(value, dataSources, spliceEnd, 'END');

    const controlSpliceStart = mapPlainTextIndex(value, dataSources, spliceStart, 'NULL');
    const controlSpliceEnd = mapPlainTextIndex(value, dataSources, spliceEnd, 'NULL');
    const willRemoveMention = controlSpliceStart === null || controlSpliceEnd === null;

    let newValue = spliceString(value, mappedSpliceStart || 0, mappedSpliceEnd || 0, insert);

    if (!willRemoveMention) {
        // test for auto-completion changes
        const controlPlainTextValue = getPlainText(newValue, dataSources, multiline);
        if (controlPlainTextValue !== plainTextValue) {
            // some auto-correction is going on

            // find start of diff
            spliceStart = 0;
            while (plainTextValue[spliceStart] === controlPlainTextValue[spliceStart]) spliceStart++;

            // extract auto-corrected insertion
            insert = plainTextValue.slice(spliceStart, selectionEndAfter);

            // find index of the unchanged remainder
            spliceEnd = oldPlainTextValue.lastIndexOf(plainTextValue.substring(selectionEndAfter));

            // re-map the corrected indices
            mappedSpliceStart = mapPlainTextIndex(value, dataSources, spliceStart, 'START');
            mappedSpliceEnd = mapPlainTextIndex(value, dataSources, spliceEnd, 'END');
            newValue = spliceString(value, mappedSpliceStart || 0, mappedSpliceEnd || 0, insert);
        }
    }

    return newValue;
}

/**
 * Converts a plain text character index to the corresponding index in the markup value string.
 * @param value The markup value string.
 * @param dataSources An array of all DataSources used in the markup string.
 * @param indexInPlainText The index in the plain text string.
 * @param inMarkupCorrection The behavior if the corresponding index is inside a mention.
 *   START returns the index of the mention markup's first character (default).
 *   END returns the index after the mention markup's last character.
 *   NULL returns null.
 * @returns The index in the markup string.
 */
export function mapPlainTextIndex<T extends BaseSuggestionData>(
    value: string,
    dataSources: SuggestionDataSource<T>[],
    indexInPlainText: number,
    inMarkupCorrection: 'START' | 'END' | 'NULL' = 'START',
): number | null | undefined {
    if (typeof indexInPlainText !== 'number') {
        return indexInPlainText;
    }

    let result: number | undefined | null = undefined;

    const plainTextProcessor = (substr: string, index: number, substrPlainTextIndex: number) => {
        if (result !== undefined) return;

        if (substrPlainTextIndex + substr.length >= indexInPlainText) {
            // found the corresponding position in the current plain text range
            result = index + indexInPlainText - substrPlainTextIndex;
        }
    };

    const markupProcessor = (
        markup: string,
        index: number,
        mentionPlainTextIndex: number,
        _id: string,
        display: string,
    ) => {
        if (result !== undefined) return;

        if (mentionPlainTextIndex + display.length > indexInPlainText) {
            // found the corresponding position inside current match,
            // return the index of the first or after the last char of the matching markup
            // depending on the value of `inMarkupCorrection`
            if (inMarkupCorrection === 'NULL') {
                result = null;
            } else {
                result = index + (inMarkupCorrection === 'END' ? markup.length : 0);
            }
        }
    };

    iterateMentionsMarkup(value, dataSources, markupProcessor, plainTextProcessor);

    // when a mention is at the end of the value and we want to get the cursor position
    // at the end of the string, result is undefined
    return result === undefined ? value.length : result;
}

/**
 * Replaces the characters in str from start to end with insert.
 * @param str The string to edit.
 * @param start The starting position to splice (inclusive).
 * @param end The ending position to splice (exclusive).
 * @param insert The string to insert at the start position.
 * @returns The edited string.
 */
export function spliceString(str: string, start: number, end: number, insert: string): string {
    return str.substring(0, start) + insert + str.substring(end);
}

/**
 * Converts the index of a mention in plain text to the index of the first character
 * of the mention in the plain text. If the given index is not inside a mention, undefined is
 * returned.
 * @param value The markup value string.
 * @param dataSources An array of DataSources used in the markup string.
 * @param indexInPlainText The index of the mention in plain text.
 * @returns The start of the index in the plain text.
 */
export function findStartOfMentionInPlainText<T extends BaseSuggestionData>(
    value: string,
    dataSources: SuggestionDataSource<T>[],
    indexInPlainText: number,
): number | undefined {
    let result: number | undefined = undefined;

    const markupProcessor = (
        _markup: string,
        _index: number,
        mentionPlainTextIndex: number,
        _id: string,
        display: string,
    ) => {
        if (mentionPlainTextIndex <= indexInPlainText && mentionPlainTextIndex + display.length > indexInPlainText) {
            result = mentionPlainTextIndex;
        }
    };

    iterateMentionsMarkup(value, dataSources, markupProcessor);
    return result;
}

/**
 * Parses a list of mentions from the given markup string.
 * @param value The markup string value to parse.
 * @param dataSources An array of SuggestionDataSources used in the markup string.
 * @returns An array of MentionDatas parsed from the given markup string.
 */
export function getMentions<T extends BaseSuggestionData>(
    value: string,
    dataSources: SuggestionDataSource<T>[],
): MentionData[] {
    const mentions: MentionData[] = [];
    iterateMentionsMarkup(value, dataSources, (_match, index, plainTextIndex, id, display, childIndex) => {
        mentions.push({
            id,
            display,
            dataSourceIndex: childIndex,
            index,
            plainTextIndex,
        });
    });
    return mentions;
}

/**
 * Returns the number of individual SuggestionData objects in the provided suggestions map.
 * @param suggestions The suggestions map to count.
 * @returns The number of SuggestionData objects in suggestions.
 */
export function countSuggestions<T extends BaseSuggestionData>(suggestions: SuggestionsMap<T>) {
    return Object.values(suggestions).reduce((acc, { results }) => acc + results.length, 0);
}

/**
 * Returns the index of the end of the last mention in the given markup string.
 * @param value The markup string to search for mentions.
 * @param dataSources An array of SuggestionDataSources used in the markup string.
 * @returns The index of the end of the last mention, or 0 if there are no mentions.
 */
export function getEndOfLastMention<T extends BaseSuggestionData>(
    value: string,
    dataSources: SuggestionDataSource<T>[],
) {
    const mentions = getMentions(value, dataSources);
    const lastMention = mentions[mentions.length - 1];
    return lastMention ? lastMention.plainTextIndex + lastMention.display.length : 0;
}

/**
 * Converts the given trigger to regex.
 * @param trigger The trigger to use for mentions.
 * @param allowSpaceInQuery Whether to allow a space in the query.
 * @returns A regex version of trigger.
 */
export function makeTriggerRegex(trigger: string | RegExp, allowSpaceInQuery?: boolean) {
    if (trigger instanceof RegExp) {
        return trigger;
    } else {
        const escapedTriggerChar = escapeRegex(trigger);

        // first capture group is the part to be replaced on completion
        // second capture group is for extracting the search query
        return new RegExp(
            `(?:^|\\s)(${escapedTriggerChar}([^${allowSpaceInQuery ? '' : '\\s'}${escapedTriggerChar}]*))$`,
        );
    }
}

/**
 * Returns a data provider for the given data.
 * @param data An array of SuggestionData objects, or an asychronous function that returns an array of SuggestionData objects.
 * @param ignoreAccents Whether to ignore accents while comparing the data with the query.
 * @returns A function which returns an array of SuggestionData objects based on a query string.
 */
export function getDataProvider<T extends BaseSuggestionData>(
    data: SuggestionData<T>[] | ((query: string) => Promise<SuggestionData<T>[]>),
    ignoreAccents?: boolean,
): (query: string) => Promise<SuggestionData<T>[]> {
    if (data instanceof Array) {
        // if data is an array, create a function to query that
        return async function (query: string) {
            const results = [];
            for (let i = 0, l = data.length; i < l; ++i) {
                const display = data[i].display || data[i].id;
                if (getSubstringIndex(display, query, ignoreAccents) >= 0) {
                    results.push(data[i]);
                }
            }
            return results;
        };
    }
    return data;
}

/**
 * Returns the index of substr in str, optionally normalizing accents.
 * @param str The string to check.
 * @param substr The substring to search for.
 * @param ignoreAccents Whether to ignore accents and other diacritical marks.
 * @returns The index of substr in str.
 */
const getSubstringIndex = (str: string, substr: string, ignoreAccents?: boolean) => {
    if (!ignoreAccents) {
        return str.toLowerCase().indexOf(substr.toLowerCase());
    }

    return normalizeString(str).indexOf(normalizeString(substr));
};

/**
 * Returns the given string with accented characters replaced by their non-accented counterparts.
 * @param str The string to remove accents from.
 * @returns The given string with accents replaced.
 */
const removeAccents = (str: string) => {
    let formattedStr = str;

    lettersDiacritics.forEach((letterDiacritics) => {
        formattedStr = formattedStr.replace(letterDiacritics.letters, letterDiacritics.base);
    });

    return formattedStr;
};

/**
 * Returns the given string with accents removed and converted to lowercase.
 * @param str The string to normalize.
 * @returns The normalized string.
 */
const normalizeString = (str: string) => removeAccents(str).toLowerCase();

/**
 *
 * @param markup The markup format to use.
 * @param id The id of the mention.
 * @param display The display string of the mention.
 * @returns The markup string for the mention.
 */
export const makeMentionsMarkup = (markup: string, id: string, display?: string) => {
    return markup.replace(Placeholders.id, id).replace(Placeholders.display, display || id);
};
