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

interface BulkDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedFileNames: string[];
  selectedCount: number;
  loading: boolean;
}

export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedFileNames,
  selectedCount,
  loading,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm"
fullWidth>
    <DialogTitle>Delete Files</DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mb: 2 }}>
        This action cannot be undone. These files will be permanently deleted.
      </Alert>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Delete {selectedCount} file{selectedCount > 1 ? 's' : ''}:
      </Typography>
      {selectedFileNames.length > 0 && (
        <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
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
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button 
        onClick={onConfirm} 
        variant="contained" 
        color="error"
        disabled={loading}
      >
        Delete {selectedCount} File{selectedCount > 1 ? 's' : ''}
      </Button>
    </DialogActions>
  </Dialog>
);