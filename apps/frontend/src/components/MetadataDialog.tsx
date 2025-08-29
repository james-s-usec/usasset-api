import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { JsonDisplay } from './JsonDisplay';
import { useClipboard } from '../hooks/useClipboard';

export interface MetadataDialogProps {
  open: boolean;
  data: unknown;
  title: string;
  onClose: () => void;
}

export const MetadataDialog = ({ open, data, title, onClose }: MetadataDialogProps): React.ReactElement => {
  const { copyJsonToClipboard } = useClipboard();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { maxHeight: '80vh' } }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <JsonDisplay data={data} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => copyJsonToClipboard(data, 'Metadata copied to clipboard!')}>
          Copy JSON
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};