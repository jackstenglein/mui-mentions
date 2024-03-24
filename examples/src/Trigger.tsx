import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { stormlight } from './data';

export const Trigger = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Trigger</Typography>
                <Typography>
                    By default, the suggestions overlay is triggered by the @ character. However, you can override this
                    using the trigger field on the dataSource.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Default Trigger'
                    fullWidth
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                />

                <MentionsTextField
                    label='Trigger with #'
                    fullWidth
                    dataSources={[
                        {
                            data: stormlight,
                            trigger: '#',
                        },
                    ]}
                />
            </Stack>
        </Stack>
    );
};
