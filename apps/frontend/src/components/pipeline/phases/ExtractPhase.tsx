import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button, Alert, Divider, CircularProgress, Box } from '@mui/material';
import { ExtractRules } from '../rules/ExtractRules';
import { RawDataPreview } from '../components/RawDataPreview';
import { pipelineApi } from '../../../services/pipelineApi';

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
  const [rawData, setRawData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [validationResult, setValidationResult] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: string[];
    sampleValidData: Array<{ rowNumber: number; rawData: Record<string, string>; mappedData: Record<string, string> }>;
    sampleInvalidData: Array<{ rowNumber: number; rawData: Record<string, string>; errors: string[] }>;
  } | null>(null);
  const [validating, setValidating] = useState(false);

  // Fetch raw CSV preview when file is selected
  useEffect(() => {
    if (selectedFile && !currentJobId) {
      setLoading(true);
      pipelineApi.previewFile(selectedFile)
        .then(preview => {
          setRawData(preview.data);
          setTotalRows(preview.totalRows);
        })
        .catch(err => {
          console.error('Failed to load preview:', err);
          setRawData(null);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedFile, currentJobId]);

  const handleValidation = async (): Promise<void> => {
    if (!selectedFile) return;
    
    setValidating(true);
    try {
      const result = await pipelineApi.validateFile(selectedFile);
      setValidationResult(result);
    } catch (err) {
      console.error('Validation failed:', err);
      setValidationResult({ 
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: ['Validation failed'],
        sampleValidData: [],
        sampleInvalidData: []
      });
    } finally {
      setValidating(false);
    }
  };

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
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Show raw data preview BEFORE import starts */}
        {rawData && !currentJobId && (
          <>
            <Divider sx={{ my: 2 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              Found {totalRows} rows in CSV file. Showing first 10 rows.
            </Alert>
            <RawDataPreview data={rawData} />
          </>
        )}
        
        {!currentJobId ? (
          <Box sx={{ mt: 2 }}>
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
            <Typography variant="caption" display="block">
              Validate first to check for errors, or start import to process the file
            </Typography>
          </Box>
        ) : (
          <Alert severity="success" sx={{ mt: 2 }}>
            Extraction completed - Data has been parsed and is ready for transformation
          </Alert>
        )}

        {/* Show validation results */}
        {validationResult && !currentJobId && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Validation Results
            </Typography>
            {validationResult.errors.length > 0 && validationResult.errors[0] === 'Validation failed' ? (
              <Alert severity="error">
                {validationResult.errors[0]}
              </Alert>
            ) : (
              <>
                <Alert severity={validationResult.validRows === validationResult.totalRows ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  {validationResult.totalRows} total rows: {validationResult.validRows} valid, {validationResult.invalidRows} invalid
                </Alert>
                
                {validationResult.errors.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Validation Errors (showing first 10):
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto', p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                      {validationResult.errors.slice(0, 10).map((error: string, index: number) => (
                        <Typography key={index} variant="body2" color="error" sx={{ fontFamily: 'monospace' }}>
                          {error}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {validationResult.sampleInvalidData.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Sample Invalid Rows:
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {validationResult.sampleInvalidData.map((sample: { rowNumber: number; rawData: Record<string, string>; errors: string[] }, index: number) => (
                        <Box key={index} sx={{ p: 1, mb: 1, border: 1, borderColor: 'error.main', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="bold">Row {sample.rowNumber}:</Typography>
                          <Typography variant="body2" color="error">{sample.errors.join(', ')}</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {JSON.stringify(sample.rawData).substring(0, 100)}...
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};