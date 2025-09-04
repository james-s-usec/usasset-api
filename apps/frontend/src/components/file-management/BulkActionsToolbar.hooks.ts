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

// Helper to create handler params
const createHandlerParams = (
  params: BulkActionHandlerParams,
  type: 'project' | 'folder' | 'delete'
): any => {
  const base = {
    selectedFiles: params.selectedFiles,
    handlers: params.handlers,
    setDialogs: params.setDialogs,
    setLoading: params.setLoading,
  };
  
  if (type === 'project') return { ...base, projectId: params.selected.projectId, setSelected: params.setSelected };
  if (type === 'folder') return { ...base, folderId: params.selected.folderId, setSelected: params.setSelected };
  return base;
};

interface BulkActionHandlersReturn {
  handleBulkAssignProject: () => Promise<void>;
  handleBulkMoveToFolder: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
}

// Refactored - now under 30 lines
export const useBulkActionHandlers = (params: BulkActionHandlerParams): BulkActionHandlersReturn => {
  const handleBulkAssignProject = useBulkProjectHandler(
    createHandlerParams(params, 'project')
  );
  
  const handleBulkMoveToFolder = useBulkFolderHandler(
    createHandlerParams(params, 'folder')
  );
  
  const handleBulkDelete = useBulkDeleteHandler(
    createHandlerParams(params, 'delete')
  );

  return { handleBulkAssignProject, handleBulkMoveToFolder, handleBulkDelete };
};

type BulkActionsReturn = {
  dialogs: DialogState;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  selected: SelectedState;
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>;
  loading: boolean;
  handleBulkAssignProject: () => Promise<void>;
  handleBulkMoveToFolder: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
};

// Simplified - now under 30 lines
export const useBulkActions = (
  selectedFiles: Set<string>,
  handlers: BulkActionHandlers
): BulkActionsReturn => {
  const dialogState = useDialogState();
  const { setDialogs, setSelected, setLoading } = dialogState;
  
  const actionHandlers = useBulkActionHandlers({
    selectedFiles,
    selected: dialogState.selected,
    handlers,
    setDialogs,
    setSelected,
    setLoading,
  });

  return { ...dialogState, ...actionHandlers };
};
