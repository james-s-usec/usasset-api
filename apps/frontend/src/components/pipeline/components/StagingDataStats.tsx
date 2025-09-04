import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Check, Warning } from '@mui/icons-material';

interface StagingDataStatsProps {
  validCount: number;
  invalidCount: number;
  dataLength: number;
}

export const StagingDataStats: React.FC<StagingDataStatsProps> = ({
  validCount,
  invalidCount,
  dataLength,
}) => (
  <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
    <Typography variant="subtitle1">
      Staged Data Preview
    </Typography>
    <Chip 
      icon={<Check />}
      label={`${validCount} Valid`} 
      color="success" 
      size="small" 
    />
    {invalidCount > 0 && (
      <Chip 
        icon={<Warning />}
        label={`${invalidCount} Invalid`} 
        color="error" 
        size="small" 
      />
    )}
    <Typography variant="caption" color="text.secondary">
      (Showing first {dataLength} rows)
    </Typography>
  </Box>
);