import React from 'react';
import { Card, CardContent, Typography, Button, Alert } from '@mui/material';

interface FileSelectorProps {
  selectedFileName: string | null;
  onSelectFile: () => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  selectedFileName,
  onSelectFile,
}) => (
  <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Select Source File
      </Typography>
      {!selectedFileName ? (
        <Button variant="contained" onClick={onSelectFile}>
          Select CSV File from Blob Storage
        </Button>
      ) : (
        <Alert severity="success">
          Selected: {selectedFileName}
        </Alert>
      )}
    </CardContent>
  </Card>
);