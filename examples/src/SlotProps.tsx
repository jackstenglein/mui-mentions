import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { stormlight } from './data';

export const SlotProps = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>SlotProps</Typography>
                <Typography>
                    The additional props for inner components. Currently only `suggestionsOverlay` is supported.
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
                    label='Customized Suggestions-Overlay'
                    fullWidth
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                    slotProps={{
                        suggestionsOverlay: {
                            popper: {
                                placement: 'left-end',
                                sx: {
                                    outline: '3px solid lime',
                                },
                            },
                        },
                    }}
                />
            </Stack>
        </Stack>
    );
};
