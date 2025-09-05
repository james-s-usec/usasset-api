import React, { useState } from 'react';
import { Alert } from '@mui/material';
import { pipelineApi } from '../../../services/pipelineApi';
import type { JobStatus } from '../types';
import { LoadPhaseButtonGroup } from './LoadPhaseButtonGroup';
import { StagingValidationResults } from './StagingValidationResults';

interface LoadPhaseActionsProps {
  jobStatus: JobStatus | null;
  onApprove: () => void;
  onReject: () => void;
  onStartNewImport?: () => void;
  isProcessing?: boolean;
  showNewImportOnly?: boolean;
}

// Custom hook for staging validation logic
const useStagingValidation = (jobId: string | undefined): {
  stagingValidation: unknown;
  validating: boolean;
  handleValidateStaging: () => Promise<void>;
} => {
  const [stagingValidation, setStagingValidation] = useState<unknown>(null);
  const [validating, setValidating] = useState(false);

  const handleValidateStaging = async (): Promise<void> => {
    if (!jobId) return;
    
    setValidating(true);
    try {
      const result = await pipelineApi.getStagedData(jobId);
      setStagingValidation(result);
    } catch (err) {
      console.error('Staging validation failed:', err);
      setStagingValidation({ error: 'Failed to load staging data' });
    } finally {
      setValidating(false);
    }
  };

  return { stagingValidation, validating, handleValidateStaging };
};

// Progress alert component
const ProgressAlert: React.FC<{ jobStatus: JobStatus | null }> = ({ jobStatus }) => {
  if (!jobStatus?.progress) return null;
  
  return (
    <Alert severity="info" sx={{ mt: 2 }}>
      Ready to import {jobStatus.progress.processed} valid rows
    </Alert>
  );
};

// Main component - under 30 lines
export const LoadPhaseActions: React.FC<LoadPhaseActionsProps> = ({
  jobStatus,
  onApprove,
  onReject,
  onStartNewImport,
  isProcessing = false,
  showNewImportOnly = false,
}) => {
  const { stagingValidation, validating, handleValidateStaging } = useStagingValidation(jobStatus?.id);

  return (
    <>
      <LoadPhaseButtonGroup
        showNewImportOnly={showNewImportOnly}
        isProcessing={isProcessing}
        validating={validating}
        onStartNewImport={onStartNewImport}
        onValidateStaging={handleValidateStaging}
        onApprove={onApprove}
        onReject={onReject}
      />
      
      <ProgressAlert jobStatus={jobStatus} />

      {stagingValidation && (
        <StagingValidationResults stagingValidation={stagingValidation} />
      )}
    </>
  );
};