import React from 'react';
import { Card, CardContent, Typography, Alert, Divider } from '@mui/material';
import { StagingDataPreview } from '../StagingDataPreview';
import type { JobStatus } from '../types';

interface TransformPhaseProps {
  currentJobId: string;
  jobStatus: JobStatus | null;
}

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
      
      {jobStatus?.status === 'RUNNING' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Transforming... Parsing CSV and validating data
        </Alert>
      )}
      
      {jobStatus?.status === 'STAGED' && (
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
      )}
      
      {jobStatus?.status === 'FAILED' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Transform failed: {jobStatus?.errors?.[0] || 'Unknown error'}
        </Alert>
      )}
    </CardContent>
  </Card>
);