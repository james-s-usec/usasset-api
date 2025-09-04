import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as AssignIcon,
  DriveFileMove as MoveIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import type { FileData } from './types';

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

interface BulkActionsToolbarProps {
  selectedFiles: Set<string>;
  allFiles: FileData[];
  folders: Folder[];
  projects: Project[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
  onBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  onBulkDelete: (fileIds: string[]) => Promise<void>;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedFiles,
  allFiles,
  folders,
  projects,
  onClearSelection,
  onSelectAll,
  onBulkAssignProject,
  onBulkMoveToFolder,
  onBulkDelete,
}) => {
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const selectedCount = selectedFiles.size;
  const allSelected = selectedCount === allFiles.length && allFiles.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < allFiles.length;

  const getSelectedFileNames = (): string[] => {
    return allFiles
      .filter(file => selectedFiles.has(file.id))
      .map(file => file.original_name)
      .slice(0, 3); // Show first 3 names
  };

  const handleBulkAssignProject = async () => {
    if (selectedCount === 0) return;
    setLoading(true);
    try {
      await onBulkAssignProject(Array.from(selectedFiles), selectedProjectId || null);
      setProjectDialogOpen(false);
      setSelectedProjectId('');
      onClearSelection();
    } catch (error) {
      console.error('Bulk assign project failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMoveToFolder = async () => {
    if (selectedCount === 0) return;
    setLoading(true);
    try {
      await onBulkMoveToFolder(Array.from(selectedFiles), selectedFolderId || null);
      setFolderDialogOpen(false);
      setSelectedFolderId('');
      onClearSelection();
    } catch (error) {
      console.error('Bulk move to folder failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    setLoading(true);
    try {
      await onBulkDelete(Array.from(selectedFiles));
      setDeleteDialogOpen(false);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  const selectedFileNames = getSelectedFileNames();
  const remainingCount = selectedCount - selectedFileNames.length;

  return (
    <>
      <Collapse in={selectedCount > 0}>
        <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', mb: 2, borderRadius: 1 }}>
          <Toolbar sx={{ minHeight: '48px !important' }}>
            {/* Selection Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <IconButton
                size="small"
                onClick={allSelected ? onClearSelection : onSelectAll}
                sx={{ color: 'inherit' }}
                title={allSelected ? 'Deselect All' : 'Select All'}
              >
                {allSelected ? <CheckBoxIcon /> : someSelected ? <CheckBoxOutlineBlankIcon /> : <SelectAllIcon />}
              </IconButton>
              
              <Typography variant="body2" fontWeight="medium">
                {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
              </Typography>
              
              {selectedFileNames.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {selectedFileNames.map((name) => (
                    <Chip
                      key={name}
                      label={name}
                      size="small"
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'inherit'
                      }}
                    />
                  ))}
                  {remainingCount > 0 && (
                    <Chip
                      label={`+${remainingCount} more`}
                      size="small"
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'inherit'
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>

            {/* Bulk Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<AssignIcon />}
                onClick={() => setProjectDialogOpen(true)}
                sx={{ color: 'inherit', borderColor: 'currentColor' }}
                variant="outlined"
              >
                Assign Project
              </Button>
              
              <Button
                size="small"
                startIcon={<MoveIcon />}
                onClick={() => setFolderDialogOpen(true)}
                sx={{ color: 'inherit', borderColor: 'currentColor' }}
                variant="outlined"
              >
                Move to Folder
              </Button>
              
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ color: 'inherit', borderColor: 'currentColor' }}
                variant="outlined"
                color="error"
              >
                Delete
              </Button>
              
              <IconButton
                size="small"
                onClick={onClearSelection}
                sx={{ color: 'inherit' }}
                title="Clear Selection"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Box>
      </Collapse>

      {/* Project Assignment Dialog */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="sm"
fullWidth>
        <DialogTitle>Assign {selectedCount} Files to Project</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedProjectId}
              label="Project"
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>No Project (Remove Assignment)</em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  <Box>
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
          <Button onClick={() => setProjectDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkAssignProject} variant="contained" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Folder Move Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} maxWidth="sm"
fullWidth>
        <DialogTitle>Move {selectedCount} Files to Folder</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Folder</InputLabel>
            <Select
              value={selectedFolderId}
              label="Folder"
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Unorganized (Remove from Folder)</em>
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
          <Button onClick={() => setFolderDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkMoveToFolder} variant="contained" disabled={loading}>
            {loading ? 'Moving...' : 'Move'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm"
fullWidth>
        <DialogTitle>Delete {selectedCount} Files</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete these {selectedCount} files? This action cannot be undone.
          </Typography>
          {selectedFileNames.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Files to be deleted:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedFileNames.map((name) => (
                  <Chip key={name} label={name} size="small"
variant="outlined" />
                ))}
                {remainingCount > 0 && (
                  <Chip label={`+${remainingCount} more files`} size="small" variant="outlined" />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkDelete} variant="contained" color="error"
disabled={loading}>
            {loading ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};