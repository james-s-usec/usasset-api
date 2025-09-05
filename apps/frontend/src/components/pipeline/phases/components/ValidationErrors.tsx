import React from 'react';
import { Box, Typography } from '@mui/material';

interface ValidationErrorsProps {
  errors: string[];
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="error" gutterBottom>
      Validation Errors (showing first 10):
    </Typography>
    <Box sx={{ 
      maxHeight: 200, 
      overflow: 'auto', 
      p: 1, 
      bgcolor: 'grey.100', 
      borderRadius: 1 
    }}>
      {errors.slice(0, 10).map((error: string, index: number) => (
        <Typography 
          key={index} 
          variant="body2" 
          color="error" 
          sx={{ fontFamily: 'monospace' }}
        >
          {error}
        </Typography>
      ))}
    </Box>
  </Box>
);