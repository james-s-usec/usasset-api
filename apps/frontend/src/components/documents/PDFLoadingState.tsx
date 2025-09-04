import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const PDFLoadingState: React.FC = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: 400 
    }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading PDF...</Typography>
    </Box>
  );
};