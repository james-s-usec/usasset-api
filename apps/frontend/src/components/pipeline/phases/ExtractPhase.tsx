import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { ExtractRules } from '../rules/ExtractRules';
import { useExtractPhase } from '../hooks/useExtractPhase';
import { ExtractPhaseContent } from './components/ExtractPhaseContent';

interface ExtractPhaseProps {
  selectedFile: string | null;
  onStartImport: () => void;
  isProcessing: boolean;
  currentJobId: string | null;
}

export const ExtractPhase: React.FC<ExtractPhaseProps> = ({
  selectedFile,
  onStartImport,
  isProcessing,
  currentJobId,
}) => {
  const extractData = useExtractPhase(selectedFile, currentJobId);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          Phase 1: EXTRACT
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Extract data from CSV file
        </Typography>
        
        <ExtractRules />
        
        <ExtractPhaseContent
          extractData={extractData}
          currentJobId={currentJobId}
          selectedFile={selectedFile}
          isProcessing={isProcessing}
          onStartImport={onStartImport}
        />
      </CardContent>
    </Card>
  );
};