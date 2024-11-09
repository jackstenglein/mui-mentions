import { Stack, Typography } from '@mui/material';
import React from 'react';

export const Limitations = () => {
    return (
        <Stack spacing={2.5}>
            <Stack spacing={0.5}>
                <Typography variant='h5'>Limitations</Typography>
                <ul>
                    <li>
                        <Typography>Customization options are limited currently.</Typography>
                    </li>
                    <li>
                        <Typography>
                            Mentions can not split across two lines in a multiline field without rendering incorrectly.
                            Instead, multiline fields by default convert all spaces in a mention to the Unicode no-break
                            space character (\u00A0) to keep mentions on a single line.
                        </Typography>
                    </li>
                </ul>
            </Stack>
        </Stack>
    );
};
