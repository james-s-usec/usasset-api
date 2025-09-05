import React from 'react';
import { ExtractPhase } from '../phases/ExtractPhase';
import { CleanPhase } from '../phases/CleanPhase';
import { TransformPhase } from '../phases/TransformPhase';
import { LoadPhase } from '../phases/LoadPhase';
import type { JobStatus } from '../types';

interface PipelineActionResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

interface PipelineActions {
  handleApprove: () => void;
  handleReject: () => void;
  handleStartNewImport: () => void;
  isProcessing: boolean;
  actionResult: PipelineActionResult | null;
}

interface PipelinePhasesProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  onStartImport: () => void;
  jobStatus: JobStatus | null;
  isProcessing: boolean;
  actions: PipelineActions;
}

// Extract phase component - simplified logic
const ExtractPhaseSection: React.FC<{
  selectedFile: string | null;
  selectedFileName: string | null;
  onStartImport: () => void;
  isProcessing: boolean;
  currentJobId: string | null;
}> = ({ selectedFile, selectedFileName, onStartImport, isProcessing, currentJobId }) => {
  if (!selectedFileName) return null;
  
  return (
    <ExtractPhase 
      selectedFile={selectedFile}
      onStartImport={onStartImport}
      isProcessing={isProcessing}
      currentJobId={currentJobId}
    />
  );
};

// Clean phase component - simplified logic
const CleanPhaseSection: React.FC<{
  currentJobId: string | null;
  jobStatus: JobStatus | null;
}> = ({ currentJobId, jobStatus }) => {
  const shouldShow = currentJobId && 
    (jobStatus?.status === 'RUNNING' || jobStatus?.status === 'STAGED');
  
  if (!shouldShow) return null;
  
  return (
    <CleanPhase
      currentJobId={currentJobId}
      jobStatus={jobStatus}
    />
  );
};

// Transform phase component - simplified logic
const TransformPhaseSection: React.FC<{
  currentJobId: string | null;
  jobStatus: JobStatus | null;
}> = ({ currentJobId, jobStatus }) => {
  const shouldShow = currentJobId && 
    (jobStatus?.status === 'RUNNING' || jobStatus?.status === 'STAGED');
  
  if (!shouldShow) return null;
  
  return (
    <TransformPhase
      currentJobId={currentJobId}
      jobStatus={jobStatus}
    />
  );
};

// Load phase component - simplified logic
const LoadPhaseSection: React.FC<{
  currentJobId: string | null;
  jobStatus: JobStatus | null;
  actions: PipelineActions;
}> = ({ currentJobId, jobStatus, actions }) => {
  const shouldShowStaged = currentJobId && jobStatus?.status === 'STAGED';
  const shouldShowResult = actions.actionResult;
  
  if (!shouldShowStaged && !shouldShowResult) return null;
  
  return (
    <>
      {shouldShowStaged && (
        <LoadPhase 
          jobStatus={jobStatus} 
          onApprove={actions.handleApprove} 
          onReject={actions.handleReject}
          onStartNewImport={actions.handleStartNewImport}
          isProcessing={actions.isProcessing}
        />
      )}
      
      {shouldShowResult && (
        <LoadPhase 
          jobStatus={jobStatus} 
          onApprove={actions.handleApprove} 
          onReject={actions.handleReject}
          onStartNewImport={actions.handleStartNewImport}
          isProcessing={actions.isProcessing}
          showNewImportOnly={true}
        />
      )}
    </>
  );
};

// Main component - under 30 lines and complexity under 7
export const PipelinePhases: React.FC<PipelinePhasesProps> = (props) => (
  <>
    <ExtractPhaseSection 
      selectedFile={props.selectedFile}
      selectedFileName={props.selectedFileName}
      onStartImport={props.onStartImport}
      isProcessing={props.isProcessing}
      currentJobId={props.currentJobId}
    />
    
    <CleanPhaseSection 
      currentJobId={props.currentJobId}
      jobStatus={props.jobStatus}
    />
    
    <TransformPhaseSection 
      currentJobId={props.currentJobId}
      jobStatus={props.jobStatus}
    />
    
    <LoadPhaseSection 
      currentJobId={props.currentJobId}
      jobStatus={props.jobStatus}
      actions={props.actions}
    />
  </>
);