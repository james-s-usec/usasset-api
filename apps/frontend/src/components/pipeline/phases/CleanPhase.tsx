import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { CleanRules } from '../rules/CleanRules';
import type { JobStatus } from '../types';

interface CleanPhaseProps {
  currentJobId: string | null;
  jobStatus: JobStatus | null;
}

export const CleanPhase: React.FC<CleanPhaseProps> = ({
  currentJobId,
  jobStatus,
}) => {
  // Only show during active job processing
  if (!currentJobId || !jobStatus) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          Phase 3: CLEAN
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Apply cleaning rules to normalize and standardize data
        </Typography>
        
        <CleanRules />
        
        {jobStatus.phase === 'CLEAN' && (
          <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
            ✓ Cleaning phase in progress...
          </Typography>
        )}
        
        {jobStatus.progress && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Processed: {jobStatus.progress.processedRows} / {jobStatus.progress.totalRows} rows
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};