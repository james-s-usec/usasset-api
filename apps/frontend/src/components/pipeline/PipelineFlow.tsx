import React from 'react';
import { Box, Alert } from '@mui/material';
import { PipelineHeader } from './components/PipelineHeader';
import { PipelineDebugBar } from './components/PipelineDebugBar';
import { FileSelector } from './components/FileSelector';
import { ExtractPhase } from './phases/ExtractPhase';
import { TransformPhase } from './phases/TransformPhase';
import { LoadPhase } from './phases/LoadPhase';
import { ValidationReport } from './components/ValidationReport';
import { usePipelineStatus } from './hooks/usePipelineStatus';
import { usePipelineActions } from './hooks/usePipelineActions';

interface PipelineFlowProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  importError: string | null;
  onSelectFile: () => void;
  onStartImport: () => void;
  onResetPipeline?: () => void;
}

export const PipelineFlow: React.FC<PipelineFlowProps> = (props) => {
  const { jobStatus, isProcessing } = usePipelineStatus(props.currentJobId);
  const { 
    handleApprove, 
    handleReject, 
    handleStartNewImport,
    isProcessing: isActionProcessing, 
    actionResult 
  } = usePipelineActions(props.currentJobId, props.onResetPipeline);

  return (
    <Box>
      <PipelineHeader jobStatus={jobStatus} isProcessing={isProcessing} />
      
      <PipelineDebugBar 
        {...props}
        jobStatus={jobStatus}
        isProcessing={isProcessing}
      />

      {/* Show import error */}
      {props.importError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Import Error: {props.importError}
        </Alert>
      )}
      
      {/* Show action result (approve/reject feedback) */}
      {actionResult && (
        <Alert 
          severity={actionResult.success ? 'success' : 'error'} 
          sx={{ mb: 2 }}
        >
          {actionResult.message}
        </Alert>
      )}
      
      <FileSelector 
        selectedFileName={props.selectedFileName}
        onSelectFile={props.onSelectFile}
      />

      {props.selectedFileName && (
        <ExtractPhase 
          selectedFile={props.selectedFile}
          onStartImport={props.onStartImport}
          isProcessing={isProcessing}
          currentJobId={props.currentJobId}
        />
      )}

      {props.currentJobId && (jobStatus?.status === 'RUNNING' || jobStatus?.status === 'STAGED') && (
        <TransformPhase
          currentJobId={props.currentJobId}
          jobStatus={jobStatus}
        />
      )}

      {props.currentJobId && jobStatus?.status === 'STAGED' && (
        <LoadPhase 
          jobStatus={jobStatus} 
          onApprove={handleApprove} 
          onReject={handleReject}
          onStartNewImport={handleStartNewImport}
          isProcessing={isActionProcessing}
        />
      )}

      {/* Show completed status with start new import button */}
      {actionResult && (
        <LoadPhase 
          jobStatus={jobStatus} 
          onApprove={handleApprove} 
          onReject={handleReject}
          onStartNewImport={handleStartNewImport}
          isProcessing={isActionProcessing}
          showNewImportOnly={true}
        />
      )}

      {/* Validation Report - shows after any phase completion */}
      {jobStatus && (
        <ValidationReport jobStatus={jobStatus} />
      )}
    </Box>
  );
};