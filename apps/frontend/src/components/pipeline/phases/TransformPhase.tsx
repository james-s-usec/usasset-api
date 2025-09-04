import React from 'react';
import { Card, CardContent, Typography, Button, Alert, Divider } from '@mui/material';
import { StagingDataPreview } from '../StagingDataPreview';

interface TransformPhaseProps {
  currentJobId: string | null;
  jobStatus: any;
  isProcessing: boolean;
  onStartImport: () => void;
}

export const TransformPhase: React.FC<TransformPhaseProps> = ({
  currentJobId,
  jobStatus,
  isProcessing,
  onStartImport,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        Phase 2: TRANSFORM
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Parse CSV and validate data
      </Typography>
      
      {!currentJobId ? (
        <Button 
          variant="contained" 
          onClick={onStartImport}
          disabled={isProcessing}
          sx={{ mt: 2 }}
        >
          Start Import Process
        </Button>
      ) : (
        <>
          {jobStatus?.status === 'RUNNING' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Processing... Parsing and validating CSV data
            </Alert>
          )}
          {jobStatus?.status === 'STAGED' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Transform complete! {jobStatus?.progress?.processed || 0} rows processed
            </Alert>
          )}
          {jobStatus?.status === 'FAILED' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Transform failed: {jobStatus?.errors?.[0] || 'Unknown error'}
            </Alert>
          )}
        </>
      )}
      
      {/* Show staged data preview after transform */}
      {currentJobId && jobStatus?.status === 'STAGED' && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom>
            Transformed Data Preview (Staging Table)
          </Typography>
          <StagingDataPreview jobId={currentJobId} />
        </>
      )}
    </CardContent>
  </Card>
);