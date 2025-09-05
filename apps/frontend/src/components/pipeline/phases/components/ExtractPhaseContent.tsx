import React from 'react';
import { Alert, CircularProgress, Box, Button, Typography, Divider } from '@mui/material';
import { RawDataPreview } from '../../components/RawDataPreview';
import { ValidationResults } from './ValidationResults';
import type { ExtractData, ValidationResult } from '../../hooks/useExtractPhase';

interface ExtractPhaseContentProps {
  extractData: ExtractData;
  currentJobId: string | null;
  selectedFile: string | null;
  isProcessing: boolean;
  onStartImport: () => void;
}

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <CircularProgress />
  </Box>
);

// Component for import action buttons
const ImportActionButtons: React.FC<{
  selectedFile: string | null;
  isProcessing: boolean;
  loading: boolean;
  validating: boolean;
  onStartImport: () => void;
  handleValidation: () => void;
}> = ({ selectedFile, isProcessing, loading, validating, onStartImport, handleValidation }) => (
  <Box sx={{ mt: 2 }}>
    <ActionButtonsRow 
      isProcessing={isProcessing}
      loading={loading}
      validating={validating}
      selectedFile={selectedFile}
      onStartImport={onStartImport}
      handleValidation={handleValidation}
    />
    <ActionHelpText />
  </Box>
);

// Component for action buttons row
const ActionButtonsRow: React.FC<{
  isProcessing: boolean;
  loading: boolean;
  validating: boolean;
  selectedFile: string | null;
  onStartImport: () => void;
  handleValidation: () => void;
}> = ({ isProcessing, loading, validating, selectedFile, onStartImport, handleValidation }) => (
  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
    <Button 
      variant="contained" 
      onClick={onStartImport}
      disabled={isProcessing || loading || validating}
      sx={{ mt: 2 }}
    >
      Start Import Process
    </Button>
    <Button 
      variant="outlined" 
      onClick={handleValidation}
      disabled={!selectedFile || isProcessing || loading || validating}
      sx={{ mt: 2 }}
    >
      {validating ? <CircularProgress size={20} /> : 'Validate Data'}
    </Button>
  </Box>
);

// Component for action help text
const ActionHelpText: React.FC = () => (
  <Typography variant="caption" display="block">
    Validate first to check for errors, or start import to process the file
  </Typography>
);

// Validation results section
const ValidationSection: React.FC<{
  validationResult: ValidationResult | null;
  currentJobId: string | null;
}> = ({ validationResult, currentJobId }) => {
  if (!validationResult || currentJobId) return null;
  
  return <ValidationResults validationResult={validationResult} />;
};

// Component for raw data preview section
const RawDataSection: React.FC<{
  rawData: Record<string, string>[];
  totalRows: number;
  currentJobId: string | null;
}> = ({ rawData, totalRows, currentJobId }) => {
  if (!rawData || currentJobId) return null;
  
  return (
    <RawDataDisplayWrapper rawData={rawData} totalRows={totalRows} />
  );
};

// Component for displaying raw data with alert
const RawDataDisplayWrapper: React.FC<{
  rawData: Record<string, string>[];
  totalRows: number;
}> = ({ rawData, totalRows }) => (
  <>
    <Divider sx={{ my: 2 }} />
    <Alert severity="info" sx={{ mb: 2 }}>
      Found {totalRows} rows in CSV file. Showing first 10 rows.
    </Alert>
    <RawDataPreview data={rawData} />
  </>
);

// Component for action buttons and completion status
const ActionSection: React.FC<{
  currentJobId: string | null;
  selectedFile: string | null;
  isProcessing: boolean;
  loading: boolean;
  validating: boolean;
  onStartImport: () => void;
  handleValidation: () => void;
}> = ({ currentJobId, selectedFile, isProcessing, loading, validating, onStartImport, handleValidation }) => {
  if (currentJobId) {
    return <CompletionAlert />;
  }
  
  return (
    <ImportActionButtons 
      selectedFile={selectedFile}
      isProcessing={isProcessing}
      loading={loading}
      validating={validating}
      onStartImport={onStartImport}
      handleValidation={handleValidation}
    />
  );
};

// Component for completion alert
const CompletionAlert: React.FC = () => (
  <Alert severity="success" sx={{ mt: 2 }}>
    Extraction completed - Data has been parsed and is ready for transformation
  </Alert>
);

// Main content renderer - extracted to reduce parent component size
const MainContent: React.FC<{
  extractData: ExtractData;
  currentJobId: string | null;
  selectedFile: string | null;
  isProcessing: boolean;
  onStartImport: () => void;
}> = ({ extractData, currentJobId, selectedFile, isProcessing, onStartImport }) => {
  const { rawData, loading, totalRows, validationResult, validating, handleValidation } = extractData;
  
  return (
    <>
      <RawDataSection 
        rawData={rawData || []} 
        totalRows={totalRows} 
        currentJobId={currentJobId} 
      />
      <ActionSection 
        currentJobId={currentJobId}
        selectedFile={selectedFile}
        isProcessing={isProcessing}
        loading={loading}
        validating={validating}
        onStartImport={onStartImport}
        handleValidation={handleValidation}
      />
      <ValidationSection 
        validationResult={validationResult} 
        currentJobId={currentJobId} 
      />
    </>
  );
};

// Main component - now under 30 lines
export const ExtractPhaseContent: React.FC<ExtractPhaseContentProps> = (props) => {
  const { extractData } = props;
  
  if (extractData.loading) {
    return <LoadingSpinner />;
  }

  return <MainContent {...props} />;
};