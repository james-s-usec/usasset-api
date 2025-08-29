import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';

export interface MetadataDialogProps {
  open: boolean;
  data: unknown;
  title: string;
  onClose: () => void;
}

export const MetadataDialog = ({ open, data, title, onClose }: MetadataDialogProps) => {
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('Metadata copied to clipboard!');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { maxHeight: '80vh' } }}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          backgroundColor: '#f5f5f5', 
          p: 2, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '12px',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify(data, null, 2)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopyToClipboard}>
          Copy JSON
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};