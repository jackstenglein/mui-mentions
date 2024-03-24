import { Box, PaletteMode } from '@mui/material';
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
                    backgroundColor: (theme) => getColor(theme.palette.mode, color),
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
 * @param mode The current palette mode.
 * @param color The color to convert.
 * @returns A color usable by sx.backgroundColor.
 */
function getColor(mode: PaletteMode, color?: string): string {
    if (!color) {
        if (mode === 'light') {
            return 'primary.light';
        }
        return 'info.dark';
    }

    switch (color) {
        case 'primary':
        case 'secondary':
        case 'info':
        case 'success':
        case 'warning':
        case 'error':
            if (mode === 'light') return `${color}.light`;
            return `${color}.dark`;
    }

    return color;
}
