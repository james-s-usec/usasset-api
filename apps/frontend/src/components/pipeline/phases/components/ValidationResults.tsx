import React from 'react';
import { Alert, Divider, Typography } from '@mui/material';
import type { ValidationResult } from '../../hooks/useExtractPhase';
import { ValidationErrors } from './ValidationErrors';
import { InvalidDataSamples } from './InvalidDataSamples';

interface ValidationResultsProps {
  validationResult: ValidationResult;
}

// Header component
const ValidationHeader: React.FC = () => (
  <>
    <Divider sx={{ my: 2 }} />
    <Typography variant="h6" gutterBottom>
      Validation Results
    </Typography>
  </>
);

// Error display component - extracted
const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <>
    <ValidationHeader />
    <Alert severity="error">{error}</Alert>
  </>
);

// Summary alert component
const SummaryAlert: React.FC<{ result: ValidationResult; isValid: boolean }> = ({ result, isValid }) => (
  <Alert severity={isValid ? 'success' : 'warning'} sx={{ mb: 2 }}>
    {result.totalRows} total rows: {result.validRows} valid, {result.invalidRows} invalid
  </Alert>
);

// Details section component
const ValidationDetails: React.FC<{ result: ValidationResult }> = ({ result }) => {
  const isAllValid = result.validRows === result.totalRows;
  
  return (
    <>
      <ValidationHeader />
      <SummaryAlert result={result} isValid={isAllValid} />
      {result.errors.length > 0 && <ValidationErrors errors={result.errors} />}
      {result.sampleInvalidData.length > 0 && <InvalidDataSamples samples={result.sampleInvalidData} />}
    </>
  );
};

// Main component - simplified and under 30 lines
export const ValidationResults: React.FC<ValidationResultsProps> = ({ validationResult }) => {
  const hasValidationError = validationResult.errors.length > 0 && 
                             validationResult.errors[0] === 'Validation failed';
  
  if (hasValidationError) {
    return <ErrorDisplay error={validationResult.errors[0]} />;
  }

  return <ValidationDetails result={validationResult} />;
};