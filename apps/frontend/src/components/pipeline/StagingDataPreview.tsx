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
  CircularProgress,
  Alert,
} from '@mui/material';
import { pipelineApi } from '../../services/pipelineApi';
import { StagingDataStats } from './components/StagingDataStats';
import { StagingTableRow } from './components/StagingTableRow';

interface StagingDataPreviewProps {
  jobId: string;
}

interface StagedRow {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}

const useStagedData = (jobId: string): {
  loading: boolean;
  data: StagedRow[];
  validCount: number;
  invalidCount: number;
  error: string | null;
} => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StagedRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStagedData = async (): Promise<void> => {
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

  return { loading, data, validCount, invalidCount, error };
};

export const StagingDataPreview: React.FC<StagingDataPreviewProps> = ({ jobId }) => {
  const { loading, data, validCount, invalidCount, error } = useStagedData(jobId);

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
      <StagingDataStats 
        validCount={validCount}
        invalidCount={invalidCount}
        dataLength={data.length}
      />

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
              <StagingTableRow 
                key={row.rowNumber}
                row={row}
                columns={columns}
              />
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