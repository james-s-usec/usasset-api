import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ImagePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
  loading: boolean;
}

const DialogHeader: React.FC<{ fileName: string; onClose: () => void }> = ({ fileName, onClose }) => (
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="h6">{fileName}</Typography>
    <IconButton onClick={onClose}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
);

const ImageContent: React.FC<{ loading: boolean; imageUrl: string; fileName: string }> = ({ loading, imageUrl, fileName }) => (
  <Box sx={{ textAlign: 'center', py: 2 }}>
    {loading ? (
      <Typography>Loading preview...</Typography>
    ) : imageUrl ? (
      <img
        src={imageUrl}
        alt={fileName}
        style={{
          maxWidth: '100%',
          maxHeight: '70vh',
          objectFit: 'contain',
        }}
      />
    ) : (
      <Typography>Failed to load preview</Typography>
    )}
  </Box>
);

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  open,
  onClose,
  imageUrl,
  fileName,
  loading,
}) => (
  <Dialog 
    open={open} 
    onClose={onClose} 
    maxWidth="lg" 
    fullWidth
  >
    <DialogHeader fileName={fileName} onClose={onClose} />
    <DialogContent>
      <ImageContent loading={loading} imageUrl={imageUrl} fileName={fileName} />
    </DialogContent>
  </Dialog>
);