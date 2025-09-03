import React from 'react';
import {
  TableCell,
  TableRow,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { FileData } from './types';

interface FileTableRowProps {
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

const getMimeTypeColor = (mimetype: string): 'primary' | 'secondary' | 'success' | 'warning' => {
  if (mimetype.includes('csv')) return 'success';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'primary';
  if (mimetype.includes('image')) return 'secondary';
  return 'warning';
};

const FileActions: React.FC<{
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
}> = ({ onDownload, onDelete }) => (
  <>
    <IconButton
      onClick={onDownload}
      color="primary"
      size="small"
      title="Download"
    >
      <DownloadIcon />
    </IconButton>
    <IconButton
      onClick={onDelete}
      color="error"
      size="small"
      title="Delete"
    >
      <DeleteIcon />
    </IconButton>
  </>
);

export const FileTableRow: React.FC<FileTableRowProps> = ({ file, onDownload, onDelete }) => (
  <TableRow hover>
    <TableCell>
      <Typography variant="body2" fontWeight="medium">
        {file.original_name}
      </Typography>
    </TableCell>
    <TableCell>
      <Chip
        label={file.mimetype}
        size="small"
        color={getMimeTypeColor(file.mimetype)}
      />
    </TableCell>
    <TableCell>{formatFileSize(file.size)}</TableCell>
    <TableCell>{formatDate(file.created_at)}</TableCell>
    <TableCell align="center">
      <FileActions
        onDownload={() => onDownload(file.id)}
        onDelete={() => onDelete(file.id, file.original_name)}
      />
    </TableCell>
  </TableRow>
);
