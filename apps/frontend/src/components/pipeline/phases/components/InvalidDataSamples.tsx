import React from 'react';
import { Box, Typography } from '@mui/material';

interface InvalidDataSample {
  rowNumber: number;
  rawData: Record<string, string>;
  errors: string[];
}

interface InvalidDataSamplesProps {
  samples: InvalidDataSample[];
}

const InvalidDataSampleItem: React.FC<{ sample: InvalidDataSample }> = ({ sample }) => (
  <Box sx={{ 
    p: 1, 
    mb: 1, 
    border: 1, 
    borderColor: 'error.main', 
    borderRadius: 1 
  }}>
    <Typography variant="body2" fontWeight="bold">
      Row {sample.rowNumber}:
    </Typography>
    <Typography variant="body2" color="error">
      {sample.errors.join(', ')}
    </Typography>
    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
      {JSON.stringify(sample.rawData).substring(0, 100)}...
    </Typography>
  </Box>
);

export const InvalidDataSamples: React.FC<InvalidDataSamplesProps> = ({ samples }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="error" gutterBottom>
      Sample Invalid Rows:
    </Typography>
    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
      {samples.map((sample, index) => (
        <InvalidDataSampleItem key={index} sample={sample} />
      ))}
    </Box>
  </Box>
);