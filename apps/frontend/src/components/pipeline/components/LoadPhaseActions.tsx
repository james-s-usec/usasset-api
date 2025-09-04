import React from 'react';
import { Box, Button, Alert } from '@mui/material';
import type { JobStatus } from '../types';

interface LoadPhaseActionsProps {
  jobStatus: JobStatus | null;
  onApprove: () => void;
  onReject: () => void;
}

export const LoadPhaseActions: React.FC<LoadPhaseActionsProps> = ({
  jobStatus,
  onApprove,
  onReject,
}) => (
  <>
    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
      <Button 
        variant="contained" 
        color="success"
        onClick={onApprove}
      >
        Approve & Import to Assets Table
      </Button>
      <Button 
        variant="outlined" 
        color="error"
        onClick={onReject}
      >
        Reject & Clear Staging
      </Button>
    </Box>
    
    {jobStatus?.progress && (
      <Alert severity="info" sx={{ mt: 2 }}>
        Ready to import {jobStatus.progress.processed} valid rows
      </Alert>
    )}
  </>
);