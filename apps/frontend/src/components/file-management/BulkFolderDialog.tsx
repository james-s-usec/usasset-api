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
  <Dialog open={open} onClose={onClose} maxWidth="sm"
fullWidth>
    <DialogTitle>Move Files to Folder</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Move {selectedCount} file{selectedCount > 1 ? 's' : ''} to folder:
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
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" disabled={loading}>
        Move to Folder
      </Button>
    </DialogActions>
  </Dialog>
);