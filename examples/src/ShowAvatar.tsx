import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { avatarShowcase } from './data';

export const ShowAvatar = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Show Avatar</Typography>
                <Typography>
                    Use the showAvatar field on the data source to display an avatar next to each suggestion. Suggestions
                    with an image will display it; those without will show a fallback avatar with their initials. Use
                    avatarSx to customize the fallback avatar's background color, text color, size, and more.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='With Avatars'
                    fullWidth
                    dataSources={[
                        {
                            data: avatarShowcase,
                            showAvatar: true,
                        },
                    ]}
                />

                <MentionsTextField
                    label='Custom Avatar Style'
                    fullWidth
                    dataSources={[
                        {
                            data: avatarShowcase,
                            showAvatar: true,
                            avatarSx: { bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.875rem' },
                        },
                    ]}
                />
            </Stack>
        </Stack>
    );
};
