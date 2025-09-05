import React from 'react';
import { Box } from '@mui/material';
import { PipelineHeader } from './components/PipelineHeader';
import { PipelineDebugBar } from './components/PipelineDebugBar';
import { FileSelector } from './components/FileSelector';
import { ValidationReport } from './components/ValidationReport';
import { usePipelineStatus } from './hooks/usePipelineStatus';
import { usePipelineActions } from './hooks/usePipelineActions';
import { PipelinePhases } from './components/PipelinePhases';
import { PipelineAlerts } from './components/PipelineAlerts';

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
  const actions = usePipelineActions(props.currentJobId, props.onResetPipeline);

  return (
    <Box>
      <PipelineHeader jobStatus={jobStatus} isProcessing={isProcessing} />
      <PipelineDebugBar {...props} jobStatus={jobStatus} isProcessing={isProcessing} />
      <PipelineAlerts importError={props.importError} actionResult={actions.actionResult} />
      <FileSelector selectedFileName={props.selectedFileName} onSelectFile={props.onSelectFile} />
      <PipelinePhases 
        {...props} 
        jobStatus={jobStatus} 
        isProcessing={isProcessing} 
        actions={actions} 
      />
      {jobStatus && <ValidationReport jobStatus={jobStatus} />}
    </Box>
  );
};