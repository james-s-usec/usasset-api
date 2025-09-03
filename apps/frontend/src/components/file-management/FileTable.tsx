import React, { useState } from 'react';
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
  Checkbox,
} from '@mui/material';
import type { FileData } from './types';
import { FileTableRow } from './FileTableRow';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface FileTableHeaderProps {
  selectedFiles: Set<string>;
  allFiles: FileData[];
  onSelectAll: () => void;
  onClearSelection: () => void;
}

const FileTableHeader: React.FC<FileTableHeaderProps> = ({ selectedFiles, allFiles, onSelectAll, onClearSelection }) => {
  const selectedCount = selectedFiles.size;
  const allSelected = selectedCount === allFiles.length && allFiles.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < allFiles.length;
  
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={someSelected}
            checked={allSelected}
            onChange={allSelected ? onClearSelection : onSelectAll}
            inputProps={{ 'aria-label': 'select all files' }}
          />
        </TableCell>
        <TableCell sx={{ width: '25%' }}>File Name</TableCell>
        <TableCell sx={{ width: '15%' }}>Project</TableCell>
        <TableCell sx={{ width: '15%' }}>Folder</TableCell>
        <TableCell sx={{ width: '10%' }}>Type</TableCell>
        <TableCell sx={{ width: '8%' }}>Size</TableCell>
        <TableCell sx={{ width: '12%' }}>Uploaded</TableCell>
        <TableCell align="center" sx={{ width: '15%', minWidth: 180 }}>Actions</TableCell>
      </TableRow>
    </TableHead>
  );
};

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

interface FileTableProps {
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onMoveToFolder?: (fileId: string, folderId: string | null) => Promise<void>;
  folders?: Folder[];
  onMoveToProject?: (fileId: string, projectId: string | null) => Promise<void>;
  projects?: Project[];
  onRefresh: () => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
  getFileContent?: (fileId: string) => Promise<string>;
  getPdfInfo?: (fileId: string) => Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    dimensions: { width: number; height: number };
    maxZoom: number;
    tileSize: number;
  }>;
  onBulkAssignProject?: (fileIds: string[], projectId: string | null) => Promise<void>;
  onBulkMoveToFolder?: (fileIds: string[], folderId: string | null) => Promise<void>;
  onBulkDelete?: (fileIds: string[]) => Promise<void>;
}

const EmptyRow: React.FC = () => (
  <TableRow>
    <TableCell colSpan={8} align="center">
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

interface FileTableContentProps {
  files: FileData[];
  selectedFiles: Set<string>;
  onSelectFile: (fileId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onMoveToFolder?: (fileId: string, folderId: string | null) => Promise<void>;
  folders?: Folder[];
  onMoveToProject?: (fileId: string, projectId: string | null) => Promise<void>;
  projects?: Project[];
  onPreview?: (fileId: string) => Promise<string>;
  getFileContent?: (fileId: string) => Promise<string>;
  getPdfInfo?: (fileId: string) => Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    dimensions: { width: number; height: number };
    maxZoom: number;
    tileSize: number;
  }>;
}

const FileTableContent: React.FC<FileTableContentProps> = ({
  files,
  selectedFiles,
  onSelectFile,
  onSelectAll,
  onClearSelection,
  onDownload,
  onDelete,
  onMoveToFolder,
  folders,
  onMoveToProject,
  projects,
  onPreview,
  getFileContent,
  getPdfInfo
}) => (
  <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
    <Table sx={{ minWidth: 800 }}>
      <FileTableHeader 
        selectedFiles={selectedFiles}
        allFiles={files}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
      />
      <TableBody>
        {files.length === 0 ? (
          <EmptyRow />
        ) : (
          files.map((file) => (
            <FileTableRow
              key={file.id}
              file={file}
              selected={selectedFiles.has(file.id)}
              onSelectFile={onSelectFile}
              onDownload={onDownload}
              onDelete={onDelete}
              onMoveToFolder={onMoveToFolder}
              folders={folders}
              onMoveToProject={onMoveToProject}
              projects={projects}
              onPreview={onPreview}
              getFileContent={getFileContent}
              getPdfInfo={getPdfInfo}
            />
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export const FileTable: React.FC<FileTableProps> = ({
  files,
  onDownload,
  onDelete,
  onMoveToFolder,
  folders,
  onMoveToProject,
  projects,
  onRefresh,
  onPreview,
  getFileContent,
  getPdfInfo,
  onBulkAssignProject,
  onBulkMoveToFolder,
  onBulkDelete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };
  
  const handleSelectAll = () => {
    const allFileIds = files.map(file => file.id);
    setSelectedFiles(new Set(allFileIds));
  };
  
  const handleClearSelection = () => {
    setSelectedFiles(new Set());
  };
  
  return (
    <>
      <BulkActionsToolbar
        selectedFiles={selectedFiles}
        allFiles={files}
        folders={folders || []}
        projects={projects || []}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onBulkAssignProject={onBulkAssignProject || (async () => {})}
        onBulkMoveToFolder={onBulkMoveToFolder || (async () => {})}
        onBulkDelete={onBulkDelete || (async () => {})}
      />
      <FileTableContent 
        files={files}
        selectedFiles={selectedFiles}
        onSelectFile={handleSelectFile}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onDownload={onDownload}
        onDelete={onDelete}
        onMoveToFolder={onMoveToFolder}
        folders={folders}
        onMoveToProject={onMoveToProject}
        projects={projects}
        onPreview={onPreview}
        getFileContent={getFileContent}
        getPdfInfo={getPdfInfo}
      />
      <FileSummary count={files.length} onRefresh={onRefresh} />
    </>
  );
};