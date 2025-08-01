import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, stormlight } from './data';

export const Color = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Color</Typography>
                <Typography>
                    The color prop changes the outline color of the text field when focused. The mention highlight color
                    is also set to match. To change the mention highlight color independently of the outline color, use
                    the highlightColor prop. Use highlightTextColor to highlight mentions with text color instead of
                    background color.
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Outlined Secondary'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: stormlight,
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
                            data: stormlight,
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
                            data: stormlight,
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
                            data: stormlight,
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
                            data: stormlight,
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
                            data: stormlight,
                        },
                    ]}
                    color='warning'
                    highlightColor='#616161'
                    focused
                />
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Text Color Highlighting'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                    highlightTextColor={true}
                    focused
                />

                <MentionsTextField
                    variant='filled'
                    label='Filled with Text Color'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                    highlightTextColor={true}
                    focused
                />

                <MentionsTextField
                    variant='standard'
                    label='Standard with Text Color'
                    fullWidth
                    defaultValue={defaultValue}
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                    highlightTextColor={true}
                    focused
                />
            </Stack>
        </Stack>
    );
};
