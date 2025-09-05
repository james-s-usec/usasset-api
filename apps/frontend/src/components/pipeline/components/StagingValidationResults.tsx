import React from 'react';
import { Alert, Divider, Typography } from '@mui/material';
import { StagingValidationSummary } from './StagingValidationSummary';
import { StagingDataPreview } from './StagingDataPreview';
import { StagingInvalidRows } from './StagingInvalidRows';

interface StagedRowData {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}

interface StagingValidation {
  error?: string;
  data?: StagedRowData[];
  validCount?: number;
  invalidCount?: number;
}

interface StagingValidationResultsProps {
  stagingValidation: StagingValidation;
}

// Header component - extracted
const ValidationHeader: React.FC = () => (
  <>
    <Divider sx={{ my: 2 }} />
    <Typography variant="h6" gutterBottom>
      Staging Data Validation Results
    </Typography>
  </>
);

// Error view - extracted for clarity
const ErrorView: React.FC<{ error: string }> = ({ error }) => (
  <>
    <ValidationHeader />
    <Alert severity="error">{error}</Alert>
  </>
);

// Success view - extracted to reduce complexity
const SuccessView: React.FC<{ validation: StagingValidation }> = ({ validation }) => {
  const { data = [], validCount = 0, invalidCount = 0 } = validation;
  const hasData = data.length > 0;
  const hasInvalidRows = invalidCount > 0;

  return (
    <>
      <ValidationHeader />
      <StagingValidationSummary 
        validCount={validCount}
        totalCount={data.length}
        invalidCount={invalidCount}
      />
      {hasData && <StagingDataPreview data={data} />}
      {hasInvalidRows && <StagingInvalidRows data={data} />}
    </>
  );
};

// Main component - simplified to under 30 lines and reduced complexity
export const StagingValidationResults: React.FC<StagingValidationResultsProps> = ({
  stagingValidation
}) => {
  if (stagingValidation.error) {
    return <ErrorView error={stagingValidation.error} />;
  }
  return <SuccessView validation={stagingValidation} />;
};