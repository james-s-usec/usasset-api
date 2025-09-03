import { useState, useCallback } from 'react';
import type { FileData } from './types';
import { useFileOperations } from './useFileOperations';

interface Folder {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  file_count: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface UseFileManagementReturn {
  files: FileData[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  loadFiles: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void>;
  handleDownload: (fileId: string) => Promise<void>;
  handleDelete: (fileId: string, fileName: string) => Promise<void>;
  handleMoveToFolder: (fileId: string, folderId: string | null) => Promise<void>;
  handleMoveToProject: (fileId: string, projectId: string | null) => Promise<void>;
  handlePreview: (fileId: string) => Promise<string>;
  getFileContent: (fileId: string) => Promise<string>;
  getPdfInfo: (fileId: string) => Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    dimensions: { width: number; height: number };
    maxZoom: number;
    tileSize: number;
  }>;
  fetchFolders: () => Promise<Folder[]>;
  fetchProjects: () => Promise<Project[]>;
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
    console.log('🔍 loadFilesImpl: Starting file load');
    setError(null);
    const fileList = await fetchFiles();
    console.log('🔍 loadFilesImpl: Received fileList:', fileList);
    console.log('🔍 loadFilesImpl: Setting files state with:', fileList);
    setFiles(fileList);
    console.log('🔍 loadFilesImpl: Files state updated successfully');
  } catch (error) {
    console.error('🔍 loadFilesImpl: Error caught:', error);
    setError('Network error loading files');
  } finally {
    setLoading(false);
  }
};

const uploadHandlerImpl = async (
  event: React.ChangeEvent<HTMLInputElement>,
  folderId: string | undefined,
  projectId: string | undefined,
  deps: {
    uploadFile: (file: File, folderId?: string, projectId?: string) => Promise<void>;
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
    await uploadFile(file, folderId, projectId);
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchFiles, uploadFile, handleDownload, performDelete, handlePreview, getFileContent, getPdfInfo, fetchFolders, fetchProjects, moveFile, moveFileToProject } = useFileOperations(setError);

  const loadFolders = useCallback(async (): Promise<void> => {
    try {
      const folderData = await fetchFolders();
      setFolders(folderData as Folder[]);
    } catch (error) {
      console.error('Failed to load folders:', error);
      // Don't set error for folders - it's not critical
    }
  }, [fetchFolders]);

  const loadFiles = useCallback(
    async (): Promise<void> => {
      await Promise.all([
        loadFilesImpl(fetchFiles, setFiles, setError, setLoading),
        loadFolders()
      ]);
    },
    [fetchFiles, setError, loadFolders]
  );

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string): Promise<void> =>
    uploadHandlerImpl(event, folderId, projectId, { uploadFile, loadFiles, setError, setUploading }),
  [uploadFile, loadFiles, setError]);

  const handleDelete = useCallback(
    (fileId: string, fileName: string): Promise<void> =>
      deleteHandlerImpl(fileId, fileName, performDelete, loadFiles),
    [performDelete, loadFiles]
  );

  const handleMoveToFolder = useCallback(
    async (fileId: string, folderId: string | null): Promise<void> => {
      await moveFile(fileId, folderId);
      await loadFiles();
    },
    [moveFile, loadFiles]
  );

  const handleMoveToProject = useCallback(
    async (fileId: string, projectId: string | null): Promise<void> => {
      await moveFileToProject(fileId, projectId);
      await loadFiles();
    },
    [moveFileToProject, loadFiles]
  );

  const fetchFoldersTyped = useCallback(async (): Promise<Folder[]> => {
    const result = await fetchFolders();
    return result as Folder[];
  }, [fetchFolders]);

  const fetchProjectsTyped = useCallback(async (): Promise<Project[]> => {
    const result = await fetchProjects();
    return result as Project[];
  }, [fetchProjects]);

  return { 
    files, 
    folders, 
    loading, 
    error, 
    uploading, 
    loadFiles, 
    handleFileUpload, 
    handleDownload, 
    handleDelete, 
    handleMoveToFolder, 
    handleMoveToProject, 
    handlePreview, 
    getFileContent, 
    getPdfInfo, 
    fetchFolders: fetchFoldersTyped,
    fetchProjects: fetchProjectsTyped,
    setError 
  };
};
