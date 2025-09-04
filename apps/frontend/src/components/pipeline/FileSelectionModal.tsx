import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { pipelineApi, type FileInfo } from '../../services/pipelineApi';

interface FileSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (fileId: string, fileName?: string) => void;
}

const FileList: React.FC<{
  files: FileInfo[];
  onSelect: (fileId: string, fileName: string) => void;
}> = ({ files, onSelect }) => {
  if (!files || files.length === 0) {
    return (
      <Alert severity="info">
        No CSV files found. Upload some CSV files first to import assets.
      </Alert>
    );
  }

  return (
    <List>
      {files.map((file) => (
        <ListItem key={file.id} disablePadding>
          <ListItemButton onClick={() => onSelect(file.id, file.name)}>
            <ListItemText
              primary={file.name}
              secondary={`${(file.size / 1024).toFixed(1)} KB • ${new Date(file.created_at).toLocaleDateString()}`}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

const useFileLoader = (open: boolean): {
  files: FileInfo[];
  loading: boolean;
  error: string | null;
} => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const csvFiles = await pipelineApi.listFiles();
      setFiles(csvFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open]);

  return { files, loading, error };
};

const DialogContentSection: React.FC<{
  loading: boolean;
  error: string | null;
  files: FileInfo[];
  onSelect: (fileId: string, fileName?: string) => void;
}> = ({ loading, error, files, onSelect }) => (
  <DialogContent>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Choose a CSV file from blob storage to import into the asset system
    </Typography>
    
    {loading && (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <CircularProgress />
      </div>
    )}
    
    {error && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )}
    
    {!loading && !error && (
      <FileList files={files || []} onSelect={onSelect} />
    )}
  </DialogContent>
);

export const FileSelectionModal: React.FC<FileSelectionModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const { files, loading, error } = useFileLoader(open);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>Select CSV File to Import</DialogTitle>
      <DialogContentSection 
        loading={loading}
        error={error}
        files={files}
        onSelect={onSelect}
      />
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};