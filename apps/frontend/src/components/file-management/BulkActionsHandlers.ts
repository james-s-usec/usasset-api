import { useCallback } from "react";

interface DialogState {
  project: boolean;
  folder: boolean;
  delete: boolean;
}

interface SelectedState {
  projectId: string;
  folderId: string;
}

interface BulkActionHandlers {
  onBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
  onBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  onBulkDelete: (fileIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

export interface ProjectHandlerParams {
  selectedFiles: Set<string>;
  projectId: string;
  handlers: BulkActionHandlers;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBulkProjectHandler = ({
  selectedFiles,
  projectId,
  handlers,
  setDialogs,
  setSelected,
  setLoading,
}: ProjectHandlerParams): (() => Promise<void>) => {
  return useCallback(async (): Promise<void> => {
    if (selectedFiles.size === 0) return;
    setLoading(true);
    try {
      await handlers.onBulkAssignProject(
        Array.from(selectedFiles),
        projectId || null
      );
      setDialogs(prev => ({ ...prev, project: false }));
      setSelected(prev => ({ ...prev, projectId: "" }));
      handlers.onClearSelection();
    } catch (error) {
      console.error("Bulk assign project failed:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFiles, projectId, handlers, setDialogs, setSelected, setLoading]);
};

export interface FolderHandlerParams {
  selectedFiles: Set<string>;
  folderId: string;
  handlers: BulkActionHandlers;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBulkFolderHandler = ({
  selectedFiles,
  folderId,
  handlers,
  setDialogs,
  setSelected,
  setLoading,
}: FolderHandlerParams): (() => Promise<void>) => {
  return useCallback(async (): Promise<void> => {
    if (selectedFiles.size === 0) return;
    setLoading(true);
    try {
      await handlers.onBulkMoveToFolder(
        Array.from(selectedFiles),
        folderId || null
      );
      setDialogs(prev => ({ ...prev, folder: false }));
      setSelected(prev => ({ ...prev, folderId: "" }));
      handlers.onClearSelection();
    } catch (error) {
      console.error("Bulk move to folder failed:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFiles, folderId, handlers, setDialogs, setSelected, setLoading]);
};

export interface DeleteHandlerParams {
  selectedFiles: Set<string>;
  handlers: BulkActionHandlers;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBulkDeleteHandler = ({
  selectedFiles,
  handlers,
  setDialogs,
  setLoading,
}: DeleteHandlerParams): (() => Promise<void>) => {
  return useCallback(async (): Promise<void> => {
    if (selectedFiles.size === 0) return;
    setLoading(true);
    try {
      await handlers.onBulkDelete(Array.from(selectedFiles));
      setDialogs(prev => ({ ...prev, delete: false }));
      handlers.onClearSelection();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFiles, handlers, setDialogs, setLoading]);
};