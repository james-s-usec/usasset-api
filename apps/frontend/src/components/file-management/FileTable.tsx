import React from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import type { FileData } from './types';
import { FileTableRow } from './FileTableRow';

const FileTableHeader: React.FC = () => (
  <TableHead>
    <TableRow>
      <TableCell>File Name</TableCell>
      <TableCell>Type</TableCell>
      <TableCell>Size</TableCell>
      <TableCell>Uploaded</TableCell>
      <TableCell align="center">Actions</TableCell>
    </TableRow>
  </TableHead>
);

interface FileTableProps {
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const EmptyRow: React.FC = () => (
  <TableRow>
    <TableCell colSpan={5} align="center">
      <Typography variant="body2" color="text.secondary">
        No files uploaded yet. Upload your first file to get started.
      </Typography>
    </TableCell>
  </TableRow>
);

const FileSummary: React.FC<{ count: number; onRefresh: () => Promise<void> }> = ({ count, onRefresh }) => (
  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      {count} file{count !== 1 ? 's' : ''} total
    </Typography>
    <Button variant="outlined" onClick={onRefresh} size="small">
      Refresh
    </Button>
  </Box>
);

export const FileTable: React.FC<FileTableProps> = ({
  files,
  onDownload,
  onDelete,
  onRefresh,
}) => (
  <>
    <TableContainer component={Paper}>
      <Table>
        <FileTableHeader />
        <TableBody>
          {files.length === 0 ? (
            <EmptyRow />
          ) : (
            files.map((file) => (
              <FileTableRow
                key={file.id}
                file={file}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    {files.length > 0 && <FileSummary count={files.length} onRefresh={onRefresh} />}
  </>
);