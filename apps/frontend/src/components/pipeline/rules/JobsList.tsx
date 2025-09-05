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
  Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import type { ImportJob } from './types';

interface JobsListProps {
  jobs: ImportJob[];
  loading: boolean;
  onRefresh: () => void;
}

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
  onRefresh
}) => {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

      {/* Jobs Table */}
      <Box sx={{ flex: 1, overflow: 'auto', m: 2 }}>
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Job ID</TableCell>
                <TableCell>File ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Errors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No import jobs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {job.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {job.file_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={job.status} 
                        size="small" 
                        color={getJobStatusColor(job.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {job.total_rows && (
                        <Typography variant="body2">
                          {job.processed_rows || 0} / {job.total_rows}
                          {job.error_rows && job.error_rows > 0 && (
                            <span style={{ color: 'red' }}>
                              {' '}({job.error_rows} errors)
                            </span>
                          )}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(job.started_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {job.completed_at 
                          ? new Date(job.completed_at).toLocaleString() 
                          : '-'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {job.errors && job.errors.length > 0 && (
                        <Chip 
                          label={`${job.errors.length} errors`} 
                          size="small" 
                          color="error" 
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};