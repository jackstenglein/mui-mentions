import { Box, SxProps } from '@mui/material';
import React from 'react';

interface MentionProps {
    /**
     * The character sequence which triggers querying the data source.
     * Can be a string or regexp.
     * @default '@'
     */
    trigger?: string | RegExp;

    /** The display string of the mention. */
    display: string;

    /** Styles to apply to the mention. */
    sx?: SxProps;
}

const Mention: React.FC<MentionProps> = ({ display, sx }) => {
    return (
        <Box component='span' sx={sx}>
            {display}
        </Box>
    );
};

export default Mention;
