import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';

interface FileUploadSectionProps {
  uploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  uploading,
  onFileUpload,
}) => (
  <Box sx={{ mb: 3 }}>
    <input
      accept=".csv,.xlsx,.xls,*"
      style={{ display: 'none' }}
      id="file-upload"
      type="file"
      onChange={onFileUpload}
      disabled={uploading}
    />
    <label htmlFor="file-upload">
      <Button
        variant="contained"
        component="span"
        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </label>
  </Box>
);