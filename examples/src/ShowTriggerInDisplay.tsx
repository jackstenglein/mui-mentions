import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { stormlight } from './data';

export const ShowTriggerInDisplay = () => {
    const defaultValue = 'Hello @[Kaladin Stormblessed](kaladin)';

    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Show Trigger In Display</Typography>
                <Typography>
                    The showTriggerInDisplay prop preserves the trigger symbol (@, #, etc.) in the displayed mention
                    text. Below, mentions will display as &quot;@Kaladin Stormblessed&quot;
                </Typography>
            </Stack>

            <Stack direction='row' spacing={2}>
                <MentionsTextField
                    label='Triggers Preserved in Display'
                    fullWidth
                    defaultValue={defaultValue}
                    showTriggerInDisplay={true}
                    highlightTextColor
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
