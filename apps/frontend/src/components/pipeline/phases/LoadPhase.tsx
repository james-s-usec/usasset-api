import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { LoadPhaseActions } from '../components/LoadPhaseActions';
import type { JobStatus } from '../types';

interface LoadPhaseProps {
  jobStatus: JobStatus | null;
  onApprove: () => void;
  onReject: () => void;
  onStartNewImport?: () => void;
  isProcessing?: boolean;
  showNewImportOnly?: boolean;
}

export const LoadPhase: React.FC<LoadPhaseProps> = ({
  jobStatus,
  onApprove,
  onReject,
  onStartNewImport,
  isProcessing = false,
  showNewImportOnly = false,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        Phase 3: LOAD
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {showNewImportOnly ? 'Import completed - ready for next file' : 'Review staged data and decide to import or reject'}
      </Typography>
      
      <LoadPhaseActions 
        jobStatus={jobStatus}
        onApprove={onApprove}
        onReject={onReject}
        onStartNewImport={onStartNewImport}
        isProcessing={isProcessing}
        showNewImportOnly={showNewImportOnly}
      />
    </CardContent>
  </Card>
);