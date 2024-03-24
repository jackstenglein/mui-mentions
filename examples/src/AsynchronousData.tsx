import { Stack, Typography } from '@mui/material';
import React from 'react';
import { BaseSuggestionData, MentionsTextField } from '../../src';
import { stormlight } from './data';

function simulateDelay(query: string): Promise<BaseSuggestionData[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(stormlight.filter((value) => value.display.toLowerCase().indexOf(query.toLowerCase()) >= 0));
        }, 2000);
    });
}

async function fetchGithubUsers(query: string): Promise<BaseSuggestionData[]> {
    if (!query) {
        return [];
    }

    const resp = await fetch(`https://api.github.com/search/users?q=${query}`);
    const users = (await resp.json()).items;
    return users.map((u) => ({ id: u.login, display: u.login }));
}

export const AsychronousData = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Asynchronous Data</Typography>
                <Typography>
                    Instead of an array of suggestion data, you can pass to the data source an asychronous function
                    which returns an array of suggestion data. While the function is loading, a loading indicator will
                    be displayed.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Returns Results After 2 Seconds'
                    fullWidth
                    dataSources={[
                        {
                            data: simulateDelay,
                        },
                    ]}
                />

                <MentionsTextField
                    label='Fetches Users with Github Api'
                    fullWidth
                    dataSources={[
                        {
                            data: fetchGithubUsers,
                        },
                    ]}
                />
            </Stack>
        </Stack>
    );
};
