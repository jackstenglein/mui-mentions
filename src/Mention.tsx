import { Box } from '@mui/material';
import React from 'react';

interface MentionProps {
    /** The display string of the mention. */
    display: string;

    /** The color of the highlight. */
    color?: string;
}

const Mention: React.FC<MentionProps> = ({ display, color }) => {
    return (
        <Box component='span' sx={{ position: 'relative' }}>
            {display}
            <Box
                component='span'
                sx={{
                    position: 'absolute',
                    left: '-1px',
                    top: '-2px',
                    bottom: 0,
                    right: '-1px',
                    backgroundColor: getColor(color),
                    borderRadius: '3px',
                    color: 'transparent',
                }}
            ></Box>
        </Box>
    );
};

export default Mention;

/**
 * Converts the provided color into a format suitable for passing to sx.backgroundColor.
 * @param color The color to convert.
 * @returns A color usable by sx.backgroundColor.
 */
function getColor(color?: string): string {
    if (!color) {
        return 'primary.light';
    }

    switch (color) {
        case 'primary':
        case 'secondary':
        case 'info':
        case 'success':
        case 'warning':
        case 'error':
            return `${color}.light`;
    }

    return color;
}
