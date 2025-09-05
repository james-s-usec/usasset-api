import React from 'react';
import { Alert } from '@mui/material';

interface StagingValidationSummaryProps {
  validCount: number;
  totalCount: number;
  invalidCount: number;
}

export const StagingValidationSummary: React.FC<StagingValidationSummaryProps> = ({
  validCount,
  totalCount,
  invalidCount
}) => {
  const severity = validCount === totalCount ? 'success' : 'warning';
  
  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      Total staged rows: {totalCount} | Valid: {validCount} | Invalid: {invalidCount}
    </Alert>
  );
};