import { describe, expect, it } from 'vitest';
import { DefaultDisplayTransform } from '../src/types';
import {
    applyChangeToValue,
    countSuggestions,
    findStartOfMentionInPlainText,
    getDataProvider,
    getEndOfLastMention,
    getMentions,
    getPlainText,
    isNumber,
    makeMentionsMarkup,
    makeTriggerRegex,
    mapPlainTextIndex,
    spliceString,
} from '../src/utils/utils';
import { defaultDataSources, markupValue, plainTextValue, users } from './fixtures';

describe('isNumber', () => {
    it('returns true for numbers', () => {
        expect(isNumber(0)).toBe(true);
        expect(isNumber(42)).toBe(true);
    });

    it('returns false for non-numbers', () => {
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
        expect(isNumber('1')).toBe(false);
    });
});

describe('spliceString', () => {
    it('replaces a substring range with insert', () => {
        expect(spliceString('hello world', 6, 11, 'there')).toBe('hello there');
    });

    it('inserts when start equals end', () => {
        expect(spliceString('hello', 5, 5, '!')).toBe('hello!');
    });
});

describe('makeMentionsMarkup', () => {
    it('fills id and display placeholders', () => {
        expect(makeMentionsMarkup('@[__display__](__id__)', 'kaladin', 'Kaladin')).toBe('@[Kaladin](kaladin)');
    });

    it('falls back to id when display is missing', () => {
        expect(makeMentionsMarkup('@[__display__](__id__)', 'kaladin')).toBe('@[kaladin](kaladin)');
    });
});

describe('DefaultDisplayTransform', () => {
    it('returns display when provided', () => {
        expect(DefaultDisplayTransform('id', 'Name')).toBe('Name');
    });

    it('falls back to id', () => {
        expect(DefaultDisplayTransform('id')).toBe('id');
    });

    it('converts spaces to non-breaking spaces when requested', () => {
        expect(DefaultDisplayTransform('id', 'First Last', true)).toBe('First\u00A0Last');
    });
});

describe('getPlainText', () => {
    it('converts mention markup to display text', () => {
        expect(getPlainText(markupValue, defaultDataSources)).toBe(plainTextValue);
    });

    it('returns plain text unchanged when there are no mentions', () => {
        expect(getPlainText('just text', defaultDataSources)).toBe('just text');
    });
});

describe('getMentions', () => {
    it('parses mentions from markup', () => {
        expect(getMentions(markupValue, defaultDataSources)).toEqual([
            {
                id: 'kaladin',
                display: 'Kaladin Stormblessed',
                dataSourceIndex: 0,
                index: 7,
                plainTextIndex: 7,
            },
        ]);
    });

    it('returns an empty array when there are no mentions', () => {
        expect(getMentions('no mentions', defaultDataSources)).toEqual([]);
    });
});

describe('mapPlainTextIndex', () => {
    it('maps an index in plain text to the markup string', () => {
        // Index 0 in plain text is also 0 in markup
        expect(mapPlainTextIndex(markupValue, defaultDataSources, 0)).toBe(0);
        // Index after "Hello, " (7) is the start of the mention markup
        expect(mapPlainTextIndex(markupValue, defaultDataSources, 7, 'START')).toBe(7);
        // END correction returns the index after the markup
        expect(mapPlainTextIndex(markupValue, defaultDataSources, 7, 'END')).toBe(7);
        // Inside the mention display with NULL returns null
        expect(mapPlainTextIndex(markupValue, defaultDataSources, 10, 'NULL')).toBeNull();
    });

    it('maps past the mention to the corresponding markup index', () => {
        // plainTextValue ends with "!" at index 27
        expect(mapPlainTextIndex(markupValue, defaultDataSources, plainTextValue.length)).toBe(markupValue.length);
    });
});

describe('findStartOfMentionInPlainText', () => {
    it('returns the start index when the caret is inside a mention', () => {
        expect(findStartOfMentionInPlainText(markupValue, defaultDataSources, 10)).toBe(7);
    });

    it('returns undefined when the caret is outside a mention', () => {
        expect(findStartOfMentionInPlainText(markupValue, defaultDataSources, 2)).toBeUndefined();
    });
});

describe('getEndOfLastMention', () => {
    it('returns the end of the last mention in plain text', () => {
        expect(getEndOfLastMention(markupValue, defaultDataSources)).toBe(7 + 'Kaladin Stormblessed'.length);
    });

    it('returns 0 when there are no mentions', () => {
        expect(getEndOfLastMention('no mentions', defaultDataSources)).toBe(0);
    });
});

describe('makeTriggerRegex', () => {
    it('matches a default @ trigger query', () => {
        const regex = makeTriggerRegex('@');
        expect('hello @kal'.match(regex)?.[2]).toBe('kal');
    });

    it('does not match queries with spaces by default', () => {
        const regex = makeTriggerRegex('@');
        expect('hello @kaladin storm'.match(regex)).toBeNull();
    });

    it('allows spaces in the query when configured', () => {
        const regex = makeTriggerRegex('@', true);
        expect('hello @kaladin storm'.match(regex)?.[2]).toBe('kaladin storm');
    });

    it('returns a custom RegExp trigger unchanged', () => {
        const custom = /#(\w+)$/;
        expect(makeTriggerRegex(custom)).toBe(custom);
    });
});

describe('getDataProvider', () => {
    it('filters an array of suggestions by query', async () => {
        const provider = getDataProvider(users);
        await expect(provider('kal')).resolves.toEqual([users[0]]);
        await expect(provider('kholin')).resolves.toEqual([users[1], users[3]]);
    });

    it('is case-insensitive', async () => {
        const provider = getDataProvider(users);
        await expect(provider('SHALLAN')).resolves.toEqual([users[2]]);
    });

    it('matches accented characters when ignoreAccents is true', async () => {
        const accented = [{ id: 'jose', display: 'José' }];
        const provider = getDataProvider(accented, true);
        await expect(provider('jose')).resolves.toEqual(accented);
    });

    it('returns an async data function unchanged', async () => {
        const asyncData = async (query: string) => users.filter((u) => u.id.includes(query));
        const provider = getDataProvider(asyncData);
        expect(provider).toBe(asyncData);
        await expect(provider('ado')).resolves.toEqual([users[1]]);
    });
});

describe('countSuggestions', () => {
    it('counts suggestions across data sources', () => {
        expect(
            countSuggestions({
                0: { queryInfo: {} as any, results: users.slice(0, 2) },
                1: { queryInfo: {} as any, results: users.slice(2) },
            }),
        ).toBe(4);
    });
});

describe('applyChangeToValue', () => {
    it('applies a plain-text insertion to the markup value', () => {
        const result = applyChangeToValue(
            'Hello',
            'Hello!',
            5,
            5,
            6,
            defaultDataSources,
        );
        expect(result).toBe('Hello!');
    });

    it('removes an entire mention when deleting inside it', () => {
        // Delete a character inside the mention display ("Kaladin Stormblessed" starts at 7)
        const before = plainTextValue;
        const after = before.slice(0, 10) + before.slice(11); // delete one char in mention
        const result = applyChangeToValue(markupValue, after, 10, 11, 10, defaultDataSources);
        expect(getMentions(result, defaultDataSources)).toEqual([]);
        expect(result).toContain('Hello');
    });
});
