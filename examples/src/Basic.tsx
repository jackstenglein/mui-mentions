import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, stormlight } from './data';

export const Basic = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Basic TextField</Typography>
                <Typography>
                    MentionsTextField supports all three variants of the Mui TextField: outlined (default), filled and
                    standard.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    variant='outlined'
                    label='Outlined'
                    fullWidth
                    defaultValue={defaultValue}
                    highlightTextColor
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                />

                <MentionsTextField
                    variant='filled'
                    label='Filled'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                />

                <MentionsTextField
                    variant='standard'
                    label='Standard'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                />
            </Stack>
        </Stack>
    );
};
