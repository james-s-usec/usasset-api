import { useCallback } from 'react';
import type { FileData } from './types';
import config from '../../config';

const API_BASE = config.api.baseUrl;

const syncFiles = async (): Promise<void> => {
  console.log('🔍 syncFiles: Running blob storage sync');
  const response = await fetch(`${API_BASE}/api/files/sync`, {
    method: 'POST',
  });
  const result = await response.json();
  console.log('🔍 syncFiles: Sync result:', result);
};

const fetchFiles = async (): Promise<FileData[]> => {
  console.log('🔍 fetchFiles: Starting with sync first');
  
  // Always sync blob storage with database before fetching
  try {
    await syncFiles();
  } catch (error) {
    console.warn('🔍 fetchFiles: Sync failed, continuing with fetch:', error);
  }
  
  console.log('🔍 fetchFiles: Starting API call to:', `${API_BASE}/api/files`);
  const response = await fetch(`${API_BASE}/api/files`);
  console.log('🔍 fetchFiles: Response status:', response.status);
  const result = await response.json();
  console.log('🔍 fetchFiles: Response data:', result);
  
  if (result.success) {
    console.log('🔍 fetchFiles: Returning files:', result.data.files);
    return result.data.files;
  }
  console.error('🔍 fetchFiles: API response not successful:', result);
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

interface PDFInfo {
  pageCount: number;
  title?: string;
  author?: string;
  dimensions: { width: number; height: number };
  maxZoom: number;
  tileSize: number;
}

const getPdfInfo = async (fileId: string): Promise<PDFInfo> => {
  const response = await fetch(`${API_BASE}/api/files/${fileId}/pdf-info`);
  
  if (!response.ok) {
    throw new Error('Failed to load PDF info');
  }
  
  const result = await response.json();
  
  // Handle global response wrapper format: { success: true, data: { ... } }
  if (result.success && result.data) {
    return result.data;
  }
  
  // Handle direct format (current backend returns this)
  if (result.pageCount !== undefined) {
    return result;
  }
  
  throw new Error('Invalid PDF info response format');
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
  getPdfInfo: (fileId: string) => Promise<PDFInfo>;
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
    getPdfInfo,
  };
};
