import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { JobStatus } from '../types';

interface PipelineHeaderProps {
  jobStatus: JobStatus | null;
  isProcessing: boolean;
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({ 
  jobStatus, 
  isProcessing 
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h5" gutterBottom>
      Asset Import Pipeline
    </Typography>
    {isProcessing && <LinearProgress />}
    {jobStatus && (
      <Typography variant="caption" color="text.secondary">
        Status: {jobStatus.status} 
        {jobStatus.progress && ` (${jobStatus.progress.processed}/${jobStatus.progress.total})`}
      </Typography>
    )}
  </Box>
);