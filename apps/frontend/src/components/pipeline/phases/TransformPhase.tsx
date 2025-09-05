import React, { type JSX } from 'react';
import { Card, CardContent, Typography, Alert, Divider } from '@mui/material';
import { StagingDataPreview } from '../StagingDataPreview';
import { TransformRules } from '../rules/TransformRules';
import type { JobStatus } from '../types';

interface TransformPhaseProps {
  currentJobId: string;
  jobStatus: JobStatus | null;
}

// Status alert components - reduces complexity
const RunningStatus: React.FC = () => (
  <Alert severity="info" sx={{ mt: 2 }}>
    Transforming... Parsing CSV and validating data
  </Alert>
);

const StagedStatus: React.FC<{
  jobStatus: JobStatus | null;
  currentJobId: string;
}> = ({ jobStatus, currentJobId }) => (
  <>
    <Alert severity="success" sx={{ mt: 2 }}>
      Transform complete! {jobStatus?.progress?.processed || 0} rows processed
    </Alert>
    
    <Divider sx={{ my: 3 }} />
    <Typography variant="subtitle1" gutterBottom>
      Transformed Data Preview (Staging Table)
    </Typography>
    <StagingDataPreview jobId={currentJobId} />
  </>
);

const FailedStatus: React.FC<{ jobStatus: JobStatus | null }> = ({ jobStatus }) => (
  <Alert severity="error" sx={{ mt: 2 }}>
    Transform failed: {jobStatus?.errors?.[0] || 'Unknown error'}
  </Alert>
);

// Status render logic - reduces complexity
const renderStatus = (jobStatus: JobStatus | null, currentJobId: string): JSX.Element | null => {
  if (jobStatus?.status === 'RUNNING') return <RunningStatus />;
  if (jobStatus?.status === 'STAGED') return <StagedStatus jobStatus={jobStatus} currentJobId={currentJobId} />;
  if (jobStatus?.status === 'FAILED') return <FailedStatus jobStatus={jobStatus} />;
  return null;
};

// Main component - under 30 lines and complexity under 7
export const TransformPhase: React.FC<TransformPhaseProps> = ({
  currentJobId,
  jobStatus,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        Phase 2: TRANSFORM
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Validate and transform data for staging
      </Typography>
      
      <TransformRules />
      {renderStatus(jobStatus, currentJobId)}
    </CardContent>
  </Card>
);