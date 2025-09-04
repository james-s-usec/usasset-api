import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Checkbox,
  Tooltip,
} from '@mui/material';
import { Check, Warning, Error } from '@mui/icons-material';
import { pipelineApi } from '../../services/pipelineApi';

interface StagingDataPreviewProps {
  jobId: string;
}

interface StagedRow {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: any;
  mappedData: any;
  errors: string[] | null;
}

export const StagingDataPreview: React.FC<StagingDataPreviewProps> = ({ jobId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StagedRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStagedData = async () => {
      setLoading(true);
      try {
        const result = await pipelineApi.getStagedData(jobId);
        setData(result.data);
        setValidCount(result.validCount);
        setInvalidCount(result.invalidCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load staged data');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchStagedData();
    }
  }, [jobId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (data.length === 0) {
    return <Alert severity="info">No staged data found</Alert>;
  }

  // Get column headers from mapped data
  const columns = data.length > 0 && data[0].mappedData 
    ? Object.keys(data[0].mappedData).filter(key => key !== 'undefined')
    : [];

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1">
          Staged Data Preview
        </Typography>
        <Chip 
          icon={<Check />}
          label={`${validCount} Valid`} 
          color="success" 
          size="small" 
        />
        {invalidCount > 0 && (
          <Chip 
            icon={<Warning />}
            label={`${invalidCount} Invalid`} 
            color="error" 
            size="small" 
          />
        )}
        <Typography variant="caption" color="text.secondary">
          (Showing first {data.length} rows)
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">Import</TableCell>
              <TableCell>Row</TableCell>
              <TableCell>Status</TableCell>
              {columns.map(col => (
                <TableCell key={col}>
                  {col.replace(/([A-Z])/g, ' $1').trim()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow 
                key={row.rowNumber}
                sx={{ 
                  backgroundColor: !row.isValid ? 'error.50' : 'inherit',
                  '&:hover': { backgroundColor: !row.isValid ? 'error.100' : 'action.hover' }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={row.willImport}
                    disabled={!row.isValid}
                    size="small"
                  />
                </TableCell>
                <TableCell>{row.rowNumber}</TableCell>
                <TableCell>
                  {row.isValid ? (
                    <Chip 
                      icon={<Check />} 
                      label="Valid" 
                      color="success" 
                      size="small" 
                    />
                  ) : (
                    <Tooltip title={row.errors?.join(', ') || 'Validation failed'}>
                      <Chip 
                        icon={<Error />} 
                        label="Invalid" 
                        color="error" 
                        size="small" 
                      />
                    </Tooltip>
                  )}
                </TableCell>
                {columns.map(col => (
                  <TableCell key={col}>
                    {row.mappedData?.[col] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {data.length === 100 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          * Preview limited to first 100 rows for performance
        </Typography>
      )}
    </Box>
  );
};