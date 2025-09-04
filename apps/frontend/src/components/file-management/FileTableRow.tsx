import React, { useState } from 'react';
import {
  TableCell,
  TableRow,
  Typography,
  Chip,
  Box,
  Checkbox,
} from '@mui/material';
import type { FileData } from './types';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { CSVPreviewDialog } from './CSVPreviewDialog';
import { PDFPreviewDialog } from './PDFPreviewDialog';
import { formatFileSize, formatDate, getMimeTypeColor, getFileTypeLabel } from './FileTableRow.helpers';
import { FileActions } from './FileTableRow.actions';
import { FolderMoveDialog, ProjectMoveDialog } from './FileTableRow.dialogs';
import { usePreviewLogic, createPreviewClickHandler, createDefaultGetFileContent } from './FileTableRow.hooks';

// Types moved to dialogs file, imported via FileTableRow.dialogs
type Folder = Parameters<typeof FolderMoveDialog>[0]['folders'][0];
type Project = Parameters<typeof ProjectMoveDialog>[0]['projects'][0];

interface FileTableRowProps {
  file: FileData;
  selected?: boolean;
  onSelectFile?: (fileId: string) => void;
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

// Helper functions moved to FileTableRow.helpers.ts

// Action components moved to FileTableRow.actions.tsx

// Preview logic moved to FileTableRow.hooks.ts

const CheckboxCell: React.FC<{
  fileId: string;
  selected?: boolean;
  onSelectFile?: (fileId: string) => void;
}> = ({ fileId, selected, onSelectFile }) => (
  <TableCell padding="checkbox">
    {onSelectFile && (
      <Checkbox
        checked={selected || false}
        onChange={() => onSelectFile(fileId)}
        inputProps={{ 'aria-labelledby': `file-name-${fileId}` }}
      />
    )}
  </TableCell>
);

const NameCell: React.FC<{ file: FileData }> = ({ file }) => (
  <TableCell>
    <Typography variant="body2" fontWeight="medium" id={`file-name-${file.id}`}>
      {file.original_name}
    </Typography>
  </TableCell>
);

const ProjectCell: React.FC<{ project?: FileData['project'] }> = ({ project }) => (
  <TableCell>
    {project ? (
      <Typography variant="body2" fontSize="0.875rem" color="primary.main">
        {project.name}
      </Typography>
    ) : (
      <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
        No Project
      </Typography>
    )}
  </TableCell>
);

const FolderCell: React.FC<{ folder?: FileData['folder'] }> = ({ folder }) => (
  <TableCell>
    {folder ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box 
          sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: 1, 
            bgcolor: folder.color || '#gray',
          }} 
        />
        <Typography variant="body2" fontSize="0.875rem">
          {folder.name}
        </Typography>
      </Box>
    ) : (
      <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
        Unorganized
      </Typography>
    )}
  </TableCell>
);

const TypeCell: React.FC<{ mimetype: string }> = ({ mimetype }) => (
  <TableCell>
    <Chip
      label={getFileTypeLabel(mimetype)}
      size="small"
      color={getMimeTypeColor(mimetype)}
      title={mimetype}
    />
  </TableCell>
);

const ActionsCell: React.FC<{
  file: FileData;
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
  onPreview?: () => void;
  onMove?: () => void;
  onAssign?: () => void;
}> = ({ file, onDownload, onDelete, onPreview, onMove, onAssign }) => (
  <TableCell align="center" sx={{ width: '15%', minWidth: 180 }}>
    <FileActions
      file={file}
      onDownload={onDownload}
      onDelete={onDelete}
      onPreview={onPreview}
      onMove={onMove}
      onAssign={onAssign}
    />
  </TableCell>
);

// Preview handlers moved to FileTableRow.hooks.ts

// Dialog components moved to FileTableRow.dialogs.tsx

// Hook to manage dialog states
const useDialogStates = () => {
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  return {
    moveDialogOpen,
    assignDialogOpen,
    openMoveDialog: () => setMoveDialogOpen(true),
    closeMoveDialog: () => setMoveDialogOpen(false),
    openAssignDialog: () => setAssignDialogOpen(true),
    closeAssignDialog: () => setAssignDialogOpen(false),
  };
};

// Extract file type checks
const getFileTypes = (file: FileData) => ({
  isImage: file.mimetype.startsWith('image/'),
  isCSV: file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv'),
  isPDF: file.mimetype === 'application/pdf'),
});

// Row rendering component
const FileRowContent: React.FC<{
  file: FileData;
  selected?: boolean;
  onSelectFile?: (fileId: string) => void;
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
  onPreview?: () => void;
  onMove?: () => void;
  onAssign?: () => void;
}> = ({ file, selected, onSelectFile, onDownload, onDelete, onPreview, onMove, onAssign }) => (
  <TableRow hover selected={selected}>
    <CheckboxCell fileId={file.id} selected={selected} onSelectFile={onSelectFile} />
    <NameCell file={file} />
    <ProjectCell project={file.project} />
    <FolderCell folder={file.folder} />
    <TypeCell mimetype={file.mimetype} />
    <TableCell>{formatFileSize(file.size)}</TableCell>
    <TableCell>{formatDate(file.created_at)}</TableCell>
    <ActionsCell
      file={file}
      onDownload={onDownload}
      onDelete={onDelete}
      onPreview={onPreview}
      onMove={onMove}
      onAssign={onAssign}
    />
  </TableRow>
);

// Preview dialogs component
const PreviewDialogs: React.FC<{
  file: FileData;
  previewState: ReturnType<typeof usePreviewLogic>;
  getFileContent?: (fileId: string) => Promise<string>;
  getPdfInfo?: FileTableRowProps['getPdfInfo'];
}> = ({ file, previewState, getFileContent, getPdfInfo }) => (
  <>
    <ImagePreviewDialog
      open={previewState.previewOpen}
      onClose={() => previewState.setPreviewOpen(false)}
      imageUrl={previewState.previewUrl}
      fileName={file.original_name}
      loading={previewState.loading}
    />
    <CSVPreviewDialog
      open={previewState.csvPreviewOpen}
      onClose={() => previewState.setCsvPreviewOpen(false)}
      fileName={file.original_name}
      fileId={file.id}
      getFileContent={getFileContent || createDefaultGetFileContent()}
    />
    <PDFPreviewDialog
      open={previewState.pdfPreviewOpen}
      onClose={() => previewState.setPdfPreviewOpen(false)}
      fileId={file.id}
      fileName={file.original_name}
      loading={false}
      getPdfInfo={getPdfInfo}
    />
  </>
);

// Main component - now under 30 lines
export const FileTableRow: React.FC<FileTableRowProps> = (props) => {
  const { file, selected, onSelectFile, onDownload, onDelete } = props;
  const { onMoveToFolder, folders, onMoveToProject, projects } = props;
  const { onPreview, getFileContent, getPdfInfo } = props;
  
  const previewState = usePreviewLogic(file, onPreview);
  const dialogState = useDialogStates();
  const fileTypes = getFileTypes(file);
  
  const handlePreviewClick = createPreviewClickHandler(
    fileTypes.isCSV,
    fileTypes.isImage,
    fileTypes.isPDF,
    previewState.setCsvPreviewOpen,
    previewState.setPdfPreviewOpen,
    previewState.handlePreview
  );
  
  return (
    <>
      <FileRowContent
        file={file}
        selected={selected}
        onSelectFile={onSelectFile}
        onDownload={() => onDownload(file.id)}
        onDelete={() => onDelete(file.id, file.original_name)}
        onPreview={handlePreviewClick}
        onMove={onMoveToFolder && folders ? dialogState.openMoveDialog : undefined}
        onAssign={onMoveToProject && projects ? dialogState.openAssignDialog : undefined}
      />
      <PreviewDialogs file={file} previewState={previewState} getFileContent={getFileContent} getPdfInfo={getPdfInfo} />
      {onMoveToFolder && folders && (
        <FolderMoveDialog
          open={dialogState.moveDialogOpen}
          onClose={dialogState.closeMoveDialog}
          fileName={file.original_name}
          currentFolder={file.folder}
          folders={folders}
          onMove={(id) => onMoveToFolder(file.id, id)}
        />
      )}
      {onMoveToProject && projects && (
        <ProjectMoveDialog
          open={dialogState.assignDialogOpen}
          onClose={dialogState.closeAssignDialog}
          fileName={file.original_name}
          currentProject={file.project}
          projects={projects}
          onMove={(id) => onMoveToProject(file.id, id)}
        />
      )}
    </>
  );
};
