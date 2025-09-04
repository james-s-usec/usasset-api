import React from 'react';
import { Box } from '@mui/material';

interface PDFViewerContainerProps {
  children: React.ReactNode;
}

export const PDFViewerContainer: React.FC<PDFViewerContainerProps> = ({ children }) => (
  <Box sx={{ 
    height: { 
      xs: '100dvh', // Dynamic viewport height for mobile
      sm: '100vh'   // Standard viewport height for desktop
    }, 
    display: 'flex', 
    flexDirection: 'column' 
  }}>
    {children}
  </Box>
);

export const PDFMapWrapper: React.FC<PDFViewerContainerProps> = ({ children }) => (
  <Box sx={{ flexGrow: 1, position: 'relative' }}>
    {children}
  </Box>
);