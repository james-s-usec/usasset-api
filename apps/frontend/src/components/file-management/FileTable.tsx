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

const FileRows: React.FC<{
  files: FileData[];
  selectedFiles: Set<string>;
  onSelectFile: (fileId: string) => void;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onMoveToFolder?: (fileId: string, folderId: string | null) => Promise<void>;
  folders?: Folder[];
  onMoveToProject?: (fileId: string, projectId: string | null) => Promise<void>;
  projects?: Project[];
  onPreview?: (fileId: string) => Promise<string>;
  getFileContent?: (fileId: string) => Promise<string>;
  getPdfInfo?: FileTableContentProps['getPdfInfo'];
}> = (props) => (
  <>
    {props.files.map((file) => (
      <FileTableRow
        key={file.id}
        file={file}
        selected={props.selectedFiles.has(file.id)}
        onSelectFile={props.onSelectFile}
        onDownload={props.onDownload}
        onDelete={props.onDelete}
        onMoveToFolder={props.onMoveToFolder}
        folders={props.folders}
        onMoveToProject={props.onMoveToProject}
        projects={props.projects}
        onPreview={props.onPreview}
        getFileContent={props.getFileContent}
        getPdfInfo={props.getPdfInfo}
      />
    ))}
  </>
);

const FileTableContent: React.FC<FileTableContentProps> = (props) => {
  const tableBody = props.files.length === 0 ? <EmptyRow /> : <FileRows {...props} />;
  
  return (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
      <Table sx={{ minWidth: 800 }}>
        <FileTableHeader 
          selectedFiles={props.selectedFiles}
          allFiles={props.files}
          onSelectAll={props.onSelectAll}
          onClearSelection={props.onClearSelection}
        />
        <TableBody>{tableBody}</TableBody>
      </Table>
    </TableContainer>
  );
};

const useFileSelection = (): {
  selectedFiles: Set<string>;
  handleSelectFile: (fileId: string) => void;
  handleSelectAll: (files: FileData[]) => void;
  handleClearSelection: () => void;
} => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  const handleSelectFile = (fileId: string): void => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };
  
  const handleSelectAll = (files: FileData[]): void => {
    const allFileIds = files.map(file => file.id);
    setSelectedFiles(new Set(allFileIds));
  };
  
  const handleClearSelection = (): void => {
    setSelectedFiles(new Set());
  };
  
  return {
    selectedFiles,
    handleSelectFile,
    handleSelectAll,
    handleClearSelection
  };
};

const FileTableActions: React.FC<{
  files: FileData[];
  selectedFiles: Set<string>;
  folders?: Folder[];
  projects?: Project[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkAssignProject?: (fileIds: string[], projectId: string | null) => Promise<void>;
  onBulkMoveToFolder?: (fileIds: string[], folderId: string | null) => Promise<void>;
  onBulkDelete?: (fileIds: string[]) => Promise<void>;
}> = (props) => (
  <BulkActionsToolbar
    selectedFiles={props.selectedFiles}
    allFiles={props.files}
    folders={props.folders || []}
    projects={props.projects || []}
    onClearSelection={props.onClearSelection}
    onSelectAll={props.onSelectAll}
    onBulkAssignProject={props.onBulkAssignProject || (async (): Promise<void> => {})}
    onBulkMoveToFolder={props.onBulkMoveToFolder || (async (): Promise<void> => {})}
    onBulkDelete={props.onBulkDelete || (async (): Promise<void> => {})}
  />
);

const FileTableMainContent: React.FC<FileTableProps & { selection: ReturnType<typeof useFileSelection> }> = (props) => {
  const contentProps = {
    files: props.files,
    selectedFiles: props.selection.selectedFiles,
    onSelectFile: props.selection.handleSelectFile,
    onSelectAll: (): void => props.selection.handleSelectAll(props.files),
    onClearSelection: props.selection.handleClearSelection,
    onDownload: props.onDownload,
    onDelete: props.onDelete,
    onMoveToFolder: props.onMoveToFolder,
    folders: props.folders,
    onMoveToProject: props.onMoveToProject,
    projects: props.projects,
    onPreview: props.onPreview,
    getFileContent: props.getFileContent,
    getPdfInfo: props.getPdfInfo
  };
  
  return <FileTableContent {...contentProps} />;
};

const FileTableMain: React.FC<FileTableProps & { selection: ReturnType<typeof useFileSelection> }> = (props) => (
  <>
    <FileTableActions
      files={props.files}
      selectedFiles={props.selection.selectedFiles}
      folders={props.folders}
      projects={props.projects}
      onClearSelection={props.selection.handleClearSelection}
      onSelectAll={() => props.selection.handleSelectAll(props.files)}
      onBulkAssignProject={props.onBulkAssignProject}
      onBulkMoveToFolder={props.onBulkMoveToFolder}
      onBulkDelete={props.onBulkDelete}
    />
    <FileTableMainContent {...props} />
    <FileSummary count={props.files.length} onRefresh={props.onRefresh} />
  </>
);

export const FileTable: React.FC<FileTableProps> = (props) => {
  const selection = useFileSelection();
  return <FileTableMain {...props} selection={selection} />;
};