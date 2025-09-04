import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';

export interface BulkDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedFileNames: string[];
  selectedCount: number;
  loading: boolean;
}

// Warning alert component
const DeleteWarning: React.FC = () => (
  <Alert severity="warning" sx={{ mb: 2 }}>
    This action cannot be undone. These files will be permanently deleted.
  </Alert>
);

// File list component
const FileList: React.FC<{ names: string[]; count: number }> = ({ names, count }) => (
  <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
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

// Delete button component
const DeleteButton: React.FC<{ onClick: () => void; count: number; loading: boolean }> = ({ 
  onClick, 
  count, 
  loading 
}) => (
  <Button 
    onClick={onClick} 
    variant="contained" 
    color="error"
    disabled={loading}
  >
    Delete {count} File{count > 1 ? 's' : ''}
  </Button>
);

// Main dialog - now under 30 lines
export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
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
    <DialogTitle>Delete Files</DialogTitle>
    <DialogContent>
      <DeleteWarning />
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Delete {selectedCount} file{selectedCount > 1 ? 's' : ''}:
      </Typography>
      {selectedFileNames.length > 0 && (
        <FileList names={selectedFileNames} count={selectedCount} />
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <DeleteButton onClick={onConfirm} count={selectedCount} loading={loading} />
    </DialogActions>
  </Dialog>
);