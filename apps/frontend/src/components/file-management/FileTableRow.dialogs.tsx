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

// Folder color box component
const FolderColorBox: React.FC<{ color: string }> = ({ color }) => (
  <Box 
    sx={{ 
      width: 12, 
      height: 12, 
      borderRadius: 1, 
      bgcolor: color || '#gray',
    }} 
  />
);

// Removed unused DialogHeader component - functionality inlined in dialogs

// Dialog footer component
const DialogFooter: React.FC<{
  onClose: () => void;
  onAction: () => void;
  actionLabel: string;
  loading: boolean;
}> = ({ onClose, onAction, actionLabel, loading }) => (
  <DialogActions>
    <Button onClick={onClose} disabled={loading}>
      Cancel
    </Button>
    <Button 
      onClick={onAction} 
      variant="contained" 
      disabled={loading}
    >
      {loading ? `${actionLabel}...` : actionLabel}
    </Button>
  </DialogActions>
);

// Folder select component
const FolderSelect: React.FC<{
  selectedFolderId: string;
  folders: Folder[];
  onChange: (value: string) => void;
  disabled: boolean;
}> = ({ selectedFolderId, folders, onChange, disabled }) => (
  <FormControl fullWidth sx={{ mt: 2 }}>
    <InputLabel id="folder-move-select-label">Folder</InputLabel>
    <Select
      labelId="folder-move-select-label"
      value={selectedFolderId}
      label="Folder"
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <MenuItem value="">
        <em>Unorganized</em>
      </MenuItem>
      {folders.map((folder) => (
        <MenuItem key={folder.id} value={folder.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderColorBox color={folder.color} />
            {folder.name}
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Project select component
const ProjectSelect: React.FC<{
  selectedProjectId: string;
  projects: Project[];
  onChange: (value: string) => void;
  disabled: boolean;
}> = ({ selectedProjectId, projects, onChange, disabled }) => (
  <FormControl fullWidth sx={{ mt: 2 }}>
    <InputLabel id="project-move-select-label">Project</InputLabel>
    <Select
      labelId="project-move-select-label"
      value={selectedProjectId}
      label="Project"
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
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
);

interface FolderMoveDialogProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  currentFolder?: { id: string; name: string };
  folders: Folder[];
  onMove: (folderId: string | null) => Promise<void>;
}

const useFolderMove = (
  open: boolean,
  currentFolder?: { id: string; name: string }
): {
  selectedFolderId: string;
  setSelectedFolderId: (id: string) => void;
  moving: boolean;
  handleMove: (onMove: (id: string | null) => Promise<void>, onClose: () => void) => Promise<void>;
} => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedFolderId(currentFolder?.id || '');
    }
  }, [open, currentFolder?.id]);

  const handleMove = async (
    onMove: (id: string | null) => Promise<void>,
    onClose: () => void
  ): Promise<void> => {
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

  return { selectedFolderId, setSelectedFolderId, moving, handleMove };
};

export const FolderMoveDialog: React.FC<FolderMoveDialogProps> = ({ 
  open, 
  onClose, 
  fileName, 
  currentFolder, 
  folders, 
  onMove 
}) => {
  const { selectedFolderId, setSelectedFolderId, moving, handleMove } = useFolderMove(open, currentFolder);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move File</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Move &quot;{fileName}&quot; to a different folder
        </Typography>
        <FolderSelect
          selectedFolderId={selectedFolderId}
          folders={folders}
          onChange={setSelectedFolderId}
          disabled={moving}
        />
      </DialogContent>
      <DialogFooter
        onClose={onClose}
        onAction={() => handleMove(onMove, onClose)}
        actionLabel={moving ? 'Moving' : 'Move'}
        loading={moving}
      />
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

const useProjectMove = (
  open: boolean,
  currentProject?: { id: string; name: string }
): {
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  moving: boolean;
  handleMove: (onMove: (id: string | null) => Promise<void>, onClose: () => void) => Promise<void>;
} => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedProjectId(currentProject?.id || '');
    }
  }, [open, currentProject?.id]);

  const handleMove = async (
    onMove: (id: string | null) => Promise<void>,
    onClose: () => void
  ): Promise<void> => {
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

  return { selectedProjectId, setSelectedProjectId, moving, handleMove };
};

export const ProjectMoveDialog: React.FC<ProjectMoveDialogProps> = ({ 
  open, 
  onClose, 
  fileName, 
  currentProject, 
  projects, 
  onMove 
}) => {
  const { selectedProjectId, setSelectedProjectId, moving, handleMove } = useProjectMove(open, currentProject);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign to Project</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Assign &quot;{fileName}&quot; to a project
        </Typography>
        <ProjectSelect
          selectedProjectId={selectedProjectId}
          projects={projects}
          onChange={setSelectedProjectId}
          disabled={moving}
        />
      </DialogContent>
      <DialogFooter
        onClose={onClose}
        onAction={() => handleMove(onMove, onClose)}
        actionLabel={moving ? 'Assigning' : 'Assign'}
        loading={moving}
      />
    </Dialog>
  );
};