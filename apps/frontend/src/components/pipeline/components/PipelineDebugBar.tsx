import React, { type JSX } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import type { JobStatus } from '../types';

interface PipelineDebugBarProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  jobStatus: JobStatus | null;
  isProcessing: boolean;
}

// Status chip creation helpers - reduces complexity
const createFileChips = (selectedFile: string | null, selectedFileName: string | null): JSX.Element[] => [
  <Chip key="file-id" label={`File ID: ${selectedFile || 'None'}`} size="small" />,
  <Chip key="file-name" label={`File Name: ${selectedFileName || 'None'}`} size="small" />
];

const createJobIdChip = (currentJobId: string | null): JSX.Element => (
  <Chip 
    key="job-id" 
    label={`Job ID: ${currentJobId || 'None'}`} 
    size="small" 
    color={currentJobId ? 'success' : 'default'} 
  />
);

const createStatusChip = (jobStatus: JobStatus | null): JSX.Element => (
  <Chip 
    key="status" 
    label={`Status: ${jobStatus?.status || 'No Job'}`} 
    size="small" 
    color={jobStatus ? 'primary' : 'default'} 
  />
);

const createProcessingChip = (isProcessing: boolean): JSX.Element => (
  <Chip 
    key="processing" 
    label={`Processing: ${isProcessing ? 'Yes' : 'No'}`} 
    size="small" 
    color={isProcessing ? 'warning' : 'default'} 
  />
);

// Main component - complexity under 7
export const PipelineDebugBar: React.FC<PipelineDebugBarProps> = ({
  selectedFile,
  selectedFileName,
  currentJobId,
  jobStatus,
  isProcessing,
}) => {
  const fileChips = createFileChips(selectedFile, selectedFileName);
  
  return (
    <Card sx={{ mb: 2, bgcolor: 'grey.100' }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Pipeline Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {fileChips}
          {createJobIdChip(currentJobId)}
          {createStatusChip(jobStatus)}
          {createProcessingChip(isProcessing)}
        </Box>
      </CardContent>
    </Card>
  );
};