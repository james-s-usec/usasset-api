import React from 'react';
import { Typography, Button, Alert, Box } from '@mui/material';
import { FileSelectionModal } from './FileSelectionModal';

interface PipelinePageContentProps {
  fileModalOpen: boolean;
  selectedFile: string | null;
  onOpenFileModal: () => void;
  onCloseFileModal: () => void;
  onFileSelect: (fileId: string) => void;
  onStartImport: () => void;
}

const PipelineHeader: React.FC = () => (
  <>
    <Typography variant="h4" gutterBottom>
      Data Import Pipeline
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
      Import CSV files from blob storage into the asset management system
    </Typography>
  </>
);

const ActionButtons: React.FC<{
  selectedFile: string | null;
  onOpenFileModal: () => void;
  onStartImport: () => void;
}> = ({ selectedFile, onOpenFileModal, onStartImport }) => (
  <Box sx={{ mb: 3 }}>
    <Button 
      variant="contained" 
      onClick={onOpenFileModal}
      sx={{ mr: 2 }}
    >
      Select File to Import
    </Button>
    
    {selectedFile && (
      <Button 
        variant="outlined" 
        onClick={onStartImport}
      >
        Start Import
      </Button>
    )}
  </Box>
);

export const PipelinePageContent: React.FC<PipelinePageContentProps> = ({
  fileModalOpen,
  selectedFile,
  onOpenFileModal,
  onCloseFileModal,
  onFileSelect,
  onStartImport,
}) => (
  <>
    <PipelineHeader />
    <ActionButtons 
      selectedFile={selectedFile}
      onOpenFileModal={onOpenFileModal}
      onStartImport={onStartImport}
    />
    {selectedFile && (
      <Alert severity="info" sx={{ mb: 3 }}>
        Selected file: {selectedFile} (Ready to import)
      </Alert>
    )}
    <FileSelectionModal 
      open={fileModalOpen}
      onClose={onCloseFileModal}
      onSelect={onFileSelect}
    />
  </>
);