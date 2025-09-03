import React, { useState } from 'react';
import {
  TableCell,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  DriveFileMove as MoveIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import type { FileData } from './types';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { CSVPreviewDialog } from './CSVPreviewDialog';
import { PDFPreviewDialog } from './PDFPreviewDialog';

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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

const getMimeTypeColor = (mimetype: string): 'primary' | 'secondary' | 'success' | 'warning' => {
  if (mimetype.includes('csv')) return 'success';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'primary';
  if (mimetype.includes('image')) return 'secondary';
  if (mimetype === 'application/pdf') return 'primary';
  return 'warning';
};

const getFileTypeLabel = (mimetype: string): string => {
  // Common document types
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('wordprocessingml.document')) return 'DOCX';
  if (mimetype.includes('presentationml.presentation')) return 'PPTX';
  if (mimetype.includes('spreadsheetml.sheet')) return 'XLSX';
  if (mimetype === 'application/msword') return 'DOC';
  if (mimetype === 'application/vnd.ms-excel') return 'XLS';
  if (mimetype === 'application/vnd.ms-powerpoint') return 'PPT';
  
  // Text and data formats
  if (mimetype.includes('csv')) return 'CSV';
  if (mimetype.includes('json')) return 'JSON';
  if (mimetype.includes('xml')) return 'XML';
  if (mimetype.includes('text/plain')) return 'TXT';
  if (mimetype.includes('text/html')) return 'HTML';
  
  // Images
  if (mimetype.startsWith('image/jpeg')) return 'JPEG';
  if (mimetype.startsWith('image/png')) return 'PNG';
  if (mimetype.startsWith('image/gif')) return 'GIF';
  if (mimetype.startsWith('image/webp')) return 'WEBP';
  if (mimetype.startsWith('image/')) return 'Image';
  
  // Video/Audio
  if (mimetype.startsWith('video/')) return 'Video';
  if (mimetype.startsWith('audio/')) return 'Audio';
  
  // Archives
  if (mimetype.includes('zip')) return 'ZIP';
  if (mimetype.includes('rar')) return 'RAR';
  if (mimetype.includes('7z')) return '7Z';
  
  // Fallback to file extension if available
  const parts = mimetype.split('/');
  if (parts.length === 2) {
    const subtype = parts[1].toUpperCase();
    if (subtype.length <= 5) return subtype;
  }
  
  return 'File';
};

const PreviewButton: React.FC<{ onPreview: () => void }> = ({ onPreview }) => (
  <IconButton
    onClick={onPreview}
    color="secondary"
    size="small"
    title="Preview"
  >
    <PreviewIcon />
  </IconButton>
);

const DownloadButton: React.FC<{ onDownload: () => Promise<void> }> = ({ onDownload }) => (
  <IconButton
    onClick={onDownload}
    color="primary"
    size="small"
    title="Download"
  >
    <DownloadIcon />
  </IconButton>
);

const DeleteButton: React.FC<{ onDelete: () => Promise<void> }> = ({ onDelete }) => (
  <IconButton
    onClick={onDelete}
    color="error"
    size="small"
    title="Delete"
  >
    <DeleteIcon />
  </IconButton>
);

const MoveButton: React.FC<{ onMove: () => void }> = ({ onMove }) => (
  <IconButton
    onClick={onMove}
    color="primary"
    size="small"
    title="Move to Folder"
  >
    <MoveIcon />
  </IconButton>
);

const AssignButton: React.FC<{ onAssign: () => void }> = ({ onAssign }) => (
  <IconButton
    onClick={onAssign}
    color="secondary"
    size="small"
    title="Assign to Project"
  >
    <AssignIcon />
  </IconButton>
);

const FileActions: React.FC<{
  file: FileData;
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
  onPreview?: () => void;
  onMove?: () => void;
  onAssign?: () => void;
}> = ({ file, onDownload, onDelete, onPreview, onMove, onAssign }) => {
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  const isPDF = file.mimetype === 'application/pdf';
  
  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'nowrap' }}>
      {(isImage || isCSV || isPDF) && onPreview && <PreviewButton onPreview={onPreview} />}
      <DownloadButton onDownload={onDownload} />
      {onMove && <MoveButton onMove={onMove} />}
      {onAssign && <AssignButton onAssign={onAssign} />}
      <DeleteButton onDelete={onDelete} />
    </Box>
  );
};

const createPreviewHandler = (
  file: FileData,
  onPreview: (fileId: string) => Promise<string>,
  setters: {
    setLoading: (loading: boolean) => void;
    setPreviewUrl: (url: string) => void;
    setPreviewOpen: (open: boolean) => void;
  }
): (() => Promise<void>) => async (): Promise<void> => {
  setters.setLoading(true);
  try {
    const url = await onPreview(file.id);
    setters.setPreviewUrl(url);
    setters.setPreviewOpen(true);
  } catch (error) {
    console.error('Failed to get preview URL:', error);
  } finally {
    setters.setLoading(false);
  }
};

const usePreviewLogic = (file: FileData, onPreview?: (fileId: string) => Promise<string>): {
  previewOpen: boolean;
  previewUrl: string;
  loading: boolean;
  handlePreview: () => Promise<void>;
  setPreviewOpen: (open: boolean) => void;
  csvPreviewOpen: boolean;
  setCsvPreviewOpen: (open: boolean) => void;
  pdfPreviewOpen: boolean;
  setPdfPreviewOpen: (open: boolean) => void;
} => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const handlePreview = onPreview 
    ? createPreviewHandler(file, onPreview, { setLoading, setPreviewUrl, setPreviewOpen })
    : async (): Promise<void> => {};

  return {
    previewOpen,
    previewUrl,
    loading,
    handlePreview,
    setPreviewOpen,
    csvPreviewOpen,
    setCsvPreviewOpen,
    pdfPreviewOpen,
    setPdfPreviewOpen,
  };
};

const FileRowContent: React.FC<{ 
  file: FileData;
  selected?: boolean;
  onSelectFile?: (fileId: string) => void;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: () => void;
  onMove?: () => void;
  onAssign?: () => void;
}> = ({ file, selected, onSelectFile, onDownload, onDelete, onPreview, onMove, onAssign }) => (
  <TableRow hover selected={selected}>
    <TableCell padding="checkbox">
      {onSelectFile && (
        <Checkbox
          checked={selected || false}
          onChange={() => onSelectFile(file.id)}
          inputProps={{ 'aria-labelledby': `file-name-${file.id}` }}
        />
      )}
    </TableCell>
    <TableCell>
      <Typography variant="body2" fontWeight="medium" id={`file-name-${file.id}`}>
        {file.original_name}
      </Typography>
    </TableCell>
    <TableCell>
      {file.project ? (
        <Typography variant="body2" fontSize="0.875rem" color="primary.main">
          {file.project.name}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
          No Project
        </Typography>
      )}
    </TableCell>
    <TableCell>
      {file.folder ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: 1, 
              bgcolor: file.folder.color || '#gray',
            }} 
          />
          <Typography variant="body2" fontSize="0.875rem">
            {file.folder.name}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
          Unorganized
        </Typography>
      )}
    </TableCell>
    <TableCell>
      <Chip
        label={getFileTypeLabel(file.mimetype)}
        size="small"
        color={getMimeTypeColor(file.mimetype)}
        title={file.mimetype} // Show full MIME type on hover
      />
    </TableCell>
    <TableCell>{formatFileSize(file.size)}</TableCell>
    <TableCell>{formatDate(file.created_at)}</TableCell>
    <TableCell align="center" sx={{ width: '15%', minWidth: 180 }}>
      <FileActions
        file={file}
        onDownload={() => onDownload(file.id)}
        onDelete={() => onDelete(file.id, file.original_name)}
        onPreview={onPreview}
        onMove={onMove}
        onAssign={onAssign}
      />
    </TableCell>
  </TableRow>
);

const createPreviewClickHandler = (
  isCSV: boolean,
  isImage: boolean,
  isPDF: boolean,
  setCsvPreviewOpen: (open: boolean) => void,
  setPdfPreviewOpen: (open: boolean) => void,
  handlePreview: () => Promise<void>
): (() => Promise<void>) => async (): Promise<void> => {
  if (isCSV) {
    setCsvPreviewOpen(true);
  } else if (isPDF) {
    setPdfPreviewOpen(true);
  } else if (isImage) {
    await handlePreview();
  }
};

const createDefaultGetFileContent = (): ((fileId: string) => Promise<string>) => 
  (): Promise<string> => Promise.reject(new Error('getFileContent not provided'));

const FolderMoveDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  fileName: string;
  currentFolder?: { id: string; name: string };
  folders: Folder[];
  onMove: (folderId: string | null) => Promise<void>;
}> = ({ open, onClose, fileName, currentFolder, folders, onMove }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [moving, setMoving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedFolderId(currentFolder?.id || '');
    }
  }, [open, currentFolder?.id]);

  const handleMove = async (): Promise<void> => {
    setMoving(true);
    try {
      await onMove(selectedFolderId || null);
      onClose();
    } catch (error) {
      console.error('Failed to move file:', error);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move File</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Move "{fileName}" to a different folder
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="folder-move-select-label">Folder</InputLabel>
          <Select
            labelId="folder-move-select-label"
            value={selectedFolderId}
            label="Folder"
            onChange={(e): void => setSelectedFolderId(e.target.value)}
            disabled={moving}
          >
            <MenuItem value="">
              <em>Unorganized</em>
            </MenuItem>
            {folders.map((folder) => (
              <MenuItem key={folder.id} value={folder.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: 1, 
                      bgcolor: folder.color || '#gray',
                    }} 
                  />
                  {folder.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={moving}>
          Cancel
        </Button>
        <Button 
          onClick={handleMove} 
          variant="contained" 
          disabled={moving}
        >
          {moving ? 'Moving...' : 'Move'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProjectMoveDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  fileName: string;
  currentProject?: { id: string; name: string };
  projects: Project[];
  onMove: (projectId: string | null) => Promise<void>;
}> = ({ open, onClose, fileName, currentProject, projects, onMove }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [moving, setMoving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedProjectId(currentProject?.id || '');
    }
  }, [open, currentProject?.id]);

  const handleMove = async (): Promise<void> => {
    setMoving(true);
    try {
      await onMove(selectedProjectId || null);
      onClose();
    } catch (error) {
      console.error('Failed to assign file to project:', error);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign to Project</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Assign "{fileName}" to a project
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="project-move-select-label">Project</InputLabel>
          <Select
            labelId="project-move-select-label"
            value={selectedProjectId}
            label="Project"
            onChange={(e): void => setSelectedProjectId(e.target.value)}
            disabled={moving}
          >
            <MenuItem value="">
              <em>No Project</em>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {project.name}
                  </Typography>
                  {project.description && (
                    <Typography variant="caption" color="text.secondary">
                      {project.description}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={moving}>
          Cancel
        </Button>
        <Button 
          onClick={handleMove} 
          variant="contained" 
          disabled={moving}
        >
          {moving ? 'Assigning...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const FileTableRow: React.FC<FileTableRowProps> = ({ file, selected, onSelectFile, onDownload, onDelete, onMoveToFolder, folders, onMoveToProject, projects, onPreview, getFileContent, getPdfInfo }) => {
  const { previewOpen, previewUrl, loading, handlePreview, setPreviewOpen, csvPreviewOpen, setCsvPreviewOpen, pdfPreviewOpen, setPdfPreviewOpen } = usePreviewLogic(file, onPreview);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  const isImage = file.mimetype.startsWith('image/');
  const isCSV = file.mimetype.includes('csv') || file.original_name.toLowerCase().endsWith('.csv');
  const isPDF = file.mimetype === 'application/pdf';
  
  const handlePreviewClick = createPreviewClickHandler(isCSV, isImage, isPDF, setCsvPreviewOpen, setPdfPreviewOpen, handlePreview);

  const handleMoveClick = (): void => {
    setMoveDialogOpen(true);
  };

  const handleAssignClick = (): void => {
    setAssignDialogOpen(true);
  };

  const handleMoveToFolder = async (folderId: string | null): Promise<void> => {
    if (onMoveToFolder) {
      await onMoveToFolder(file.id, folderId);
    }
  };

  const handleMoveToProject = async (projectId: string | null): Promise<void> => {
    if (onMoveToProject) {
      await onMoveToProject(file.id, projectId);
    }
  };

  return (
    <>
      <FileRowContent
        file={file}
        selected={selected}
        onSelectFile={onSelectFile}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={handlePreviewClick}
        onMove={onMoveToFolder && folders ? handleMoveClick : undefined}
        onAssign={onMoveToProject && projects ? handleAssignClick : undefined}
      />
      
      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewUrl}
        fileName={file.original_name}
        loading={loading}
      />
      
      <CSVPreviewDialog
        open={csvPreviewOpen}
        onClose={() => setCsvPreviewOpen(false)}
        fileName={file.original_name}
        fileId={file.id}
        getFileContent={getFileContent || createDefaultGetFileContent()}
      />
      
      <PDFPreviewDialog
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        fileId={file.id}
        fileName={file.original_name}
        loading={false}
        getPdfInfo={getPdfInfo}
      />
      
      {onMoveToFolder && folders && (
        <FolderMoveDialog
          open={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
          fileName={file.original_name}
          currentFolder={file.folder}
          folders={folders}
          onMove={handleMoveToFolder}
        />
      )}
      
      {onMoveToProject && projects && (
        <ProjectMoveDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          fileName={file.original_name}
          currentProject={file.project}
          projects={projects}
          onMove={handleMoveToProject}
        />
      )}
    </>
  );
};
