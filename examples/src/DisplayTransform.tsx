import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { stormlight } from './data';

export const DisplayTransform = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Display Transform</Typography>
                <Typography>
                    By default, the mention text is set to the display field on the selected suggestion data, or the id
                    field if the display field does not exist. You can override this behavior with the displayTransform
                    field on the data source.
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
                    label='Display First Name Only'
                    fullWidth
                    dataSources={[
                        {
                            data: stormlight,
                            displayTransform(id, display) {
                                return display?.split(' ')[0] || id;
                            },
                        },
                    ]}
                />
            </Stack>
        </Stack>
    );
};
