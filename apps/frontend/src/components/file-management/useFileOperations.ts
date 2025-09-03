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

const getImagePreviewUrl = async (fileId: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/api/files/${fileId}/view`);
  const result = await response.json();

  if (result.success) {
    return result.data.url;
  }
  throw new Error('Failed to generate preview URL');
};

const getFileContent = async (fileId: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/api/files/${fileId}/content`);
  
  if (!response.ok) {
    throw new Error('Failed to load file content');
  }
  
  const result = await response.json();
  
  // Handle global response wrapper format: { success: true, data: { content: "..." } }
  if (result.success && result.data && result.data.content) {
    return result.data.content;
  }
  
  // Handle direct format: { content: "..." }
  if (result.content) {
    return result.content;
  }
  
  throw new Error('Invalid response format');
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
  handlePreview: (fileId: string) => Promise<string>;
  getFileContent: (fileId: string) => Promise<string>;
}

const useDownloadHandler = (setError: (error: string | null) => void): ((fileId: string) => Promise<void>) =>
  useCallback(async (fileId: string): Promise<void> => {
    try {
      const url = await downloadFile(fileId);
      window.open(url, '_blank');
    } catch {
      setError('Network error during download');
    }
  }, [setError]);

const useDeleteHandler = (setError: (error: string | null) => void): ((fileId: string, fileName: string) => Promise<void>) =>
  useCallback(async (fileId: string, fileName: string): Promise<void> => {
    const shouldDelete = window.confirm(`Are you sure you want to delete "${fileName}"?`);
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteFile(fileId);
    } catch {
      setError('Network error during delete');
    }
  }, [setError]);

const usePreviewHandler = (setError: (error: string | null) => void): ((fileId: string) => Promise<string>) =>
  useCallback(async (fileId: string): Promise<string> => {
    try {
      return await getImagePreviewUrl(fileId);
    } catch (error) {
      setError('Failed to load image preview');
      throw error;
    }
  }, [setError]);

export const useFileOperations = (
  setError: (error: string | null) => void
): UseFileOperationsReturn => {
  const handleDownload = useDownloadHandler(setError);
  const performDelete = useDeleteHandler(setError);
  const handlePreview = usePreviewHandler(setError);

  return {
    fetchFiles,
    uploadFile,
    handleDownload,
    performDelete,
    handlePreview,
    getFileContent,
  };
};
