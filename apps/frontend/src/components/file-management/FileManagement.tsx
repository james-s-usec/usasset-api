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

interface Folder {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  file_count: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface MainContentProps {
  error: string | null;
  uploading: boolean;
  files: FileData[];
  folders: Folder[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void>;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onMoveToFolder: (fileId: string, folderId: string | null) => Promise<void>;
  onPreview: (fileId: string) => Promise<string>;
  getFileContent: (fileId: string) => Promise<string>;
  getPdfInfo: (fileId: string) => Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    dimensions: { width: number; height: number };
    maxZoom: number;
    tileSize: number;
  }>;
  onRefresh: () => Promise<void>;
  onErrorClose: () => void;
  fetchFolders: () => Promise<Folder[]>;
  fetchProjects: () => Promise<Project[]>;
}

const MainContent: React.FC<MainContentProps> = ({
  error,
  uploading,
  files,
  folders,
  onFileUpload,
  onDownload,
  onDelete,
  onMoveToFolder,
  onPreview,
  getFileContent,
  getPdfInfo,
  onRefresh,
  onErrorClose,
  fetchFolders,
  fetchProjects
}) => (
  <Box>
    <Typography variant="h4" gutterBottom>
      File Management
    </Typography>
    {error && <ErrorAlert error={error} onClose={onErrorClose} />}
    <FileUploadSection uploading={uploading} onFileUpload={onFileUpload} fetchFolders={fetchFolders} fetchProjects={fetchProjects} />
    <FileTable
      files={files}
      onDownload={onDownload}
      onDelete={onDelete}
      onMoveToFolder={onMoveToFolder}
      folders={folders}
      onPreview={onPreview}
      getFileContent={getFileContent}
      getPdfInfo={getPdfInfo}
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
      folders={state.folders}
      onFileUpload={state.handleFileUpload}
      onDownload={state.handleDownload}
      onDelete={state.handleDelete}
      onMoveToFolder={state.handleMoveToFolder}
      onPreview={state.handlePreview}
      getFileContent={state.getFileContent}
      getPdfInfo={state.getPdfInfo}
      onRefresh={state.loadFiles}
      onErrorClose={() => state.setError(null)}
      fetchFolders={state.fetchFolders}
      fetchProjects={state.fetchProjects}
    />
  );
};