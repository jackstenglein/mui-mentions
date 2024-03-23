import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, users, variants } from './data';

export const Error = () => {
    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Validation</Typography>
                <Typography>
                    The error prop toggles the error state. The helperText prop can then be used to provide feedback to
                    the user about the error.
                </Typography>
            </Stack>

            <Stack spacing={1}>
                {variants.map((variant) => (
                    <Stack key={variant} direction='row' spacing={2}>
                        <MentionsTextField
                            variant={variant}
                            defaultValue={defaultValue}
                            label='Error'
                            fullWidth
                            dataSources={[
                                {
                                    data: users,
                                },
                            ]}
                            error
                        />

                        <MentionsTextField
                            variant={variant}
                            defaultValue={defaultValue}
                            label='Error'
                            fullWidth
                            dataSources={[
                                {
                                    data: users,
                                },
                            ]}
                            error
                            helperText='Incorrect entry.'
                        />
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
};
