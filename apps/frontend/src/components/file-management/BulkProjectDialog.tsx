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

export interface BulkProjectDialogProps {
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
// Dialog content component
const BulkProjectDialogContent: React.FC<{
  selectedCount: number;
  selectedFileNames: string[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
}> = ({ selectedCount, selectedFileNames, selectedProjectId, onProjectChange, projects }) => (
  <>
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
  </>
);

const DialogWrapper: React.FC<BulkProjectDialogProps> = (props) => (
  <Dialog 
    open={props.open} 
    onClose={props.onClose} 
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle>Assign Files to Project</DialogTitle>
    <DialogContent>
      <BulkProjectDialogContent
        selectedCount={props.selectedCount}
        selectedFileNames={props.selectedFileNames}
        selectedProjectId={props.selectedProjectId}
        onProjectChange={props.onProjectChange}
        projects={props.projects}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={props.onClose}>Cancel</Button>
      <Button onClick={props.onConfirm} variant="contained" disabled={props.loading}>
        Assign to Project
      </Button>
    </DialogActions>
  </Dialog>
);

export const BulkProjectDialog: React.FC<BulkProjectDialogProps> = (props) => (
  <DialogWrapper {...props} />
);