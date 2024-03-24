import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { stormlight } from './data';

export const AppendSpaceOnAdd = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Append Space on Add</Typography>
                <Typography>
                    Use the appendSpaceOnAdd field on the data source to automatically add a space after a mention is
                    selected.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Default'
                    fullWidth
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                />

                <MentionsTextField
                    label='Append Space on Add'
                    fullWidth
                    dataSources={[
                        {
                            data: stormlight,
                            appendSpaceOnAdd: true,
                        },
                    ]}
                />
            </Stack>
        </Stack>
    );
};
