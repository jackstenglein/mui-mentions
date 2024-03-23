import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, users } from './data';

export const Color = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Color</Typography>
                <Typography>
                    The color prop changes the outline color of the text field when focused. The mention highlight color
                    is also set to match. To change the mention highlight color independently of the outline color, use
                    the highlightColor prop.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Outlined Secondary'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: users,
                        },
                    ]}
                    color='secondary'
                    focused
                />

                <MentionsTextField
                    variant='filled'
                    label='Filled Success'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: users,
                        },
                    ]}
                    color='success'
                    focused
                />

                <MentionsTextField
                    variant='standard'
                    label='Standard Warning'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: users,
                        },
                    ]}
                    color='warning'
                    focused
                />
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Outlined Secondary; Highlight Error'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: users,
                        },
                    ]}
                    color='secondary'
                    highlightColor='error'
                    focused
                />

                <MentionsTextField
                    variant='filled'
                    label='Filled Success; Highlight Info'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: users,
                        },
                    ]}
                    color='success'
                    highlightColor='info'
                    focused
                />

                <MentionsTextField
                    variant='standard'
                    label='Standard Warning; Highlight #616161'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: users,
                        },
                    ]}
                    color='warning'
                    highlightColor='#616161'
                    focused
                />
            </Stack>
        </Stack>
    );
};
