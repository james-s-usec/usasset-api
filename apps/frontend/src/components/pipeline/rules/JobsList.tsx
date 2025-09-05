import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';
import type { ImportJob } from './types';

interface JobsListProps {
  jobs: ImportJob[];
  loading: boolean;
  onRefresh: () => void;
  onDownloadPhaseResults?: (jobId: string) => void;
}

interface JobRowProps {
  job: ImportJob;
  onDownloadPhaseResults?: (jobId: string) => void;
}

const JobTableHeader: React.FC = () => (
  <TableHead>
    <TableRow>
      <TableCell>Job ID</TableCell>
      <TableCell>File ID</TableCell>
      <TableCell>Status</TableCell>
      <TableCell>Progress</TableCell>
      <TableCell>Started</TableCell>
      <TableCell>Completed</TableCell>
      <TableCell>Errors</TableCell>
      <TableCell>Actions</TableCell>
    </TableRow>
  </TableHead>
);

const JobProgressCell: React.FC<{ job: ImportJob }> = ({ job }) => {
  if (!job.total_rows) return null;
  
  return (
    <Typography variant="body2">
      {job.processed_rows || 0} / {job.total_rows}
      {job.error_rows && job.error_rows > 0 && (
        <span style={{ color: 'red' }}>
          {' '}({job.error_rows} errors)
        </span>
      )}
    </Typography>
  );
};

const JobIdCell: React.FC<{ jobId: string }> = ({ jobId }) => (
  <TableCell>
    <Typography variant="body2" fontFamily="monospace">
      {jobId.substring(0, 8)}...
    </Typography>
  </TableCell>
);

const JobFileIdCell: React.FC<{ fileId: string }> = ({ fileId }) => (
  <TableCell>
    <Typography variant="body2" fontFamily="monospace">
      {fileId}
    </Typography>
  </TableCell>
);

const JobStatusCell: React.FC<{ status: string }> = ({ status }) => (
  <TableCell>
    <Chip 
      label={status} 
      size="small" 
      color={getJobStatusColor(status)}
    />
  </TableCell>
);

const JobTimestampCell: React.FC<{ timestamp: string | null; fallback?: string }> = ({ 
  timestamp, 
  fallback = '-' 
}) => (
  <TableCell>
    <Typography variant="body2">
      {timestamp ? new Date(timestamp).toLocaleString() : fallback}
    </Typography>
  </TableCell>
);

const JobErrorsCell: React.FC<{ errors?: string[] | null }> = ({ errors }) => (
  <TableCell>
    {errors && errors.length > 0 && (
      <Chip 
        label={`${errors.length} errors`} 
        size="small" 
        color="error" 
      />
    )}
  </TableCell>
);

const JobActionsCell: React.FC<{ 
  job: ImportJob; 
  onDownloadPhaseResults?: (jobId: string) => void; 
}> = ({ job, onDownloadPhaseResults }) => {
  const handleDownload = () => {
    if (onDownloadPhaseResults) {
      onDownloadPhaseResults(job.id);
    }
  };

  const canDownload = job.status === 'COMPLETED';

  return (
    <TableCell>
      {canDownload && onDownloadPhaseResults && (
        <Tooltip title="Download Phase Results">
          <IconButton 
            size="small" 
            onClick={handleDownload}
            disabled={!canDownload}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      )}
    </TableCell>
  );
};

const JobRow: React.FC<JobRowProps> = ({ job, onDownloadPhaseResults }) => (
  <TableRow key={job.id} hover>
    <JobIdCell jobId={job.id} />
    <JobFileIdCell fileId={job.file_id} />
    <JobStatusCell status={job.status} />
    <TableCell>
      <JobProgressCell job={job} />
    </TableCell>
    <JobTimestampCell timestamp={job.started_at} />
    <JobTimestampCell timestamp={job.completed_at} />
    <JobErrorsCell errors={job.errors} />
    <JobActionsCell job={job} onDownloadPhaseResults={onDownloadPhaseResults} />
  </TableRow>
);

const EmptyJobsState: React.FC = () => (
  <TableRow>
    <TableCell colSpan={8} align="center">
      <Typography color="text.secondary">
        No import jobs found
      </Typography>
    </TableCell>
  </TableRow>
);

const JobsHeader: React.FC<{ loading: boolean; onRefresh: () => void }> = ({ 
  loading, 
  onRefresh 
}) => (
  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
    <Box sx={{ 
      display: 'flex', 
      gap: 1, 
      alignItems: 'center', 
      flexWrap: 'wrap' 
    }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        disabled={loading}
      >
        Refresh Jobs
      </Button>
    </Box>
  </Box>
);

const getJobStatusColor = (status: string): "success" | "error" | "primary" | "default" => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'RUNNING':
      return 'primary';
    default:
      return 'default';
  }
};

export const JobsList: React.FC<JobsListProps> = ({
  jobs,
  loading,
  onRefresh,
  onDownloadPhaseResults
}) => {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <JobsHeader loading={loading} onRefresh={onRefresh} />
      
      <Box sx={{ flex: 1, overflow: 'auto', m: 2 }}>
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <JobTableHeader />
            <TableBody>
              {jobs.length === 0 ? (
                <EmptyJobsState />
              ) : (
                jobs.map((job) => (
                  <JobRow key={job.id} job={job} onDownloadPhaseResults={onDownloadPhaseResults} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};