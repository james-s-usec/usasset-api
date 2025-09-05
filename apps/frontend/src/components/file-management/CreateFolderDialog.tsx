import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateFolder: (folderData: { name: string; description?: string; color?: string }) => Promise<void>;
  loading?: boolean;
}

const FOLDER_COLORS = [
  { name: 'Blue', value: '#2196F3' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Red', value: '#F44336' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Teal', value: '#009688' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Gray', value: '#607D8B' },
];

// Helper component for color selection menu item
const ColorMenuItem: React.FC<{ colorOption: { name: string; value: string } }> = ({ colorOption }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        backgroundColor: colorOption.value,
        border: '1px solid',
        borderColor: 'divider',
      }}
    />
    <Typography>{colorOption.name}</Typography>
  </Box>
);

// Helper component for folder preview
const FolderPreview: React.FC<{ folderName: string; color: string }> = ({ folderName, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography variant="body2" color="text.secondary">Preview:</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: 'grey.50' }}>
      <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: color, border: '1px solid', borderColor: 'divider' }} />
      <Typography variant="body2">{folderName.trim() || 'New Folder'}</Typography>
    </Box>
  </Box>
);

// Form validation logic
const validateFolderForm = (folderName: string): { name?: string } => {
  const errors: { name?: string } = {};
  
  if (!folderName.trim()) {
    errors.name = 'Folder name is required';
  } else if (folderName.length > 50) {
    errors.name = 'Folder name must be 50 characters or less';
  }
  
  return errors;
};

// Form reset logic
const resetForm = (
  setFolderName: (name: string) => void,
  setDescription: (desc: string) => void,
  setColor: (color: string) => void,
  setErrors: (errors: Record<string, string>) => void
): void => {
  setFolderName('');
  setDescription('');
  setColor('#2196F3');
  setErrors({});
};

// Submit handler helper
const handleFolderSubmit = async (
  formData: { folderName: string; description: string; color: string },
  callbacks: { onCreateFolder: CreateFolderDialogProps['onCreateFolder']; setErrors: (errors: { name?: string }) => void; onSuccess: () => void }
): Promise<void> => {
  const newErrors = validateFolderForm(formData.folderName);
  callbacks.setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) return;

  try {
    await callbacks.onCreateFolder({
      name: formData.folderName.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    });
    callbacks.onSuccess();
  } catch (error) {
    console.error('Failed to create folder:', error);
  }
};

// Name field component
const NameField: React.FC<{
  folderName: string;
  setFolderName: (name: string) => void;
  errors: { name?: string };
  loading: boolean;
  onKeyPress: (event: React.KeyboardEvent) => void;
}> = ({ folderName, setFolderName, errors, loading, onKeyPress }) => (
  <TextField
    label="Folder Name"
    value={folderName}
    onChange={(e) => setFolderName(e.target.value)}
    onKeyPress={onKeyPress}
    error={Boolean(errors.name)}
    helperText={errors.name}
    fullWidth
    required
    disabled={loading}
    inputProps={{ maxLength: 50 }}
    placeholder="Enter folder name..."
  />
);

// Color selector component
const ColorSelector: React.FC<{
  color: string;
  setColor: (color: string) => void;
  loading: boolean;
}> = ({ color, setColor, loading }) => (
  <FormControl fullWidth disabled={loading}>
    <InputLabel>Color</InputLabel>
    <Select value={color} label="Color" onChange={(e) => setColor(e.target.value)}>
      {FOLDER_COLORS.map((colorOption) => (
        <MenuItem key={colorOption.value} value={colorOption.value}>
          <ColorMenuItem colorOption={colorOption} />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Dialog content component
const DialogFormContent: React.FC<{
  folderName: string;
  setFolderName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  color: string;
  setColor: (color: string) => void;
  errors: { name?: string };
  loading: boolean;
  onKeyPress: (event: React.KeyboardEvent) => void;
}> = ({ folderName, setFolderName, description, setDescription, color, setColor, errors, loading, onKeyPress }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
    <NameField folderName={folderName} setFolderName={setFolderName} errors={errors}
loading={loading} onKeyPress={onKeyPress} />
    <TextField
      label="Description (Optional)"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      onKeyPress={onKeyPress}
      fullWidth
      multiline
      rows={2}
      disabled={loading}
      inputProps={{ maxLength: 200 }}
      placeholder="Enter folder description..."
    />
    <ColorSelector color={color} setColor={setColor} loading={loading} />
    <FolderPreview folderName={folderName} color={color} />
  </Box>
);

// Folder form hook
const useFolderFormState = (onCreateFolder: CreateFolderDialogProps['onCreateFolder'], onClose: () => void): {
  folderName: string; setFolderName: (name: string) => void;
  description: string; setDescription: (desc: string) => void;
  color: string; setColor: (color: string) => void;
  errors: { name?: string };
  handleSubmit: () => Promise<void>;
  handleReset: () => void;
} => {
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2196F3');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = async (): Promise<void> => {
    await handleFolderSubmit(
      { folderName, description, color },
      { onCreateFolder, setErrors, onSuccess: () => { resetForm(setFolderName, setDescription, setColor, setErrors); onClose(); } }
    );
  };

  const handleReset = (): void => resetForm(setFolderName, setDescription, setColor, setErrors);

  return {
    folderName, setFolderName, description, setDescription, color, setColor, errors,
    handleSubmit, handleReset
  };
};

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ open, onClose, onCreateFolder, loading = false }) => {
  const { folderName, setFolderName, description, setDescription, color, setColor, errors, handleSubmit, handleReset } = useFolderFormState(onCreateFolder, onClose);

  const handleClose = (): void => { if (!loading) { handleReset(); onClose(); } };
  const handleKeyPress = (event: React.KeyboardEvent): void => { if (event.key === 'Enter' && !loading) { event.preventDefault(); void handleSubmit(); } };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm"
fullWidth disableEscapeKeyDown={loading}>
      <DialogTitle><Typography variant="h6">Create New Folder</Typography></DialogTitle>
      <DialogContent>
        <DialogFormContent
          folderName={folderName} setFolderName={setFolderName}
          description={description} setDescription={setDescription}
          color={color} setColor={setColor}
          errors={errors} loading={loading} onKeyPress={handleKeyPress}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={loading || !folderName.trim()}>
          {loading ? 'Creating...' : 'Create Folder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};