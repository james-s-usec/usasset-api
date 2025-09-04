import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import { FileSelectionModal } from '../components/pipeline/FileSelectionModal';
import { PipelineFlow } from '../components/pipeline/PipelineFlow';
import { pipelineApi } from '../services/pipelineApi';

const useFileSelection = (): {
  fileModalOpen: boolean;
  selectedFile: string | null;
  selectedFileName: string | null;
  onOpenFileModal: () => void;
  onCloseFileModal: () => void;
  onFileSelect: (fileId: string, fileName?: string) => void;
} => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileSelect = (fileId: string, fileName?: string): void => {
    setSelectedFile(fileId);
    setSelectedFileName(fileName || fileId);
    setFileModalOpen(false);
  };

  const handleOpenFileModal = (): void => {
    setFileModalOpen(true);
  };

  const handleCloseFileModal = (): void => {
    setFileModalOpen(false);
  };

  return {
    fileModalOpen,
    selectedFile,
    selectedFileName,
    onOpenFileModal: handleOpenFileModal,
    onCloseFileModal: handleCloseFileModal,
    onFileSelect: handleFileSelect,
  };
};

const useImportProcess = (
  selectedFile: string | null, 
  onFileSelect: (fileId: string, fileName?: string) => void
): {
  currentJobId: string | null;
  importError: string | null;
  onStartImport: () => Promise<void>;
} => {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleStartImport = async (): Promise<void> => {
    if (!selectedFile) return;
    
    setImportError(null);
    try {
      const result = await pipelineApi.startImport(selectedFile);
      setCurrentJobId(result.jobId);
      // Don't clear selection - we need to keep showing the file name
      // onFileSelect('', ''); // Removed - this was hiding the staging preview!
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to start import');
    }
  };

  return { currentJobId, importError, onStartImport: handleStartImport };
};

const usePipelineState = (): {
  fileModalOpen: boolean;
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  importError: string | null;
  onOpenFileModal: () => void;
  onCloseFileModal: () => void;
  onFileSelect: (fileId: string, fileName?: string) => void;
  onStartImport: () => Promise<void>;
} => {
  const fileSelection = useFileSelection();
  const importProcess = useImportProcess(fileSelection.selectedFile, fileSelection.onFileSelect);

  return { ...fileSelection, ...importProcess };
};

export const PipelinePage: React.FC = () => {
  const pipelineState = usePipelineState();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <PipelineFlow 
          selectedFile={pipelineState.selectedFile}
          selectedFileName={pipelineState.selectedFileName}
          currentJobId={pipelineState.currentJobId}
          onSelectFile={pipelineState.onOpenFileModal}
          onStartImport={pipelineState.onStartImport}
        />
        
        <FileSelectionModal 
          open={pipelineState.fileModalOpen}
          onClose={pipelineState.onCloseFileModal}
          onSelect={pipelineState.onFileSelect}
        />
      </Box>
    </Container>
  );
};