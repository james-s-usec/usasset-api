import React, { useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { FileUploadSection } from './FileUploadSection';
import { FileTable } from './FileTable';
import { useFileManagement } from './useFileManagement';
import type { FileData } from './types';

const LoadingView: React.FC = () => <Box>Loading...</Box>;

const ErrorAlert: React.FC<{ error: string; onClose: () => void }> = ({ error, onClose }) => (
  <Alert severity="error" sx={{ mb: 2 }} onClose={onClose}>
    {error}
  </Alert>
);

interface MainContentProps {
  error: string | null;
  uploading: boolean;
  files: FileData[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview: (fileId: string) => Promise<string>;
  getFileContent: (fileId: string) => Promise<string>;
  onRefresh: () => Promise<void>;
  onErrorClose: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  error,
  uploading,
  files,
  onFileUpload,
  onDownload,
  onDelete,
  onPreview,
  getFileContent,
  onRefresh,
  onErrorClose
}) => (
  <Box>
    <Typography variant="h4" gutterBottom>
      File Management
    </Typography>
    {error && <ErrorAlert error={error} onClose={onErrorClose} />}
    <FileUploadSection uploading={uploading} onFileUpload={onFileUpload} />
    <FileTable
      files={files}
      onDownload={onDownload}
      onDelete={onDelete}
      onPreview={onPreview}
      getFileContent={getFileContent}
      onRefresh={onRefresh}
    />
  </Box>
);

export const FileManagement: React.FC = () => {
  const state = useFileManagement();
  const { loadFiles } = state;
  
  useEffect((): void => {
    loadFiles();
  }, [loadFiles]);

  if (state.loading) return <LoadingView />;

  return (
    <MainContent
      error={state.error}
      uploading={state.uploading}
      files={state.files}
      onFileUpload={state.handleFileUpload}
      onDownload={state.handleDownload}
      onDelete={state.handleDelete}
      onPreview={state.handlePreview}
      getFileContent={state.getFileContent}
      onRefresh={state.loadFiles}
      onErrorClose={() => state.setError(null)}
    />
  );
};