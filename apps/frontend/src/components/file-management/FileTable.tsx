import React from 'react';
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
} from '@mui/material';
import type { FileData } from './types';
import { FileTableRow } from './FileTableRow';

const FileTableHeader: React.FC = () => (
  <TableHead>
    <TableRow>
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
}

const EmptyRow: React.FC = () => (
  <TableRow>
    <TableCell colSpan={7} align="center">
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

const FileTableContent: React.FC<{ files: FileData[]; onDownload: (fileId: string) => Promise<void>; onDelete: (fileId: string, fileName: string) => Promise<void>; onMoveToFolder?: (fileId: string, folderId: string | null) => Promise<void>; folders?: Folder[]; onMoveToProject?: (fileId: string, projectId: string | null) => Promise<void>; projects?: Project[]; onPreview?: (fileId: string) => Promise<string>; getFileContent?: (fileId: string) => Promise<string>; getPdfInfo?: (fileId: string) => Promise<{ pageCount: number; title?: string; author?: string; dimensions: { width: number; height: number }; maxZoom: number; tileSize: number }> }> = ({ files, onDownload, onDelete, onMoveToFolder, folders, onMoveToProject, projects, onPreview, getFileContent, getPdfInfo }) => (
  <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
    <Table sx={{ minWidth: 800 }}>
      <FileTableHeader />
      <TableBody>
        {files.length === 0 ? (
          <EmptyRow />
        ) : (
          files.map((file) => (
            <FileTableRow
              key={file.id}
              file={file}
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
}) => (
  <>
    <FileTableContent 
      files={files}
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