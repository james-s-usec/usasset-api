import React from 'react';
import { Card, CardContent, Typography, Button, Alert, Box } from '@mui/material';

interface LoadPhaseProps {
  jobStatus: any;
  onApprove: () => void;
  onReject: () => void;
}

export const LoadPhase: React.FC<LoadPhaseProps> = ({
  jobStatus,
  onApprove,
  onReject,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        Phase 3: LOAD
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Review staged data and decide to import or reject
      </Typography>
      
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
    </CardContent>
  </Card>
);