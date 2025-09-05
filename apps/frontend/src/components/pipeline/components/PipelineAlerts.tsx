import React from 'react';
import { Alert } from '@mui/material';

interface ActionResult {
  success: boolean;
  message: string;
}

interface PipelineAlertsProps {
  importError: string | null;
  actionResult: ActionResult | null;
}

export const PipelineAlerts: React.FC<PipelineAlertsProps> = ({
  importError,
  actionResult
}) => (
  <>
    {importError && (
      <Alert severity="error" sx={{ mb: 2 }}>
        Import Error: {importError}
      </Alert>
    )}
    
    {actionResult && (
      <Alert 
        severity={actionResult.success ? 'success' : 'error'} 
        sx={{ mb: 2 }}
      >
        {actionResult.message}
      </Alert>
    )}
  </>
);