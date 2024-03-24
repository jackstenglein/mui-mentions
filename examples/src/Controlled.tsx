import { Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import { MentionsTextField } from '../../src';
import { stormlight } from './data';

export const Controlled = () => {
    const [value, setValue] = useState('');

    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Uncontrolled vs Controlled</Typography>
                <Typography>
                    The component can be controlled or uncontrolled. If controlled, the MentionsTextField onChange
                    function has a different signature than the base Mui TextField:
                    {` (newValue: string, newPlainText: string, mentions: MentionData[]) => void;`}
                </Typography>
            </Stack>

            <Stack spacing={2} direction='row'>
                <MentionsTextField
                    label='Controlled'
                    fullWidth
                    value={value}
                    onChange={(v) => setValue(v)}
                    dataSources={[
                        {
                            data: stormlight,
                        },
                    ]}
                />

                <MentionsTextField
                    label='Uncontrolled'
                    fullWidth
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
