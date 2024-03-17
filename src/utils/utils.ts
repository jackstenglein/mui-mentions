import invariant from 'invariant';
import { Children, ReactElement } from 'react';
import lettersDiacritics from './diacritics';

enum Placeholders {
    id = '__id__',
    display = '__display__',
}

interface MentionConfig {
    markup: string;
    regex: RegExp;
    displayTransform: (id: string, display: string) => string;
}

export interface Data {
    id: string;
    display: string;
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
    if (markup.indexOf('__id__') >= 0) count++;
    if (markup.indexOf('__display__') >= 0) count++;
    return count;
}

/**
 * Finds the index of the given parameter's capturing group in the given markup template.
 * @param markup The markup template used for mentions.
 * @param parameterName The parameter name to find.
 * @returns The index of the parameter's capturing group.
 */
function findIndexOfCapturingGroup(markup: string, parameterName: string): number {
    invariant(
        parameterName === 'id' || parameterName === 'display',
        `Second arg must be either "id" or "display", got: "${parameterName}"`,
    );

    let indexDisplay = markup.indexOf(Placeholders.display);
    let indexId = markup.indexOf(Placeholders.id);

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
 * @param config An array of all Mention configs.
 * @param markupProcessor A callback function that processes each mention markup instance.
 * @param plainTextProcessor A callback function that processes each plain text instance.
 */
export function iterateMentionsMarkup(
    value: string,
    config: MentionConfig[],
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
) {
    const regex = combineRegExps(config.map((c) => c.regex));

    let accOffset = 2; // first is whole match, second is the for the capturing group of first regexp component
    const captureGroupOffsets = config.map(({ markup }) => {
        const result = accOffset;
        // + 1 is for the capturing group we add around each regexp component in combineRegExps
        accOffset += countPlaceholders(markup) + 1;
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
        const { markup, displayTransform } = config[mentionChildIndex];
        const idPos = offset + findIndexOfCapturingGroup(markup, 'id');
        const displayPos = offset + findIndexOfCapturingGroup(markup, 'display');

        const id = match[idPos];
        const display = displayTransform(id, match[displayPos]);

        let substr = value.substring(start, match.index);
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
 * @param config An array of all Mention configs.
 * @returns value with mention markup converted to plain text.
 */
export function getPlainText(value: string, config: MentionConfig[]): string {
    let result = '';
    iterateMentionsMarkup(
        value,
        config,
        (_match, _index, _plainTextIndex, _id, display) => {
            result += display;
        },
        (plainText) => {
            result += plainText;
        },
    );
    return result;
}

/**
 * Returns an array of MentionConfig objects parsed from the given children.
 * @param children The children to pull the MentionConfigs from.
 * @returns An array of MentionConfig objects.
 */
export function readConfigFromChildren(children: React.ReactNode): MentionConfig[] {
    return Children.toArray(children).map((child) => {
        const {
            props: { markup, regex, displayTransform },
        } = child as ReactElement<MentionConfig>;
        return {
            markup,
            regex: regex ? verifyCapturingGroups(regex, markup) : markupToRegex(markup),
            displayTransform: displayTransform || ((id: string, display: string) => display || id),
        };
    });
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

// Applies a change from the plain text textarea to the underlying marked up value
// guided by the textarea text selection ranges before and after the change

/**
 * Applies changes from the given plain text value to the given markup value, guided
 * by the selected text ranges before and after the change.
 * @param value The current markup string.
 * @param plainTextValue The new plain text string.
 * @param selectionStartBefore The start of the selected text range before the change.
 * @param selectionEndBefore The end of the selected text range before the change.
 * @param selectionEndAfter The end of the selected text range after the change.
 * @param config An array of MentionConfigs to apply.
 * @returns
 */
export function applyChangeToValue(
    value: string,
    plainTextValue: string,
    selectionStartBefore: number | null,
    selectionEndBefore: number | null,
    selectionEndAfter: number,
    config: MentionConfig[],
) {
    let oldPlainTextValue = getPlainText(value, config);

    let lengthDelta = oldPlainTextValue.length - plainTextValue.length;
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

    let mappedSpliceStart = mapPlainTextIndex(value, config, spliceStart, 'START');
    let mappedSpliceEnd = mapPlainTextIndex(value, config, spliceEnd, 'END');

    let controlSpliceStart = mapPlainTextIndex(value, config, spliceStart, 'NULL');
    let controlSpliceEnd = mapPlainTextIndex(value, config, spliceEnd, 'NULL');
    let willRemoveMention = controlSpliceStart === null || controlSpliceEnd === null;

    let newValue = spliceString(value, mappedSpliceStart || 0, mappedSpliceEnd || 0, insert);

    if (!willRemoveMention) {
        // test for auto-completion changes
        let controlPlainTextValue = getPlainText(newValue, config);
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
            mappedSpliceStart = mapPlainTextIndex(value, config, spliceStart, 'START');
            mappedSpliceEnd = mapPlainTextIndex(value, config, spliceEnd, 'END');
            newValue = spliceString(value, mappedSpliceStart || 0, mappedSpliceEnd || 0, insert);
        }
    }

    return newValue;
}

/**
 * Converts a plain text character index to the corresponding index in the markup value string.
 * @param value The markup value string.
 * @param config An array of all MentionConfigs.
 * @param indexInPlainText The index in the plain text string.
 * @param inMarkupCorrection The behavior if the corresponding index is inside a mention.
 *   START returns the index of the mention markup's first character (default).
 *   END returns the index after the mention markup's last character.
 *   NULL returns null.
 * @returns The index in the markup string.
 */
export function mapPlainTextIndex(
    value: string,
    config: MentionConfig[],
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
            // depending on whether the `inMarkupCorrection`
            if (inMarkupCorrection === 'NULL') {
                result = null;
            } else {
                result = index + (inMarkupCorrection === 'END' ? markup.length : 0);
            }
        }
    };

    iterateMentionsMarkup(value, config, markupProcessor, plainTextProcessor);

    // when a mention is at the end of the value and we want to get the caret position
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
 * @param config An array of MentionConfigs.
 * @param indexInPlainText The index of the mention in plain text.
 * @returns The start of the index in the plain text.
 */
export function findStartOfMentionInPlainText(
    value: string,
    config: MentionConfig[],
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

    iterateMentionsMarkup(value, config, markupProcessor);
    return result;
}

export interface MentionData {
    id: string;
    display: string;
    childIndex: number;
    index: number;
    plainTextIndex: number;
}

/**
 * Parses a list of mentions from the given markup string.
 * @param value The markup string value to parse.
 * @param config An array of MentionConfigs.
 * @returns An array of MentionDatas parsed from the given markup string.
 */
export function getMentions(value: string, config: MentionConfig[]): MentionData[] {
    const mentions: MentionData[] = [];
    iterateMentionsMarkup(value, config, (_match, index, plainTextIndex, id, display, childIndex) => {
        mentions.push({
            id,
            display,
            childIndex,
            index,
            plainTextIndex,
        });
    });
    return mentions;
}

// TODO: type this better
export function countSuggestions(suggestions: object) {
    return Object.values(suggestions).reduce((acc, { results }) => acc + results.length, 0);
}

export function isHTMLTextAreaElement(obj: any): obj is HTMLTextAreaElement {
    return Boolean(obj.createTextRange);
}

/**
 * Returns the index of the end of the last mention in the given markup string.
 * @param value The markup string to search for mentions.
 * @param config An array of MentionConfigs.
 * @returns The index of the end of the last mention, or 0 if there are no mentions.
 */
export function getEndOfLastMention(value: string, config: MentionConfig[]) {
    const mentions = getMentions(value, config);
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

export function getDataProvider(data: Array<Data> | (() => Array<Data>), ignoreAccents?: boolean) {
    if (data instanceof Array) {
        // if data is an array, create a function to query that
        return function (query: string) {
            const results = [];
            for (let i = 0, l = data.length; i < l; ++i) {
                const display = data[i].display || data[i].id;
                if (getSubstringIndex(display, query, ignoreAccents) >= 0) {
                    results.push(data[i]);
                }
            }
            return results;
        };
    } else {
        // expect data to be a query function
        return data;
    }
}

const getSubstringIndex = (str: string, substr: string, ignoreAccents?: boolean) => {
    if (!ignoreAccents) {
        return str.toLowerCase().indexOf(substr.toLowerCase());
    }

    return normalizeString(str).indexOf(normalizeString(substr));
};

const removeAccents = (str: string) => {
    let formattedStr = str;

    lettersDiacritics.forEach((letterDiacritics) => {
        formattedStr = formattedStr.replace(letterDiacritics.letters, letterDiacritics.base);
    });

    return formattedStr;
};

export const normalizeString = (str: string) => removeAccents(str).toLowerCase();

export const makeMentionsMarkup = (markup: string, id: string, display: string) => {
    return markup.replace(Placeholders.id, id).replace(Placeholders.display, display);
};
