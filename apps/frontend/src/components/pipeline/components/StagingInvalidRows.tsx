import React from 'react';
import { Box, Typography } from '@mui/material';

interface InvalidRowData {
  rowNumber: number;
  isValid: boolean;
  errors: string[] | null;
  rawData: Record<string, unknown>;
}

interface StagingInvalidRowsProps {
  data: InvalidRowData[];
}

const InvalidRow: React.FC<{ row: InvalidRowData }> = ({ row }) => (
  <Box sx={{ p: 1, mb: 1, border: 1, borderColor: 'error.main', borderRadius: 1 }}>
    <Typography variant="body2" fontWeight="bold">
      Row {row.rowNumber}:
    </Typography>
    <Typography variant="body2" color="error">
      {row.errors?.join(', ')}
    </Typography>
    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
      {JSON.stringify(row.rawData).substring(0, 150)}...
    </Typography>
  </Box>
);

export const StagingInvalidRows: React.FC<StagingInvalidRowsProps> = ({ data }) => {
  const invalidRows = data.filter((row) => !row.isValid);
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="error" gutterBottom>
        Sample Invalid Rows:
      </Typography>
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        {invalidRows.slice(0, 5).map((row, index) => (
          <InvalidRow key={index} row={row} />
        ))}
      </Box>
    </Box>
  );
};