import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';

// Tracer bullet: Placeholder for extraction rules configuration
export const ExtractRules: React.FC = () => (
  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
    <Typography variant="subtitle2" gutterBottom>
      Extraction Rules (Future Enhancement)
    </Typography>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Chip label="CSV Parser: Standard" size="small" />
      <Chip label="Delimiter: Comma" size="small" />
      <Chip label="Header Row: First" size="small" />
      <Chip label="Encoding: UTF-8" size="small" />
    </Box>
    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
      TODO: Add configurable extraction rules (delimiter, encoding, header detection)
    </Typography>
  </Paper>
);