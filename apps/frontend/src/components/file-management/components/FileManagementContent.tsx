import React from "react";
import { Box } from "@mui/material";
import { FileUploadSection } from "../FileUploadSection";
import { type FileFilters } from "../FileFilterBar";
import { FiltersAndSummary } from "./FiltersAndSummary";
import { ViewContent } from "./ViewContent";
import { AssetDocumentView } from "../AssetDocumentView";
import type { FileData, Project, Folder } from "../types";

type ViewMode = "table" | "tree" | "folders" | "assets";

interface FileManagementState {
  files: FileData[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void>;
  fetchFolders: () => Promise<Folder[]>;
  fetchProjects: () => Promise<Project[]>;
  handleDownload: (fileId: string) => Promise<void>;
  handleDelete: (fileId: string, fileName: string) => Promise<void>;
  handleMoveToFolder: (fileId: string, folderId: string | null) => Promise<void>;
  handleMoveToProject: (fileId: string, projectId: string | null) => Promise<void>;
  handlePreview: (fileId: string) => Promise<string>;
  getFileContent: (fileId: string) => Promise<string>;
  getPdfInfo: (fileId: string) => Promise<{ pageCount: number; title?: string; author?: string; dimensions: { width: number; height: number; }; maxZoom: number; tileSize: number; }>;
  loadFiles: () => Promise<void>;
  handleBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
  handleBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  handleBulkDelete: (fileIds: string[]) => Promise<void>;
  setError: (error: string | null) => void;
}

interface FileManagementContentProps {
  state: FileManagementState;
  projects: Project[];
  viewMode: ViewMode;
  filteredFiles: FileData[];
  filters: FileFilters;
  onFiltersChange: (filters: FileFilters) => void;
  onClearFilters: () => void;
}

const FileUploadAndFilters: React.FC<{
  state: FileManagementContentProps['state'];
  projects: FileManagementContentProps['projects'];
  filteredFiles: FileManagementContentProps['filteredFiles'];
  filters: FileFilters;
  onFiltersChange: (filters: FileFilters) => void;
  onClearFilters: () => void;
}> = ({ state, projects, filteredFiles, filters, onFiltersChange, onClearFilters }) => (
  <>
    <FileUploadSection
      uploading={state.uploading}
      onFileUpload={state.handleFileUpload}
      fetchFolders={state.fetchFolders}
      fetchProjects={state.fetchProjects}
    />
    <FiltersAndSummary
      files={state.files}
      filteredFiles={filteredFiles}
      folders={state.folders}
      projects={projects}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
    />
  </>
);

const StandardFileView: React.FC<{
  viewMode: ViewMode;
  state: FileManagementState;
  filteredFiles: FileData[];
  projects: Project[];
}> = ({ viewMode, state, filteredFiles, projects }) => (
  <Box>
    <ViewContent
      viewMode={viewMode}
      filteredFiles={filteredFiles}
      folders={state.folders}
      projects={projects}
      onDownload={state.handleDownload}
      onDelete={state.handleDelete}
      onMoveToFolder={state.handleMoveToFolder}
      onMoveToProject={state.handleMoveToProject}
      onPreview={state.handlePreview}
      getFileContent={state.getFileContent}
      getPdfInfo={state.getPdfInfo}
      onRefresh={state.loadFiles}
      onBulkAssignProject={state.handleBulkAssignProject}
      onBulkMoveToFolder={state.handleBulkMoveToFolder}
      onBulkDelete={state.handleBulkDelete}
    />
  </Box>
);

export const FileManagementContent: React.FC<FileManagementContentProps> = (props) => {
  if (props.viewMode === 'assets') {
    return (
      <Box>
        <AssetDocumentView
          projects={props.projects}
          onFileDownload={props.state.handleDownload}
        />
      </Box>
    );
  }

  return (
    <Box>
      <FileUploadAndFilters {...props} />
      <StandardFileView
        viewMode={props.viewMode}
        state={props.state}
        filteredFiles={props.filteredFiles}
        projects={props.projects}
      />
    </Box>
  );
};