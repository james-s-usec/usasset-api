// Dialog components for FileTableRow
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';

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

interface FolderMoveDialogProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  currentFolder?: { id: string; name: string };
  folders: Folder[];
  onMove: (folderId: string | null) => Promise<void>;
}

export const FolderMoveDialog: React.FC<FolderMoveDialogProps> = ({ 
  open, 
  onClose, 
  fileName, 
  currentFolder, 
  folders, 
  onMove 
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
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
          Move &quot;{fileName}&quot; to a different folder
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

interface ProjectMoveDialogProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  currentProject?: { id: string; name: string };
  projects: Project[];
  onMove: (projectId: string | null) => Promise<void>;
}

export const ProjectMoveDialog: React.FC<ProjectMoveDialogProps> = ({ 
  open, 
  onClose, 
  fileName, 
  currentProject, 
  projects, 
  onMove 
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
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
          Assign &quot;{fileName}&quot; to a project
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