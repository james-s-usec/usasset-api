import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import { PipelinePageContent } from '../components/pipeline/PipelinePageContent';

const usePipelineState = () => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (fileId: string): void => {
    setSelectedFile(fileId);
    setFileModalOpen(false);
  };

  const handleStartImport = (): void => {
    alert('Import functionality coming soon!');
  };

  return {
    fileModalOpen,
    selectedFile,
    onOpenFileModal: () => setFileModalOpen(true),
    onCloseFileModal: () => setFileModalOpen(false),
    onFileSelect: handleFileSelect,
    onStartImport: handleStartImport,
  };
};

export const PipelinePage: React.FC = () => {
  const pipelineState = usePipelineState();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <PipelinePageContent {...pipelineState} />
      </Box>
    </Container>
  );
};