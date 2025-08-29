import React from 'react';
import { Box } from '@mui/material';

interface JsonDisplayProps {
  data: unknown;
}

export const JsonDisplay = ({ data }: JsonDisplayProps): React.ReactElement => {
  return (
    <Box sx={{ 
      backgroundColor: '#f5f5f5', 
      p: 2, 
      borderRadius: 1,
      fontFamily: 'monospace',
      fontSize: '12px',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}>
      {JSON.stringify(data, null, 2)}
    </Box>
  );
};