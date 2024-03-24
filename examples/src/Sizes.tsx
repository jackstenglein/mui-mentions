import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, stormlight, variants } from './data';

export const Sizes = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Sizes</Typography>
                <Typography>You can use the size prop for a smaller input</Typography>
            </Stack>

            {variants.map((variant) => (
                <Stack key={variant} direction='row' spacing={2}>
                    <MentionsTextField
                        variant={variant}
                        label='Small'
                        size='small'
                        fullWidth
                        defaultValue={defaultValue}
                        dataSources={[
                            {
                                data: stormlight,
                            },
                        ]}
                    />

                    <MentionsTextField
                        variant={variant}
                        label='Normal'
                        fullWidth
                        defaultValue={defaultValue}
                        dataSources={[
                            {
                                data: stormlight,
                            },
                        ]}
                    />
                </Stack>
            ))}
        </Stack>
    );
};
