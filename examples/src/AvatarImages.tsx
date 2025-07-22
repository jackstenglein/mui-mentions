import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, stormlight } from './data';

export const AvatarImages = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>TextField with Images</Typography>
                <Typography>You can opt into displaying images alongside the display text</Typography>
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
