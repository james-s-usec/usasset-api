import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { TableChart as TableIcon, AccountTree as TreeIcon, Folder as FolderViewIcon } from '@mui/icons-material';
import { FileUploadSection } from './FileUploadSection';
import { FileTable } from './FileTable';
import { FileTreeView } from './FileTreeView';
import { FileFolderView } from './FileFolderView';
import { FileFilterBar, type FileFilters } from './FileFilterBar';
import { useFileManagement } from './useFileManagement';
import { applyFilters, createDefaultFilters, getFilterSummary } from './fileFilters';
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

type ViewMode = 'table' | 'tree' | 'folders';

interface MainContentProps {
  error: string | null;
  uploading: boolean;
  files: FileData[];
  filteredFiles: FileData[];
  folders: Folder[];
  projects: Project[];
  viewMode: ViewMode;
  filters: FileFilters;
  onViewModeChange: (mode: ViewMode) => void;
  onFiltersChange: (filters: FileFilters) => void;
  onClearFilters: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void>;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onMoveToFolder: (fileId: string, folderId: string | null) => Promise<void>;
  onMoveToProject: (fileId: string, projectId: string | null) => Promise<void>;
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
  filteredFiles,
  folders,
  projects,
  viewMode,
  filters,
  onViewModeChange,
  onFiltersChange,
  onClearFilters,
  onFileUpload,
  onDownload,
  onDelete,
  onMoveToFolder,
  onMoveToProject,
  onPreview,
  getFileContent,
  getPdfInfo,
  onRefresh,
  onErrorClose,
  fetchFolders,
  fetchProjects
}) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4">
        File Management
      </Typography>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
        size="small"
      >
        <ToggleButton value="table" aria-label="table view">
          <TableIcon />
          Table
        </ToggleButton>
        <ToggleButton value="tree" aria-label="tree view">
          <TreeIcon />
          Tree
        </ToggleButton>
        <ToggleButton value="folders" aria-label="folder view">
          <FolderViewIcon />
          Folders
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
    {error && <ErrorAlert error={error} onClose={onErrorClose} />}
    <FileUploadSection uploading={uploading} onFileUpload={onFileUpload} fetchFolders={fetchFolders} fetchProjects={fetchProjects} />
    
    <FileFilterBar
      files={files}
      folders={folders}
      projects={projects}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
    />
    
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {getFilterSummary(files.length, filteredFiles.length, filters)}
      </Typography>
    </Box>
    {viewMode === 'table' ? (
      <FileTable
        files={filteredFiles}
        onDownload={onDownload}
        onDelete={onDelete}
        onMoveToFolder={onMoveToFolder}
        folders={folders}
        onMoveToProject={onMoveToProject}
        projects={projects}
        onPreview={onPreview}
        getFileContent={getFileContent}
        getPdfInfo={getPdfInfo}
        onRefresh={onRefresh}
        onBulkAssignProject={state.handleBulkAssignProject}
        onBulkMoveToFolder={state.handleBulkMoveToFolder}
        onBulkDelete={state.handleBulkDelete}
      />
    ) : viewMode === 'tree' ? (
      <FileTreeView
        files={filteredFiles}
        folders={folders}
        projects={projects}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
        getFileContent={getFileContent}
        getPdfInfo={getPdfInfo}
        onRefresh={onRefresh}
      />
    ) : (
      <FileFolderView
        files={filteredFiles}
        folders={folders}
        projects={projects}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
        onRefresh={onRefresh}
      />
    )}
  </Box>
);

export const FileManagement: React.FC = () => {
  const state = useFileManagement();
  const { loadFiles } = state;
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<FileFilters>(createDefaultFilters());
  
  // Apply filters to files
  const filteredFiles = useMemo(() => {
    return applyFilters(state.files, filters);
  }, [state.files, filters]);
  
  const handleClearFilters = () => {
    setFilters(createDefaultFilters());
  };
  
  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectData = await state.fetchProjects();
        setProjects(projectData);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    loadProjects();
  }, [state.fetchProjects]);
  
  useEffect((): void => {
    loadFiles();
  }, [loadFiles]);

  if (state.loading) return <LoadingView />;

  return (
    <MainContent
      error={state.error}
      uploading={state.uploading}
      files={state.files}
      filteredFiles={filteredFiles}
      folders={state.folders}
      projects={projects}
      viewMode={viewMode}
      filters={filters}
      onViewModeChange={setViewMode}
      onFiltersChange={setFilters}
      onClearFilters={handleClearFilters}
      onFileUpload={state.handleFileUpload}
      onDownload={state.handleDownload}
      onDelete={state.handleDelete}
      onMoveToFolder={state.handleMoveToFolder}
      onMoveToProject={state.handleMoveToProject}
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