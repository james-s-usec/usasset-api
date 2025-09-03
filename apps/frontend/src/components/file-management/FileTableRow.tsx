import React, { useState } from 'react';
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
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import type { FileData } from './types';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { CSVPreviewDialog } from './CSVPreviewDialog';

interface FileTableRowProps {
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
  getFileContent?: (fileId: string) => Promise<string>;
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

const PreviewButton: React.FC<{ onPreview: () => void }> = ({ onPreview }) => (
  <IconButton
    onClick={onPreview}
    color="secondary"
    size="small"
    title="Preview"
  >
    <PreviewIcon />
  </IconButton>
);

const DownloadButton: React.FC<{ onDownload: () => Promise<void> }> = ({ onDownload }) => (
  <IconButton
    onClick={onDownload}
    color="primary"
    size="small"
    title="Download"
  >
    <DownloadIcon />
  </IconButton>
);

const DeleteButton: React.FC<{ onDelete: () => Promise<void> }> = ({ onDelete }) => (
  <IconButton
    onClick={onDelete}
    color="error"
    size="small"
    title="Delete"
  >
    <DeleteIcon />
  </IconButton>
);

const FileActions: React.FC<{
  file: FileData;
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
  onPreview?: () => void;
}> = ({ file, onDownload, onDelete, onPreview }) => {
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  
  return (
    <>
      {(isImage || isCSV) && onPreview && <PreviewButton onPreview={onPreview} />}
      <DownloadButton onDownload={onDownload} />
      <DeleteButton onDelete={onDelete} />
    </>
  );
};

const createPreviewHandler = (
  file: FileData,
  onPreview: (fileId: string) => Promise<string>,
  setters: {
    setLoading: (loading: boolean) => void;
    setPreviewUrl: (url: string) => void;
    setPreviewOpen: (open: boolean) => void;
  }
): (() => Promise<void>) => async (): Promise<void> => {
  setters.setLoading(true);
  try {
    const url = await onPreview(file.id);
    setters.setPreviewUrl(url);
    setters.setPreviewOpen(true);
  } catch (error) {
    console.error('Failed to get preview URL:', error);
  } finally {
    setters.setLoading(false);
  }
};

const usePreviewLogic = (file: FileData, onPreview?: (fileId: string) => Promise<string>): {
  previewOpen: boolean;
  previewUrl: string;
  loading: boolean;
  handlePreview: () => Promise<void>;
  setPreviewOpen: (open: boolean) => void;
  csvPreviewOpen: boolean;
  setCsvPreviewOpen: (open: boolean) => void;
} => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false);

  const handlePreview = onPreview 
    ? createPreviewHandler(file, onPreview, { setLoading, setPreviewUrl, setPreviewOpen })
    : async (): Promise<void> => {};

  return {
    previewOpen,
    previewUrl,
    loading,
    handlePreview,
    setPreviewOpen,
    csvPreviewOpen,
    setCsvPreviewOpen,
  };
};

const FileRowContent: React.FC<{ 
  file: FileData;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: () => void;
}> = ({ file, onDownload, onDelete, onPreview }) => (
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
        file={file}
        onDownload={() => onDownload(file.id)}
        onDelete={() => onDelete(file.id, file.original_name)}
        onPreview={onPreview}
      />
    </TableCell>
  </TableRow>
);

const createPreviewClickHandler = (
  isCSV: boolean,
  isImage: boolean,
  setCsvPreviewOpen: (open: boolean) => void,
  handlePreview: () => Promise<void>
): (() => Promise<void>) => async (): Promise<void> => {
  if (isCSV) {
    setCsvPreviewOpen(true);
  } else if (isImage) {
    await handlePreview();
  }
};

const createDefaultGetFileContent = (): ((fileId: string) => Promise<string>) => 
  (): Promise<string> => Promise.reject(new Error('getFileContent not provided'));

export const FileTableRow: React.FC<FileTableRowProps> = ({ file, onDownload, onDelete, onPreview, getFileContent }) => {
  const { previewOpen, previewUrl, loading, handlePreview, setPreviewOpen, csvPreviewOpen, setCsvPreviewOpen } = usePreviewLogic(file, onPreview);
  
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  
  const handlePreviewClick = createPreviewClickHandler(isCSV, isImage, setCsvPreviewOpen, handlePreview);

  return (
    <>
      <FileRowContent
        file={file}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={handlePreviewClick}
      />
      
      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewUrl}
        fileName={file.original_name}
        loading={loading}
      />
      
      <CSVPreviewDialog
        open={csvPreviewOpen}
        onClose={() => setCsvPreviewOpen(false)}
        fileName={file.original_name}
        fileId={file.id}
        getFileContent={getFileContent || createDefaultGetFileContent()}
      />
    </>
  );
};
