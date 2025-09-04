// Custom hooks for BulkActionsToolbar
import { useState } from "react";
import {
  useBulkProjectHandler,
  useBulkFolderHandler,
  useBulkDeleteHandler,
} from "./BulkActionsHandlers";

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
    projectId: "",
    folderId: "",
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

export const useBulkActionHandlers = (
  params: BulkActionHandlerParams
): {
  handleBulkAssignProject: () => Promise<void>;
  handleBulkMoveToFolder: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
} => {
  const { selectedFiles, selected, handlers, setDialogs, setSelected, setLoading } = params;

  const handleBulkAssignProject = useBulkProjectHandler({
    selectedFiles,
    projectId: selected.projectId,
    handlers,
    setDialogs,
    setSelected,
    setLoading,
  });

  const handleBulkMoveToFolder = useBulkFolderHandler({
    selectedFiles,
    folderId: selected.folderId,
    handlers,
    setDialogs,
    setSelected,
    setLoading,
  });

  const handleBulkDelete = useBulkDeleteHandler({
    selectedFiles,
    handlers,
    setDialogs,
    setLoading,
  });

  return {
    handleBulkAssignProject,
    handleBulkMoveToFolder,
    handleBulkDelete,
  };
};

export const useBulkActions = (
  selectedFiles: Set<string>,
  handlers: BulkActionHandlers
): {
  dialogs: DialogState;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  selected: SelectedState;
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>;
  loading: boolean;
  handleBulkAssignProject: () => Promise<void>;
  handleBulkMoveToFolder: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
} => {
  const { dialogs, setDialogs, selected, setSelected, loading, setLoading } = useDialogState();
  
  const actionHandlers = useBulkActionHandlers({
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
    ...actionHandlers,
  };
};
