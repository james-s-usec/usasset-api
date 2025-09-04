import React from 'react';
import { Paper, Typography } from '@mui/material';

interface PDFErrorStateProps {
  error: string;
}

export const PDFErrorState: React.FC<PDFErrorStateProps> = ({ error }) => {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="error">{error}</Typography>
    </Paper>
  );
};