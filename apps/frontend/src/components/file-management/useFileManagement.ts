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
  handleBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
  handleBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  handleBulkDelete: (fileIds: string[]) => Promise<void>;
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

// Custom hooks for specific functionality groups
const useFileManagementState = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  return {
    files,
    folders,
    uploading,
    loading,
    error,
    setFiles,
    setFolders,
    setUploading,
    setLoading,
    setError
  };
};

const useFileLoading = (
  fetchFiles: () => Promise<FileData[]>,
  fetchFolders: () => Promise<any[]>,
  state: {
    setFiles: (files: FileData[]) => void;
    setFolders: (folders: Folder[]) => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
  }
) => {
  const { setFiles, setFolders, setError, setLoading } = state;
  
  const loadFolders = useCallback(async (): Promise<void> => {
    try {
      const folderData = await fetchFolders();
      setFolders(folderData as Folder[]);
    } catch (error) {
      console.error('Failed to load folders:', error);
      // Don't set error for folders - it's not critical
    }
  }, [fetchFolders, setFolders]);

  const loadFiles = useCallback(
    async (): Promise<void> => {
      await Promise.all([
        loadFilesImpl(fetchFiles, setFiles, setError, setLoading),
        loadFolders()
      ]);
    },
    [fetchFiles, setError, setFiles, setLoading, loadFolders]
  );
  
  return { loadFiles };
};

const useFileActions = (
  fileOps: {
    uploadFile: (file: File, folderId?: string, projectId?: string) => Promise<void>;
    performDelete: (fileId: string, fileName: string) => Promise<void>;
    moveFile: (fileId: string, folderId: string | null) => Promise<void>;
    moveFileToProject: (fileId: string, projectId: string | null) => Promise<void>;
  },
  loadFiles: () => Promise<void>,
  state: {
    setError: (error: string | null) => void;
    setUploading: (uploading: boolean) => void;
  }
) => {
  const { uploadFile, performDelete, moveFile, moveFileToProject } = fileOps;
  const { setError, setUploading } = state;
  
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string): Promise<void> =>
      uploadHandlerImpl(event, folderId, projectId, { uploadFile, loadFiles, setError, setUploading }),
    [uploadFile, loadFiles, setError, setUploading]
  );

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
  
  return {
    handleFileUpload,
    handleDelete,
    handleMoveToFolder,
    handleMoveToProject
  };
};

const useBulkOperations = (
  bulkOps: {
    handleBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
    handleBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
    handleBulkDelete: (fileIds: string[]) => Promise<void>;
  },
  loadFiles: () => Promise<void>
) => {
  const { handleBulkAssignProject, handleBulkMoveToFolder, handleBulkDelete } = bulkOps;
  
  const handleBulkAssignProjectWithRefresh = useCallback(
    async (fileIds: string[], projectId: string | null): Promise<void> => {
      await handleBulkAssignProject(fileIds, projectId);
      await loadFiles();
    },
    [handleBulkAssignProject, loadFiles]
  );

  const handleBulkMoveToFolderWithRefresh = useCallback(
    async (fileIds: string[], folderId: string | null): Promise<void> => {
      await handleBulkMoveToFolder(fileIds, folderId);
      await loadFiles();
    },
    [handleBulkMoveToFolder, loadFiles]
  );

  const handleBulkDeleteWithRefresh = useCallback(
    async (fileIds: string[]): Promise<void> => {
      await handleBulkDelete(fileIds);
      await loadFiles();
    },
    [handleBulkDelete, loadFiles]
  );
  
  return {
    handleBulkAssignProject: handleBulkAssignProjectWithRefresh,
    handleBulkMoveToFolder: handleBulkMoveToFolderWithRefresh,
    handleBulkDelete: handleBulkDeleteWithRefresh
  };
};

const useTypedOperations = (
  fetchFolders: () => Promise<any[]>,
  fetchProjects: () => Promise<any[]>
) => {
  const fetchFoldersTyped = useCallback(async (): Promise<Folder[]> => {
    const result = await fetchFolders();
    return result as Folder[];
  }, [fetchFolders]);

  const fetchProjectsTyped = useCallback(async (): Promise<Project[]> => {
    const result = await fetchProjects();
    return result as Project[];
  }, [fetchProjects]);
  
  return { fetchFoldersTyped, fetchProjectsTyped };
};

export const useFileManagement = (): UseFileManagementReturn => {
  const state = useFileManagementState();
  const fileOps = useFileOperations(state.setError);
  
  const { loadFiles } = useFileLoading(
    fileOps.fetchFiles,
    fileOps.fetchFolders,
    {
      setFiles: state.setFiles,
      setFolders: state.setFolders,
      setError: state.setError,
      setLoading: state.setLoading
    }
  );
  
  const fileActions = useFileActions(
    {
      uploadFile: fileOps.uploadFile,
      performDelete: fileOps.performDelete,
      moveFile: fileOps.moveFile,
      moveFileToProject: fileOps.moveFileToProject
    },
    loadFiles,
    { setError: state.setError, setUploading: state.setUploading }
  );
  
  const bulkOps = useBulkOperations(
    {
      handleBulkAssignProject: fileOps.handleBulkAssignProject,
      handleBulkMoveToFolder: fileOps.handleBulkMoveToFolder,
      handleBulkDelete: fileOps.handleBulkDelete
    },
    loadFiles
  );
  
  const { fetchFoldersTyped, fetchProjectsTyped } = useTypedOperations(
    fileOps.fetchFolders,
    fileOps.fetchProjects
  );

  return {
    files: state.files,
    folders: state.folders,
    loading: state.loading,
    error: state.error,
    uploading: state.uploading,
    loadFiles,
    handleFileUpload: fileActions.handleFileUpload,
    handleDownload: fileOps.handleDownload,
    handleDelete: fileActions.handleDelete,
    handleMoveToFolder: fileActions.handleMoveToFolder,
    handleMoveToProject: fileActions.handleMoveToProject,
    handlePreview: fileOps.handlePreview,
    getFileContent: fileOps.getFileContent,
    getPdfInfo: fileOps.getPdfInfo,
    fetchFolders: fetchFoldersTyped,
    fetchProjects: fetchProjectsTyped,
    setError: state.setError,
    handleBulkAssignProject: bulkOps.handleBulkAssignProject,
    handleBulkMoveToFolder: bulkOps.handleBulkMoveToFolder,
    handleBulkDelete: bulkOps.handleBulkDelete
  };
};
