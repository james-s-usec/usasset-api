import React from 'react';
import { Card, CardContent, Typography, Button, Alert } from '@mui/material';

interface ExtractPhaseProps {
  selectedFileName: string | null;
  onSelectFile: () => void;
}

export const ExtractPhase: React.FC<ExtractPhaseProps> = ({
  selectedFileName,
  onSelectFile,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        Phase 1: EXTRACT
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Select CSV file from blob storage
      </Typography>
      
      {!selectedFileName ? (
        <Button variant="contained" onClick={onSelectFile} sx={{ mt: 2 }}>
          Select CSV File
        </Button>
      ) : (
        <Alert severity="success" sx={{ mt: 2 }}>
          Selected: {selectedFileName}
        </Alert>
      )}
    </CardContent>
  </Card>
);