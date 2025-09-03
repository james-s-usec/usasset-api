import { useState, useCallback } from 'react';
import type { FileData } from './types';
import { useFileOperations } from './useFileOperations';

interface UseFileManagementReturn {
  files: FileData[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  loadFiles: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDownload: (fileId: string) => Promise<void>;
  handleDelete: (fileId: string, fileName: string) => Promise<void>;
  handlePreview: (fileId: string) => Promise<string>;
  getFileContent: (fileId: string) => Promise<string>;
  setError: (error: string | null) => void;
}

// Helpers to keep the hook small and readable
const loadFilesImpl = async (
  fetchFiles: () => Promise<FileData[]>,
  setFiles: (files: FileData[]) => void,
  setError: (e: string | null) => void,
  setLoading: (v: boolean) => void
): Promise<void> => {
  try {
    setError(null);
    const fileList = await fetchFiles();
    setFiles(fileList);
  } catch {
    setError('Network error loading files');
  } finally {
    setLoading(false);
  }
};

const uploadHandlerImpl = async (
  event: React.ChangeEvent<HTMLInputElement>,
  deps: {
    uploadFile: (file: File) => Promise<void>;
    loadFiles: () => Promise<void>;
    setError: (e: string | null) => void;
    setUploading: (v: boolean) => void;
  }
): Promise<void> => {
  const { uploadFile, loadFiles, setError, setUploading } = deps;
  const file = event.target.files?.[0];
  if (!file) return;
  setUploading(true);
  setError(null);
  try {
    await uploadFile(file);
    await loadFiles();
    event.target.value = '';
  } catch {
    setError('Network error during upload');
  } finally {
    setUploading(false);
  }
};

const deleteHandlerImpl = async (
  fileId: string,
  fileName: string,
  performDelete: (fileId: string, fileName: string) => Promise<void>,
  loadFiles: () => Promise<void>
): Promise<void> => {
  await performDelete(fileId, fileName);
  await loadFiles();
};

export const useFileManagement = (): UseFileManagementReturn => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchFiles, uploadFile, handleDownload, performDelete, handlePreview, getFileContent } = useFileOperations(setError);

  const loadFiles = useCallback(
    (): Promise<void> => loadFilesImpl(fetchFiles, setFiles, setError, setLoading),
    [fetchFiles, setError]
  );

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>): Promise<void> =>
    uploadHandlerImpl(event, { uploadFile, loadFiles, setError, setUploading }),
  [uploadFile, loadFiles, setError]);

  const handleDelete = useCallback(
    (fileId: string, fileName: string): Promise<void> =>
      deleteHandlerImpl(fileId, fileName, performDelete, loadFiles),
    [performDelete, loadFiles]
  );

  return { files, loading, error, uploading, loadFiles, handleFileUpload, handleDownload, handleDelete, handlePreview, getFileContent, setError };
};
