import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ExtractPhase } from './phases/ExtractPhase';
import { TransformPhase } from './phases/TransformPhase';
import { LoadPhase } from './phases/LoadPhase';
import { pipelineApi } from '../../services/pipelineApi';

interface PipelineFlowProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  onSelectFile: () => void;
  onStartImport: () => void;
}

// Custom hook for job status polling
const useJobStatus = (jobId: string | null) => {
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJobStatus(null);
      return;
    }

    const fetchStatus = async () => {
      try {
        const status = await pipelineApi.getJobStatus(jobId);
        setJobStatus(status);
        
        if (status.status === 'PENDING' || status.status === 'RUNNING') {
          setIsProcessing(true);
          setTimeout(fetchStatus, 2000);
        } else {
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err);
        setIsProcessing(false);
      }
    };

    fetchStatus();
  }, [jobId]);

  return { jobStatus, isProcessing };
};

export const PipelineFlow: React.FC<PipelineFlowProps> = ({
  selectedFile,
  selectedFileName,
  currentJobId,
  onSelectFile,
  onStartImport,
}) => {
  const { jobStatus, isProcessing } = useJobStatus(currentJobId);

  const handleApprove = async () => {
    // TODO: Implement approve endpoint
    console.log('Approve import for job:', currentJobId);
    alert('Approve functionality coming soon - will move staging data to assets table');
  };

  const handleReject = async () => {
    // TODO: Implement reject endpoint
    console.log('Reject import for job:', currentJobId);
    alert('Reject functionality coming soon - will clear staging data');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Asset Import Pipeline
      </Typography>

      {/* Always show Extract Phase */}
      <ExtractPhase
        selectedFileName={selectedFileName}
        onSelectFile={onSelectFile}
      />

      {/* Show Transform Phase after file selection */}
      {selectedFileName && (
        <TransformPhase
          currentJobId={currentJobId}
          jobStatus={jobStatus}
          isProcessing={isProcessing}
          onStartImport={onStartImport}
        />
      )}

      {/* Show Load Phase when data is staged */}
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