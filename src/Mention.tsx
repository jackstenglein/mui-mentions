import { Box } from '@mui/material';
import React from 'react';

interface MentionProps {
    /** The display string of the mention. */
    display: string;
}

const Mention: React.FC<MentionProps> = ({ display }) => {
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
                    backgroundColor: 'info.main',
                    borderRadius: '3px',
                    color: 'transparent',
                }}
            ></Box>
        </Box>
    );
};

export default Mention;
