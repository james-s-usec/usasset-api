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

type ViewMode = "table" | "tree" | "folders" | "assets";

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

const TableView: React.FC<ViewContentProps> = (props) => (
  <FileTable
    files={props.filteredFiles}
    onDownload={props.onDownload}
    onDelete={props.onDelete}
    onMoveToFolder={props.onMoveToFolder}
    folders={props.folders}
    onMoveToProject={props.onMoveToProject}
    projects={props.projects}
    onPreview={props.onPreview}
    getFileContent={props.getFileContent}
    getPdfInfo={props.getPdfInfo}
    onRefresh={props.onRefresh}
    onBulkAssignProject={props.onBulkAssignProject}
    onBulkMoveToFolder={props.onBulkMoveToFolder}
    onBulkDelete={props.onBulkDelete}
  />
);

const TreeView: React.FC<ViewContentProps> = (props) => (
  <FileTreeView
    files={props.filteredFiles}
    folders={props.folders}
    projects={props.projects}
    onDownload={props.onDownload}
    onDelete={props.onDelete}
    onPreview={props.onPreview}
    getFileContent={props.getFileContent}
    getPdfInfo={props.getPdfInfo}
    onRefresh={props.onRefresh}
  />
);

const FolderView: React.FC<ViewContentProps> = (props) => (
  <FileFolderView
    files={props.filteredFiles}
    folders={props.folders}
    projects={props.projects}
    onDownload={props.onDownload}
    onDelete={props.onDelete}
    onPreview={props.onPreview}
    onRefresh={props.onRefresh}
  />
);

export const ViewContent: React.FC<ViewContentProps> = (props) => {
  const { viewMode } = props;
  
  if (viewMode === "table") return <TableView {...props} />;
  if (viewMode === "tree") return <TreeView {...props} />;
  return <FolderView {...props} />;
};
