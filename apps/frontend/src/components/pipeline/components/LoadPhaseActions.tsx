import React, { useState } from 'react';
import { Box, Button, Alert, CircularProgress, Divider, Typography } from '@mui/material';
import { pipelineApi } from '../../../services/pipelineApi';
import type { JobStatus } from '../types';

interface LoadPhaseActionsProps {
  jobStatus: JobStatus | null;
  onApprove: () => void;
  onReject: () => void;
  onStartNewImport?: () => void;
  isProcessing?: boolean;
  showNewImportOnly?: boolean;
}

export const LoadPhaseActions: React.FC<LoadPhaseActionsProps> = ({
  jobStatus,
  onApprove,
  onReject,
  onStartNewImport,
  isProcessing = false,
  showNewImportOnly = false,
}) => {
  const [stagingValidation, setStagingValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const handleValidateStaging = async () => {
    if (!jobStatus?.id) return;
    
    setValidating(true);
    try {
      const result = await pipelineApi.getStagedData(jobStatus.id);
      setStagingValidation(result);
    } catch (err) {
      console.error('Staging validation failed:', err);
      setStagingValidation({ error: 'Failed to load staging data' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {showNewImportOnly ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={onStartNewImport}
          >
            Start New Import
          </Button>
        ) : (
          <>
            <Button 
              variant="outlined" 
              onClick={handleValidateStaging}
              disabled={isProcessing || validating}
            >
              {validating ? <CircularProgress size={20} /> : 'Validate Staging Data'}
            </Button>
            <Button 
              variant="outlined" 
              color="info"
              onClick={() => alert('Fill Missing Data feature - will set defaults for empty Room, Building, etc.')}
            >
              Fill Missing Data
            </Button>
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
        )}
      </Box>
      
      {jobStatus?.progress && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Ready to import {jobStatus.progress.processed} valid rows
        </Alert>
      )}

      {/* Show staging validation results */}
      {stagingValidation && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Staging Data Validation Results
          </Typography>
          {stagingValidation.error ? (
            <Alert severity="error">
              {stagingValidation.error}
            </Alert>
          ) : (
            <>
              <Alert severity={stagingValidation.validCount === stagingValidation.data.length ? 'success' : 'warning'} sx={{ mb: 2 }}>
                Total staged rows: {stagingValidation.data.length} | Valid: {stagingValidation.validCount} | Invalid: {stagingValidation.invalidCount}
              </Alert>
              
              {/* Show sample of what will be imported */}
              {stagingValidation.data.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Sample Asset Data (what will be imported to database):
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {stagingValidation.data.slice(0, 3).map((row: any, index: number) => (
                      <Box key={index} sx={{ p: 2, mb: 2, border: 1, borderColor: 'success.light', borderRadius: 1, bgcolor: 'white' }}>
                        <Typography variant="body2" fontWeight="bold" color="success.main">Row {row.rowNumber} → Asset Database Fields:</Typography>
                        <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          <div><strong>assetTag:</strong> {row.mappedData.assetTag || 'IMPORT-' + row.rowNumber}</div>
                          <div><strong>name:</strong> {row.mappedData.name || 'Unnamed Asset'}</div>
                          <div><strong>description:</strong> {row.mappedData.description || 'null'}</div>
                          <div><strong>buildingName:</strong> {row.mappedData.buildingName || 'null'}</div>
                          <div><strong>floor:</strong> {row.mappedData.floor || 'null'}</div>
                          <div><strong>roomNumber:</strong> {row.mappedData.room || 'null'}</div>
                          <div><strong>status:</strong> {row.mappedData.status || 'ACTIVE'}</div>
                          <div><strong>condition:</strong> {row.mappedData.conditionAssessment || 'GOOD'}</div>
                          <div><strong>manufacturer:</strong> {row.mappedData.manufacturer || 'null'}</div>
                          <div><strong>modelNumber:</strong> {row.mappedData.modelNumber || 'null'}</div>
                          <div><strong>serialNumber:</strong> {row.mappedData.serialNumber || 'null'}</div>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Raw CSV: {JSON.stringify(row.rawData).substring(0, 100)}...
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              
              {stagingValidation.invalidCount > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Sample Invalid Rows:
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {stagingValidation.data.filter((row: any) => !row.isValid).slice(0, 5).map((row: any, index: number) => (
                      <Box key={index} sx={{ p: 1, mb: 1, border: 1, borderColor: 'error.main', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold">Row {row.rowNumber}:</Typography>
                        <Typography variant="body2" color="error">{row.errors?.join(', ')}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {JSON.stringify(row.rawData).substring(0, 150)}...
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
    </>
  );
};