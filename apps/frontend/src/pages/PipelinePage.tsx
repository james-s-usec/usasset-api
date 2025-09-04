import React, { useState } from 'react';
import { Box } from '@mui/material';
import { FileSelectionModal } from '../components/pipeline/FileSelectionModal';
import { PipelineWithRules } from '../components/pipeline/PipelineWithRules';
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
  selectedFile: string | null
): {
  currentJobId: string | null;
  importError: string | null;
  onStartImport: () => Promise<void>;
} => {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleStartImport = async (): Promise<void> => {
    if (!selectedFile) {
      console.error('No file selected');
      setImportError('No file selected');
      return;
    }
    
    console.log('[PipelinePage] Starting import for file:', selectedFile);
    setImportError(null);
    try {
      const result = await pipelineApi.startImport(selectedFile);
      console.log('[PipelinePage] API returned result:', result);
      console.log('[PipelinePage] JobId from result:', result?.jobId);
      
      if (!result?.jobId) {
        throw new Error('No jobId returned from API');
      }
      
      setCurrentJobId(result.jobId);
      console.log('[PipelinePage] JobId set to state:', result.jobId);
    } catch (error) {
      console.error('Failed to start import:', error);
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
  const importProcess = useImportProcess(fileSelection.selectedFile);

  return { ...fileSelection, ...importProcess };
};

export const PipelinePage: React.FC = () => {
  const pipelineState = usePipelineState();

  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <PipelineWithRules 
        selectedFile={pipelineState.selectedFile}
        selectedFileName={pipelineState.selectedFileName}
        currentJobId={pipelineState.currentJobId}
        importError={pipelineState.importError}
        onSelectFile={pipelineState.onOpenFileModal}
        onStartImport={pipelineState.onStartImport}
      />
      
      <FileSelectionModal 
        open={pipelineState.fileModalOpen}
        onClose={pipelineState.onCloseFileModal}
        onSelect={pipelineState.onFileSelect}
      />
    </Box>
  );
};