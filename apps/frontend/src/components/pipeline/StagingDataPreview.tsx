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

// State setters interface to reduce params
interface StateSetters {
  setData: (data: StagedRow[]) => void;
  setValidCount: (count: number) => void;
  setInvalidCount: (count: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

// Fetch logic with reduced params
const fetchStagedData = async (
  jobId: string,
  setters: StateSetters
): Promise<void> => {
  setters.setLoading(true);
  try {
    const result = await pipelineApi.getStagedData(jobId);
    setters.setData(result.data);
    setters.setValidCount(result.validCount);
    setters.setInvalidCount(result.invalidCount);
  } catch (err) {
    setters.setError(err instanceof Error ? err.message : 'Failed to load staged data');
  } finally {
    setters.setLoading(false);
  }
};

// Hook to fetch staged data - now under 30 lines
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
    if (!jobId) return;
    const setters: StateSetters = { setData, setValidCount, setInvalidCount, setError, setLoading };
    fetchStagedData(jobId, setters);
  }, [jobId]);

  return { loading, data, validCount, invalidCount, error };
};

// Loading states component - extracted for clarity
const LoadingStates: React.FC<{
  loading: boolean;
  error: string | null;
  hasData: boolean;
}> = ({ loading, error, hasData }) => {
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

  if (!hasData) {
    return <Alert severity="info">No staged data found</Alert>;
  }

  return null;
};

// Table header component - extracted to reduce JSX depth
const StagingTableHeader: React.FC<{ columns: string[] }> = ({ columns }) => (
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
);

// Data table component - extracted for size limit
const DataTable: React.FC<{
  columns: string[];
  data: StagedRow[];
}> = ({ columns, data }) => (
  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
    <Table stickyHeader size="small">
      <StagingTableHeader columns={columns} />
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
);

// Performance note component
const PerformanceNote: React.FC<{ dataLength: number }> = ({ dataLength }) => {
  if (dataLength !== 100) return null;
  return (
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
      * Preview limited to first 100 rows for performance
    </Typography>
  );
};

// Main component - under 30 lines
export const StagingDataPreview: React.FC<StagingDataPreviewProps> = ({ jobId }) => {
  const { loading, data, validCount, invalidCount, error } = useStagedData(jobId);
  const hasData = data.length > 0;
  
  const loadingState = LoadingStates({ loading, error, hasData });
  if (loadingState) return loadingState;

  const columns = data[0]?.mappedData 
    ? Object.keys(data[0].mappedData).filter(key => key !== 'undefined')
    : [];

  return (
    <Box>
      <StagingDataStats 
        validCount={validCount}
        invalidCount={invalidCount}
        dataLength={data.length}
      />
      <DataTable columns={columns} data={data} />
      <PerformanceNote dataLength={data.length} />
    </Box>
  );
};