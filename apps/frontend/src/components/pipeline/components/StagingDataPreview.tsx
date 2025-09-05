import React from 'react';
import { Box, Typography } from '@mui/material';
import { StagingDataRow } from './StagingDataRow';

interface StagedRowData {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}

interface StagingDataPreviewProps {
  data: StagedRowData[];
}

export const StagingDataPreview: React.FC<StagingDataPreviewProps> = ({ data }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="success.main" gutterBottom>
      Sample Asset Data (what will be imported to database):
    </Typography>
    <Box sx={{ 
      maxHeight: 400, 
      overflow: 'auto', 
      p: 1, 
      bgcolor: 'grey.50', 
      borderRadius: 1 
    }}>
      {data.slice(0, 3).map((row, index) => (
        <StagingDataRow key={index} row={row} />
      ))}
    </Box>
  </Box>
);