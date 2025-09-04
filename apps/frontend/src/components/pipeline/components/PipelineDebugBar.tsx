import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import type { JobStatus } from '../types';

interface PipelineDebugBarProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  jobStatus: JobStatus | null;
  isProcessing: boolean;
}

export const PipelineDebugBar: React.FC<PipelineDebugBarProps> = ({
  selectedFile,
  selectedFileName,
  currentJobId,
  jobStatus,
  isProcessing,
}) => (
  <Card sx={{ mb: 2, bgcolor: 'grey.100' }}>
    <CardContent>
      <Typography variant="subtitle2" gutterBottom>
        Pipeline Status
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label={`File ID: ${selectedFile || 'None'}`} size="small" />
        <Chip label={`File Name: ${selectedFileName || 'None'}`} size="small" />
        <Chip label={`Job ID: ${currentJobId || 'None'}`} size="small" color={currentJobId ? 'success' : 'default'} />
        <Chip label={`Status: ${jobStatus?.status || 'No Job'}`} size="small" color={jobStatus ? 'primary' : 'default'} />
        <Chip label={`Processing: ${isProcessing ? 'Yes' : 'No'}`} size="small" color={isProcessing ? 'warning' : 'default'} />
      </Box>
    </CardContent>
  </Card>
);