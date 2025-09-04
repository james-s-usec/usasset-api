import React from "react";
import { FileTable } from "../FileTable";
import { FileTreeView } from "../FileTreeView";
import { FileFolderView } from "../FileFolderView";
import type { FileData } from "../types";

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

type ViewMode = "table" | "tree" | "folders";

interface ViewContentProps {
  viewMode: ViewMode;
  filteredFiles: FileData[];
  folders: Folder[];
  projects: Project[];
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
  onBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
  onBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  onBulkDelete: (fileIds: string[]) => Promise<void>;
}

export const ViewContent: React.FC<ViewContentProps> = ({
  viewMode,
  filteredFiles,
  folders,
  projects,
  onDownload,
  onDelete,
  onMoveToFolder,
  onMoveToProject,
  onPreview,
  getFileContent,
  getPdfInfo,
  onRefresh,
  onBulkAssignProject,
  onBulkMoveToFolder,
  onBulkDelete,
}) => {
  if (viewMode === "table") {
    return (
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
        onBulkAssignProject={onBulkAssignProject}
        onBulkMoveToFolder={onBulkMoveToFolder}
        onBulkDelete={onBulkDelete}
      />
    );
  }

  if (viewMode === "tree") {
    return (
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
    );
  }

  return (
    <FileFolderView
      files={filteredFiles}
      folders={folders}
      projects={projects}
      onDownload={onDownload}
      onDelete={onDelete}
      onPreview={onPreview}
      onRefresh={onRefresh}
    />
  );
};
