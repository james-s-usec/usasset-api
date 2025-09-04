import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Check, Error } from '@mui/icons-material';

interface StagingRowStatusProps {
  isValid: boolean;
  errors: string[] | null;
}

export const StagingRowStatus: React.FC<StagingRowStatusProps> = ({
  isValid,
  errors,
}) => {
  if (isValid) {
    return (
      <Chip 
        icon={<Check />} 
        label="Valid" 
        color="success" 
        size="small" 
      />
    );
  }

  return (
    <Tooltip title={errors?.join(', ') || 'Validation failed'}>
      <Chip 
        icon={<Error />} 
        label="Invalid" 
        color="error" 
        size="small" 
      />
    </Tooltip>
  );
};