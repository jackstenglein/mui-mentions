import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, stormlight } from './data';

export const Images = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Images</Typography>
                <Typography>
                    By enabling images on the MentionTextField, and supplying an imageSrc value for each suggestion, you
                    can display an avatar for users, or other images for different data types.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    variant='outlined'
                    label='Outlined'
                    fullWidth
                    defaultValue={defaultValue}
                    options={{
                        images: true,
                    }}
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
