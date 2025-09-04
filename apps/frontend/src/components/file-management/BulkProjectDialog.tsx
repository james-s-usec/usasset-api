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
  <Dialog open={open} onClose={onClose} maxWidth="sm"
fullWidth>
    <DialogTitle>Assign Files to Project</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Assign {selectedCount} file{selectedCount > 1 ? 's' : ''} to a project:
      </Typography>
      {selectedFileNames.length > 0 && (
        <List dense sx={{ mb: 2, bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
          {selectedFileNames.map((name) => (
            <ListItem key={name} disableGutters>
              <ListItemText primary={name} primaryTypographyProps={{ variant: 'caption' }} />
            </ListItem>
          ))}
          {selectedCount > 3 && (
            <ListItem disableGutters>
              <ListItemText 
                primary={`... and ${selectedCount - 3} more`} 
                primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      )}
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
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" disabled={loading}>
        Assign to Project
      </Button>
    </DialogActions>
  </Dialog>
);