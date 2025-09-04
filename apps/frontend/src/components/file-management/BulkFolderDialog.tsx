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

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface BulkFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedFolderId: string;
  onFolderChange: (id: string) => void;
  folders: Folder[];
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

// Folder selector component
const FolderSelector: React.FC<{
  selectedFolderId: string;
  onFolderChange: (id: string) => void;
  folders: Folder[];
}> = ({ selectedFolderId, onFolderChange, folders }) => (
  <FormControl fullWidth>
    <InputLabel>Folder</InputLabel>
    <Select
      value={selectedFolderId}
      onChange={(e) => onFolderChange(e.target.value)}
      label="Folder"
    >
      <MenuItem value="">
        <em>Remove from folder</em>
      </MenuItem>
      {folders.map((folder) => (
        <MenuItem key={folder.id} value={folder.id}>
          {folder.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Main dialog - now under 30 lines
export const BulkFolderDialog: React.FC<BulkFolderDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedFolderId,
  onFolderChange,
  folders,
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
    <DialogTitle>Move Files to Folder</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Move {selectedCount} file{selectedCount > 1 ? 's' : ''} to folder:
      </Typography>
      {selectedFileNames.length > 0 && (
        <FileList names={selectedFileNames} count={selectedCount} />
      )}
      <FolderSelector 
        selectedFolderId={selectedFolderId}
        onFolderChange={onFolderChange}
        folders={folders}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" disabled={loading}>
        Move to Folder
      </Button>
    </DialogActions>
  </Dialog>
);