import { BaseSuggestionData, SuggestionDataSource } from '../src/types';

export const users: BaseSuggestionData[] = [
    { id: 'kaladin', display: 'Kaladin Stormblessed' },
    { id: 'adolin', display: 'Adolin Kholin' },
    { id: 'shallan', display: 'Shallan Davar' },
    { id: 'dalinar', display: 'Dalinar Kholin' },
];

export const defaultDataSources: SuggestionDataSource<(typeof users)[number]>[] = [
    {
        data: users,
    },
];

export const markupValue = 'Hello, @[Kaladin Stormblessed](kaladin)!';
export const plainTextValue = 'Hello, Kaladin Stormblessed!';
