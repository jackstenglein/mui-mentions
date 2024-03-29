import { Stack, Typography } from '@mui/material';
import React from 'react';
import { MentionsTextField } from '../../src';
import { defaultValue, stormlight, variants } from './data';

export const Multiline = () => {
    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Multiline</Typography>
                <Typography>
                    The multiline prop transforms the text field into a TextareaAutosize element. Unless the rows prop
                    is set, the height of the text field dynamically matches its content (using TextareaAutosize). You
                    can use the minRows and maxRows props to bound it.
                </Typography>
            </Stack>

            <Stack spacing={1}>
                {variants.map((variant) => (
                    <Stack key={variant} direction='row' spacing={2}>
                        <MentionsTextField
                            variant={variant}
                            label='Multiline'
                            fullWidth
                            dataSources={[
                                {
                                    data: stormlight,
                                },
                            ]}
                            multiline
                        />

                        <MentionsTextField
                            variant={variant}
                            label='With Placeholder'
                            fullWidth
                            dataSources={[
                                {
                                    data: stormlight,
                                },
                            ]}
                            multiline
                            placeholder='Placeholder'
                        />

                        <MentionsTextField
                            variant={variant}
                            defaultValue={defaultValue}
                            label='Multiline (rows=4)'
                            fullWidth
                            dataSources={[
                                {
                                    data: stormlight,
                                },
                            ]}
                            multiline
                            rows={4}
                        />
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
};
