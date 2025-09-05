import React, { useState } from 'react';
import { Box } from '@mui/material';
import { FileSelectionModal } from '../components/pipeline/FileSelectionModal';
import { PipelineWithRules } from '../components/pipeline/PipelineWithRules';
import { pipelineApi } from '../services/pipelineApi';

// File state management - extracted
const useFileState = (): {
  fileModalOpen: boolean;
  selectedFile: string | null;
  selectedFileName: string | null;
  setFileModalOpen: (open: boolean) => void;
  setSelectedFile: (file: string | null) => void;
  setSelectedFileName: (name: string | null) => void;
} => {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
  return {
    fileModalOpen,
    selectedFile,
    selectedFileName,
    setFileModalOpen,
    setSelectedFile,
    setSelectedFileName
  };
};

// File selection handlers - extracted to reduce function size
const useFileHandlers = (
  setFileModalOpen: (open: boolean) => void,
  setSelectedFile: (file: string | null) => void,
  setSelectedFileName: (name: string | null) => void
): {
  onOpenFileModal: () => void;
  onCloseFileModal: () => void;
  onFileSelect: (fileId: string, fileName?: string) => void;
} => {
  const handleFileSelect = (fileId: string, fileName?: string): void => {
    setSelectedFile(fileId);
    setSelectedFileName(fileName || fileId);
    setFileModalOpen(false);
  };

  return {
    onOpenFileModal: () => setFileModalOpen(true),
    onCloseFileModal: () => setFileModalOpen(false),
    onFileSelect: handleFileSelect
  };
};

// Combined file selection hook - now under 30 lines
const useFileSelection = (): {
  fileModalOpen: boolean;
  selectedFile: string | null;
  selectedFileName: string | null;
  onOpenFileModal: () => void;
  onCloseFileModal: () => void;
  onFileSelect: (fileId: string, fileName?: string) => void;
} => {
  const state = useFileState();
  const handlers = useFileHandlers(
    state.setFileModalOpen,
    state.setSelectedFile,
    state.setSelectedFileName
  );
  
  return {
    fileModalOpen: state.fileModalOpen,
    selectedFile: state.selectedFile,
    selectedFileName: state.selectedFileName,
    ...handlers
  };
};

// Import state management - extracted
const useImportState = (): {
  currentJobId: string | null;
  importError: string | null;
  setCurrentJobId: (id: string | null) => void;
  setImportError: (error: string | null) => void;
} => {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  return { currentJobId, importError, setCurrentJobId, setImportError };
};

// API call logic - extracted to reduce complexity
const performImport = async (selectedFile: string): Promise<string> => {
  console.log('[PipelinePage] Starting import for file:', selectedFile);
  const result = await pipelineApi.startImport(selectedFile);
  console.log('[PipelinePage] API returned result:', result);
  console.log('[PipelinePage] JobId from result:', result?.jobId);
  
  if (!result?.jobId) {
    throw new Error('No jobId returned from API');
  }
  
  return result.jobId;
};

// Import handler - extracted to reduce statements
const createImportHandler = (
  selectedFile: string | null,
  setImportError: (error: string | null) => void,
  setCurrentJobId: (id: string | null) => void
) => async (): Promise<void> => {
  if (!selectedFile) {
    console.error('No file selected');
    setImportError('No file selected');
    return;
  }
  
  setImportError(null);
  try {
    const jobId = await performImport(selectedFile);
    setCurrentJobId(jobId);
    console.log('[PipelinePage] JobId set to state:', jobId);
  } catch (error) {
    console.error('Failed to start import:', error);
    setImportError(error instanceof Error ? error.message : 'Failed to start import');
  }
};

// Import process hook - now under 30 lines
const useImportProcess = (selectedFile: string | null): {
  currentJobId: string | null;
  importError: string | null;
  onStartImport: () => Promise<void>;
} => {
  const { currentJobId, importError, setCurrentJobId, setImportError } = useImportState();
  
  const onStartImport = createImportHandler(
    selectedFile, 
    setImportError, 
    setCurrentJobId
  );

  return { currentJobId, importError, onStartImport };
};

// Combined pipeline state hook
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

// Main component - simplified
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