import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { mistborn, stormlight } from './data';

export const MultipleDataSources = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Multiple Data Sources</Typography>
                <Typography>
                    A single MentionsTextField can have multiple data sources. The field below has two sources,
                    triggered by @ and #.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Multiple Data Sources'
                    fullWidth
                    dataSources={[
                        {
                            data: stormlight,
                        },
                        {
                            data: mistborn,
                            trigger: '#',
                        },
                    ]}
                />
            </Stack>
        </Stack>
    );
};
