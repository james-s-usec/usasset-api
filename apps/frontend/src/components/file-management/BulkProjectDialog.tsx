import React from 'react';
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

interface Project {
  id: string;
  name: string;
}

interface BulkProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
  projects: Project[];
  selectedFileNames: string[];
  selectedCount: number;
  loading: boolean;
}

// File list component
const FileList: React.FC<{ names: string[]; count: number }> = ({ names, count }) => (
  <List dense sx={{ mb: 2, bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
    {names.map((name) => (
      <ListItem key={name} disableGutters>
        <ListItemText primary={name} primaryTypographyProps={{ variant: 'caption' }} />
      </ListItem>
    ))}
    {count > 3 && (
      <ListItem disableGutters>
        <ListItemText 
          primary={`... and ${count - 3} more`} 
          primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
        />
      </ListItem>
    )}
  </List>
);

// Project selector component
const ProjectSelector: React.FC<{
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
  projects: Project[];
}> = ({ selectedProjectId, onProjectChange, projects }) => (
  <FormControl fullWidth>
    <InputLabel>Project</InputLabel>
    <Select
      value={selectedProjectId}
      onChange={(e) => onProjectChange(e.target.value)}
      label="Project"
    >
      <MenuItem value="">
        <em>Remove from project</em>
      </MenuItem>
      {projects.map((project) => (
        <MenuItem key={project.id} value={project.id}>
          {project.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Main dialog - now under 30 lines
export const BulkProjectDialog: React.FC<BulkProjectDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedProjectId,
  onProjectChange,
  projects,
  selectedFileNames,
  selectedCount,
  loading,
}) => (
  <Dialog 
    open={open} 
    onClose={onClose} 
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle>Assign Files to Project</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Assign {selectedCount} file{selectedCount > 1 ? 's' : ''} to a project:
      </Typography>
      {selectedFileNames.length > 0 && (
        <FileList names={selectedFileNames} count={selectedCount} />
      )}
      <ProjectSelector 
        selectedProjectId={selectedProjectId}
        onProjectChange={onProjectChange}
        projects={projects}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" disabled={loading}>
        Assign to Project
      </Button>
    </DialogActions>
  </Dialog>
);