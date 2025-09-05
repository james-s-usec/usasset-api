import React from 'react';
import { Button, CircularProgress } from '@mui/material';

interface ProcessingButtonsProps {
  isProcessing: boolean;
  validating: boolean;
  onValidateStaging: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const handleFillMissingData = (): void => {
  alert('Fill Missing Data feature - will set defaults for empty Room, Building, etc.');
};

// Validate button component
const ValidateButton: React.FC<{
  validating: boolean;
  isProcessing: boolean;
  onValidateStaging: () => void;
}> = ({ validating, isProcessing, onValidateStaging }) => (
  <Button 
    variant="outlined" 
    onClick={onValidateStaging}
    disabled={isProcessing || validating}
  >
    {validating ? <CircularProgress size={20} /> : 'Validate Staging Data'}
  </Button>
);

// Action buttons component
const ActionButtons: React.FC<{
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({ isProcessing, onApprove, onReject }) => (
  <>
    <Button 
      variant="contained" 
      color="success"
      onClick={onApprove}
      disabled={isProcessing}
      startIcon={isProcessing ? <CircularProgress size={20} /> : null}
    >
      {isProcessing ? 'Processing...' : 'Approve & Import to Assets Table'}
    </Button>
    <Button 
      variant="outlined" 
      color="error"
      onClick={onReject}
      disabled={isProcessing}
    >
      Reject & Clear Staging
    </Button>
  </>
);

// Main component - under 30 lines
export const ProcessingButtons: React.FC<ProcessingButtonsProps> = ({
  isProcessing,
  validating,
  onValidateStaging,
  onApprove,
  onReject
}) => (
  <>
    <ValidateButton 
      validating={validating}
      isProcessing={isProcessing}
      onValidateStaging={onValidateStaging}
    />
    <Button 
      variant="outlined" 
      color="info"
      onClick={handleFillMissingData}
    >
      Fill Missing Data
    </Button>
    <ActionButtons 
      isProcessing={isProcessing}
      onApprove={onApprove}
      onReject={onReject}
    />
  </>
);