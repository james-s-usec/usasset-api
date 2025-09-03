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
      <TableCell>File Name</TableCell>
      <TableCell>Project</TableCell>
      <TableCell>Folder</TableCell>
      <TableCell>Type</TableCell>
      <TableCell>Size</TableCell>
      <TableCell>Uploaded</TableCell>
      <TableCell align="center">Actions</TableCell>
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

interface FileTableProps {
  files: FileData[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onMoveToFolder?: (fileId: string, folderId: string | null) => Promise<void>;
  folders?: Folder[];
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

const FileTableContent: React.FC<{ files: FileData[]; onDownload: (fileId: string) => Promise<void>; onDelete: (fileId: string, fileName: string) => Promise<void>; onMoveToFolder?: (fileId: string, folderId: string | null) => Promise<void>; folders?: Folder[]; onPreview?: (fileId: string) => Promise<string>; getFileContent?: (fileId: string) => Promise<string>; getPdfInfo?: (fileId: string) => Promise<{ pageCount: number; title?: string; author?: string; dimensions: { width: number; height: number }; maxZoom: number; tileSize: number }> }> = ({ files, onDownload, onDelete, onMoveToFolder, folders, onPreview, getFileContent, getPdfInfo }) => (
  <TableContainer component={Paper}>
    <Table>
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
      onPreview={onPreview}
      getFileContent={getFileContent}
      getPdfInfo={getPdfInfo}
    />
    <FileSummary count={files.length} onRefresh={onRefresh} />
  </>
);