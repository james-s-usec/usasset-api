// Custom hooks for BulkActionsToolbar
import { useState, useCallback } from 'react';

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

export const useDialogState = (): {
  dialogs: DialogState;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  selected: SelectedState;
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
} => {
  const [dialogs, setDialogs] = useState<DialogState>({
    project: false,
    folder: false,
    delete: false,
  });
  
  const [selected, setSelected] = useState<SelectedState>({
    projectId: '',
    folderId: '',
  });
  
  const [loading, setLoading] = useState(false);

  return {
    dialogs,
    setDialogs,
    selected,
    setSelected,
    loading,
    setLoading,
  };
};

interface BulkActionHandlerParams {
  selectedFiles: Set<string>;
  selected: SelectedState;
  handlers: BulkActionHandlers;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBulkActionHandlers = ({
  selectedFiles,
  selected,
  handlers,
  setDialogs,
  setSelected,
  setLoading,
}: BulkActionHandlerParams): {
  handleBulkAssignProject: () => Promise<void>;
  handleBulkMoveToFolder: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
} => {
  const handleBulkAssignProject = useCallback(async (): Promise<void> => {
    if (selectedFiles.size === 0) return;
    setLoading(true);
    try {
      await handlers.onBulkAssignProject(
        Array.from(selectedFiles), 
        selected.projectId || null
      );
      setDialogs(prev => ({ ...prev, project: false }));
      setSelected(prev => ({ ...prev, projectId: '' }));
      handlers.onClearSelection();
    } catch (error) {
      console.error('Bulk assign project failed:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFiles, selected.projectId, handlers, setDialogs, setSelected, setLoading]);

  const handleBulkMoveToFolder = useCallback(async (): Promise<void> => {
    if (selectedFiles.size === 0) return;
    setLoading(true);
    try {
      await handlers.onBulkMoveToFolder(
        Array.from(selectedFiles), 
        selected.folderId || null
      );
      setDialogs(prev => ({ ...prev, folder: false }));
      setSelected(prev => ({ ...prev, folderId: '' }));
      handlers.onClearSelection();
    } catch (error) {
      console.error('Bulk move to folder failed:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFiles, selected.folderId, handlers, setDialogs, setSelected, setLoading]);

  const handleBulkDelete = useCallback(async (): Promise<void> => {
    if (selectedFiles.size === 0) return;
    setLoading(true);
    try {
      await handlers.onBulkDelete(Array.from(selectedFiles));
      setDialogs(prev => ({ ...prev, delete: false }));
      handlers.onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFiles, handlers, setDialogs, setLoading]);

  return {
    handleBulkAssignProject,
    handleBulkMoveToFolder,
    handleBulkDelete,
  };
};

export const useBulkActions = (
  selectedFiles: Set<string>,
  handlers: BulkActionHandlers
) => {
  const {
    dialogs,
    setDialogs,
    selected,
    setSelected,
    loading,
    setLoading,
  } = useDialogState();

  const bulkHandlers = useBulkActionHandlers({
    selectedFiles,
    selected,
    handlers,
    setDialogs,
    setSelected,
    setLoading,
  });

  return {
    dialogs,
    setDialogs,
    selected,
    setSelected,
    loading,
    ...bulkHandlers,
  };
};