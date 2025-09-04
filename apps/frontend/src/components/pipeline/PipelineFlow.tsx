import React from 'react';
import { Box, Typography, Card, CardContent, Button, Alert, Chip } from '@mui/material';
import { PipelineHeader } from './components/PipelineHeader';
import { ExtractPhase } from './phases/ExtractPhase';
import { TransformPhase } from './phases/TransformPhase';
import { LoadPhase } from './phases/LoadPhase';
import { usePipelineStatus } from './hooks/usePipelineStatus';
import { usePipelineActions } from './hooks/usePipelineActions';

interface PipelineFlowProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  importError: string | null;
  onSelectFile: () => void;
  onStartImport: () => void;
}

export const PipelineFlow: React.FC<PipelineFlowProps> = ({
  selectedFile,
  selectedFileName,
  currentJobId,
  importError,
  onSelectFile,
  onStartImport,
}) => {
  const { jobStatus, isProcessing } = usePipelineStatus(currentJobId);
  const { handleApprove, handleReject } = usePipelineActions(currentJobId);

  return (
    <Box>
      <PipelineHeader jobStatus={jobStatus} isProcessing={isProcessing} />
      
      {/* Debug Status Bar */}
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

      {/* Error Display */}
      {importError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Import Error: {importError}
        </Alert>
      )}
      
      {/* File Selection - Before all phases */}
      <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Source File
          </Typography>
          {!selectedFileName ? (
            <Button variant="contained" onClick={onSelectFile}>
              Select CSV File from Blob Storage
            </Button>
          ) : (
            <Alert severity="success">
              Selected: {selectedFileName}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Phase 1: EXTRACT - Show raw data and start import */}
      {selectedFileName && (
        <ExtractPhase 
          onStartImport={onStartImport}
          isProcessing={isProcessing}
          currentJobId={currentJobId}
        />
      )}

      {/* Phase 2: TRANSFORM - Show transformed/staged data */}
      {currentJobId && (jobStatus?.status === 'RUNNING' || jobStatus?.status === 'STAGED') && (
        <TransformPhase
          currentJobId={currentJobId}
          jobStatus={jobStatus}
        />
      )}

      {/* Phase 3: LOAD - Approve/Reject */}
      {currentJobId && jobStatus?.status === 'STAGED' && (
        <LoadPhase 
          jobStatus={jobStatus} 
          onApprove={handleApprove} 
          onReject={handleReject} 
        />
      )}
    </Box>
  );
};