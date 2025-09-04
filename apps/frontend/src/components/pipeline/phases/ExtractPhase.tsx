import React from 'react';
import { Card, CardContent, Typography, Button, Alert } from '@mui/material';

interface ExtractPhaseProps {
  onStartImport: () => void;
  isProcessing: boolean;
  currentJobId: string | null;
}

export const ExtractPhase: React.FC<ExtractPhaseProps> = ({
  onStartImport,
  isProcessing,
  currentJobId,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        Phase 1: EXTRACT
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Extract data from CSV file
      </Typography>
      
      {!currentJobId ? (
        <>
          <Button 
            variant="contained" 
            onClick={onStartImport}
            disabled={isProcessing}
            sx={{ mt: 2 }}
          >
            Start Import Process
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            This will parse the CSV and extract the data for transformation
          </Typography>
        </>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          Extraction started - processing CSV file...
        </Alert>
      )}
    </CardContent>
  </Card>
);