import AccountCircle from '@mui/icons-material/AccountCircle';
import { InputAdornment, Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, users, variants } from './data';

export const Adornment = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Input Adornments</Typography>
                <Typography>You can pass input adornments just like with the regular Mui TextField.</Typography>
            </Stack>

            {variants.map((variant) => (
                <Stack key={variant} direction='row' spacing={2}>
                    <MentionsTextField
                        variant={variant}
                        label='Start Adornment'
                        fullWidth
                        defaultValue={defaultValue}
                        dataSources={[
                            {
                                data: users,
                            },
                        ]}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <AccountCircle />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <MentionsTextField
                        variant={variant}
                        label='End Adornment'
                        fullWidth
                        defaultValue={defaultValue}
                        dataSources={[
                            {
                                data: users,
                            },
                        ]}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='start'>
                                    <AccountCircle />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Stack>
            ))}
        </Stack>
    );
};
