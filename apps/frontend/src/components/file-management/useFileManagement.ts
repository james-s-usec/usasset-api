import { useState, useCallback } from 'react';
import type { FileData, Folder, Project } from './types';
import { useFileOperations } from './useFileOperations';

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
const useFileManagementState = (): {
  files: FileData[];
  folders: Folder[];
  uploading: boolean;
  loading: boolean;
  error: string | null;
  setFiles: (files: FileData[]) => void;
  setFolders: (folders: Folder[]) => void;
  setUploading: (uploading: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
} => {
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
  fetchFolders: () => Promise<unknown[]>,
  state: {
    setFiles: (files: FileData[]) => void;
    setFolders: (folders: Folder[]) => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
  }
): { loadFiles: () => Promise<void> } => {
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

// Split file actions into smaller hooks
const useFileUploadAction = (
  uploadFile: (file: File, folderId?: string, projectId?: string) => Promise<void>,
  loadFiles: () => Promise<void>,
  setError: (error: string | null) => void,
  setUploading: (uploading: boolean) => void
): { handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void> } => {
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string): Promise<void> =>
      uploadHandlerImpl(event, folderId, projectId, { uploadFile, loadFiles, setError, setUploading }),
    [uploadFile, loadFiles, setError, setUploading]
  );
  
  return { handleFileUpload };
};

const useFileDeleteAction = (
  performDelete: (fileId: string, fileName: string) => Promise<void>,
  loadFiles: () => Promise<void>
): { handleDelete: (fileId: string, fileName: string) => Promise<void> } => {
  const handleDelete = useCallback(
    (fileId: string, fileName: string): Promise<void> =>
      deleteHandlerImpl(fileId, fileName, performDelete, loadFiles),
    [performDelete, loadFiles]
  );
  
  return { handleDelete };
};

const useFileMoveAction = (
  moveFile: (fileId: string, folderId: string | null) => Promise<void>,
  loadFiles: () => Promise<void>
): { handleMoveToFolder: (fileId: string, folderId: string | null) => Promise<void> } => {
  const handleMoveToFolder = useCallback(
    async (fileId: string, folderId: string | null): Promise<void> => {
      await moveFile(fileId, folderId);
      await loadFiles();
    },
    [moveFile, loadFiles]
  );
  
  return { handleMoveToFolder };
};

const useProjectMoveAction = (
  moveFileToProject: (fileId: string, projectId: string | null) => Promise<void>,
  loadFiles: () => Promise<void>
): { handleMoveToProject: (fileId: string, projectId: string | null) => Promise<void> } => {
  const handleMoveToProject = useCallback(
    async (fileId: string, projectId: string | null): Promise<void> => {
      await moveFileToProject(fileId, projectId);
      await loadFiles();
    },
    [moveFileToProject, loadFiles]
  );
  
  return { handleMoveToProject };
};

const useBulkProjectAssignment = (
  handleBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>,
  loadFiles: () => Promise<void>
): { handleBulkAssignProjectWithRefresh: (fileIds: string[], projectId: string | null) => Promise<void> } => {
  const handleBulkAssignProjectWithRefresh = useCallback(
    async (fileIds: string[], projectId: string | null): Promise<void> => {
      await handleBulkAssignProject(fileIds, projectId);
      await loadFiles();
    },
    [handleBulkAssignProject, loadFiles]
  );
  
  return { handleBulkAssignProjectWithRefresh };
};

const useBulkFolderMove = (
  handleBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>,
  loadFiles: () => Promise<void>
): { handleBulkMoveToFolderWithRefresh: (fileIds: string[], folderId: string | null) => Promise<void> } => {
  const handleBulkMoveToFolderWithRefresh = useCallback(
    async (fileIds: string[], folderId: string | null): Promise<void> => {
      await handleBulkMoveToFolder(fileIds, folderId);
      await loadFiles();
    },
    [handleBulkMoveToFolder, loadFiles]
  );
  
  return { handleBulkMoveToFolderWithRefresh };
};

const useBulkDeleteAction = (
  handleBulkDelete: (fileIds: string[]) => Promise<void>,
  loadFiles: () => Promise<void>
): { handleBulkDeleteWithRefresh: (fileIds: string[]) => Promise<void> } => {
  const handleBulkDeleteWithRefresh = useCallback(
    async (fileIds: string[]): Promise<void> => {
      await handleBulkDelete(fileIds);
      await loadFiles();
    },
    [handleBulkDelete, loadFiles]
  );
  
  return { handleBulkDeleteWithRefresh };
};

const useTypedOperations = (
  fetchFolders: () => Promise<unknown[]>,
  fetchProjects: () => Promise<unknown[]>
): {
  fetchFoldersTyped: () => Promise<Folder[]>;
  fetchProjectsTyped: () => Promise<Project[]>;
} => {
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

// Helper hook for orchestrating all file actions
const useFileManagementActions = (
  fileOps: ReturnType<typeof useFileOperations>,
  loadFiles: () => Promise<void>,
  state: {
    setError: (error: string | null) => void;
    setUploading: (uploading: boolean) => void;
  }
): {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, folderId?: string, projectId?: string) => Promise<void>;
  handleDelete: (fileId: string, fileName: string) => Promise<void>;
  handleMoveToFolder: (fileId: string, folderId: string | null) => Promise<void>;
  handleMoveToProject: (fileId: string, projectId: string | null) => Promise<void>;
} => {
  const { handleFileUpload } = useFileUploadAction(
    fileOps.uploadFile,
    loadFiles,
    state.setError,
    state.setUploading
  );
  
  const { handleDelete } = useFileDeleteAction(fileOps.performDelete, loadFiles);
  const { handleMoveToFolder } = useFileMoveAction(fileOps.moveFile, loadFiles);
  const { handleMoveToProject } = useProjectMoveAction(fileOps.moveFileToProject, loadFiles);
  
  return {
    handleFileUpload,
    handleDelete,
    handleMoveToFolder,
    handleMoveToProject
  };
};

// Helper hook for bulk operations
const useFileManagementBulkActions = (
  fileOps: ReturnType<typeof useFileOperations>,
  loadFiles: () => Promise<void>
): {
  handleBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
  handleBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  handleBulkDelete: (fileIds: string[]) => Promise<void>;
} => {
  const { handleBulkAssignProjectWithRefresh } = useBulkProjectAssignment(
    fileOps.handleBulkAssignProject,
    loadFiles
  );
  const { handleBulkMoveToFolderWithRefresh } = useBulkFolderMove(
    fileOps.handleBulkMoveToFolder,
    loadFiles
  );
  const { handleBulkDeleteWithRefresh } = useBulkDeleteAction(
    fileOps.handleBulkDelete,
    loadFiles
  );
  
  return {
    handleBulkAssignProject: handleBulkAssignProjectWithRefresh,
    handleBulkMoveToFolder: handleBulkMoveToFolderWithRefresh,
    handleBulkDelete: handleBulkDeleteWithRefresh
  };
};

// Main hook assembly - split return object creation into smaller parts
const assembleFileManagementReturn = (params: {
  state: ReturnType<typeof useFileManagementState>;
  loadFiles: () => Promise<void>;
  actions: ReturnType<typeof useFileManagementActions>;
  bulkActions: ReturnType<typeof useFileManagementBulkActions>;
  fileOps: ReturnType<typeof useFileOperations>;
  fetchFoldersTyped: () => Promise<Folder[]>;
  fetchProjectsTyped: () => Promise<Project[]>;
}): UseFileManagementReturn => ({
  files: params.state.files,
  folders: params.state.folders,
  loading: params.state.loading,
  error: params.state.error,
  uploading: params.state.uploading,
  loadFiles: params.loadFiles,
  ...params.actions,
  handleDownload: params.fileOps.handleDownload,
  handlePreview: params.fileOps.handlePreview,
  getFileContent: params.fileOps.getFileContent,
  getPdfInfo: params.fileOps.getPdfInfo,
  fetchFolders: params.fetchFoldersTyped,
  fetchProjects: params.fetchProjectsTyped,
  setError: params.state.setError,
  ...params.bulkActions
});

// Hook initialization - separate from assembly
const useInitializeFileManagementHooks = (
  state: ReturnType<typeof useFileManagementState>
): { fileOps: ReturnType<typeof useFileOperations>; loadFiles: () => Promise<void> } => {
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
  
  return { fileOps, loadFiles };
};

export const useFileManagement = (): UseFileManagementReturn => {
  const state = useFileManagementState();
  const { fileOps, loadFiles } = useInitializeFileManagementHooks(state);
  
  const actions = useFileManagementActions(fileOps, loadFiles, {
    setError: state.setError,
    setUploading: state.setUploading
  });
  
  const bulkActions = useFileManagementBulkActions(fileOps, loadFiles);
  const { fetchFoldersTyped, fetchProjectsTyped } = useTypedOperations(
    fileOps.fetchFolders,
    fileOps.fetchProjects
  );

  return assembleFileManagementReturn({
    state,
    loadFiles,
    actions,
    bulkActions,
    fileOps,
    fetchFoldersTyped,
    fetchProjectsTyped
  });
};
