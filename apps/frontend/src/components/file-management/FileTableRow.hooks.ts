// Custom hooks for FileTableRow
import { useState } from 'react';
import type { FileData } from './types';

interface PreviewSetters {
  setLoading: (loading: boolean) => void;
  setPreviewUrl: (url: string) => void;
  setPreviewOpen: (open: boolean) => void;
}

export const createPreviewHandler = (
  file: FileData,
  onPreview: (fileId: string) => Promise<string>,
  setters: PreviewSetters
): (() => Promise<void>) => async (): Promise<void> => {
  setters.setLoading(true);
  try {
    const url = await onPreview(file.id);
    setters.setPreviewUrl(url);
    setters.setPreviewOpen(true);
  } catch (error) {
    console.error('Failed to get preview URL:', error);
  } finally {
    setters.setLoading(false);
  }
};

export const usePreviewLogic = (
  file: FileData, 
  onPreview?: (fileId: string) => Promise<string>
) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const handlePreview = onPreview 
    ? createPreviewHandler(file, onPreview, { setLoading, setPreviewUrl, setPreviewOpen })
    : async (): Promise<void> => {};

  return {
    previewOpen,
    previewUrl,
    loading,
    handlePreview,
    setPreviewOpen,
    csvPreviewOpen,
    setCsvPreviewOpen,
    pdfPreviewOpen,
    setPdfPreviewOpen,
  };
};

export const createPreviewClickHandler = (
  isCSV: boolean,
  isImage: boolean,
  isPDF: boolean,
  setCsvPreviewOpen: (open: boolean) => void,
  setPdfPreviewOpen: (open: boolean) => void,
  handlePreview: () => Promise<void>
): (() => Promise<void>) => async (): Promise<void> => {
  if (isCSV) {
    setCsvPreviewOpen(true);
  } else if (isPDF) {
    setPdfPreviewOpen(true);
  } else if (isImage) {
    await handlePreview();
  }
};

export const createDefaultGetFileContent = (): ((fileId: string) => Promise<string>) => 
  (): Promise<string> => Promise.reject(new Error('getFileContent not provided'));