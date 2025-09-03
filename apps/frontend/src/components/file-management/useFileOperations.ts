import { useCallback } from 'react';
import type { FileData } from './types';
import config from '../../config';

const API_BASE = config.api.baseUrl;

const fetchFiles = async (): Promise<FileData[]> => {
  const response = await fetch(`${API_BASE}/api/files`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.files;
  }
  throw new Error('Failed to load files');
};

const uploadFile = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/files`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Upload failed');
  }
};

const downloadFile = async (fileId: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/api/files/${fileId}/download`);
  const result = await response.json();

  if (result.success) {
    return result.data.url;
  }
  throw new Error('Failed to generate download link');
};

const deleteFile = async (fileId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
    method: 'DELETE',
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error('Failed to delete file');
  }
};

interface UseFileOperationsReturn {
  fetchFiles: () => Promise<FileData[]>;
  uploadFile: (file: File) => Promise<void>;
  handleDownload: (fileId: string) => Promise<void>;
  performDelete: (fileId: string, fileName: string) => Promise<void>;
}

export const useFileOperations = (
  setError: (error: string | null) => void
): UseFileOperationsReturn => {
  const handleDownload = useCallback(async (fileId: string): Promise<void> => {
    try {
      const url = await downloadFile(fileId);
      window.open(url, '_blank');
    } catch {
      setError('Network error during download');
    }
  }, [setError]);

  const performDelete = useCallback(async (fileId: string, fileName: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await deleteFile(fileId);
    } catch {
      setError('Network error during delete');
    }
  }, [setError]);

  return {
    fetchFiles,
    uploadFile,
    handleDownload,
    performDelete,
  };
};
