import React from 'react';
import { Box, Button } from '@mui/material';
import { ProcessingButtons } from './ProcessingButtons';

interface LoadPhaseButtonGroupProps {
  showNewImportOnly: boolean;
  isProcessing: boolean;
  validating: boolean;
  onStartNewImport?: () => void;
  onValidateStaging: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const LoadPhaseButtonGroup: React.FC<LoadPhaseButtonGroupProps> = (props) => {
  if (props.showNewImportOnly) {
    return (
      <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={props.onStartNewImport}
        >
          Start New Import
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <ProcessingButtons
        isProcessing={props.isProcessing}
        validating={props.validating}
        onValidateStaging={props.onValidateStaging}
        onApprove={props.onApprove}
        onReject={props.onReject}
      />
    </Box>
  );
};