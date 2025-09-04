// Action buttons for FileTableRow - extracted components
import React from 'react';
import { IconButton, Box } from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  DriveFileMove as MoveIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import type { FileData } from './types';

export const PreviewButton: React.FC<{ onPreview: () => void }> = ({ onPreview }) => (
  <IconButton
    onClick={onPreview}
    color="secondary"
    size="small"
    title="Preview"
  >
    <PreviewIcon />
  </IconButton>
);

export const DownloadButton: React.FC<{ onDownload: () => Promise<void> }> = ({ onDownload }) => (
  <IconButton
    onClick={onDownload}
    color="primary"
    size="small"
    title="Download"
  >
    <DownloadIcon />
  </IconButton>
);

export const DeleteButton: React.FC<{ onDelete: () => Promise<void> }> = ({ onDelete }) => (
  <IconButton
    onClick={onDelete}
    color="error"
    size="small"
    title="Delete"
  >
    <DeleteIcon />
  </IconButton>
);

export const MoveButton: React.FC<{ onMove: () => void }> = ({ onMove }) => (
  <IconButton
    onClick={onMove}
    color="primary"
    size="small"
    title="Move to Folder"
  >
    <MoveIcon />
  </IconButton>
);

export const AssignButton: React.FC<{ onAssign: () => void }> = ({ onAssign }) => (
  <IconButton
    onClick={onAssign}
    color="secondary"
    size="small"
    title="Assign to Project"
  >
    <AssignIcon />
  </IconButton>
);

export const FileActions: React.FC<{
  file: FileData;
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
  onPreview?: () => void;
  onMove?: () => void;
  onAssign?: () => void;
}> = ({ file, onDownload, onDelete, onPreview, onMove, onAssign }) => {
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  const isPDF = file.mimetype === 'application/pdf';
  const hasPreview = (isImage || isCSV || isPDF) && onPreview;
  
  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'nowrap' }}>
      {hasPreview && <PreviewButton onPreview={onPreview} />}
      <DownloadButton onDownload={onDownload} />
      {onMove && <MoveButton onMove={onMove} />}
      {onAssign && <AssignButton onAssign={onAssign} />}
      <DeleteButton onDelete={onDelete} />
    </Box>
  );
};