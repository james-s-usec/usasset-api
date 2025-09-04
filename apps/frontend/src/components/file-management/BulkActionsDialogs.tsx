import React from 'react';
import { BulkProjectDialog, type BulkProjectDialogProps } from './BulkProjectDialog';
import { BulkFolderDialog, type BulkFolderDialogProps } from './BulkFolderDialog';
import { BulkDeleteDialog, type BulkDeleteDialogProps } from './BulkDeleteDialog';
import type { Folder, Project } from './types';

interface DialogState {
  project: boolean;
  folder: boolean;
  delete: boolean;
}

interface SelectedState {
  projectId: string;
  folderId: string;
}


interface BulkActionsDialogsProps {
  dialogs: DialogState;
  selected: SelectedState;
  loading: boolean;
  projects: Project[];
  folders: Folder[];
  selectedCount: number;
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>;
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>;
  handleBulkAssignProject: () => Promise<void>;
  handleBulkMoveToFolder: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  getFileNames: () => string[];
}

interface DialogHandlers {
  closeProject: () => void;
  closeFolder: () => void;
  closeDelete: () => void;
  setProjectId: (id: string) => void;
  setFolderId: (id: string) => void;
}

// Helper to create dialog handlers
const createDialogHandlers = (
  setDialogs: React.Dispatch<React.SetStateAction<DialogState>>,
  setSelected: React.Dispatch<React.SetStateAction<SelectedState>>
): DialogHandlers => ({
  closeProject: () => setDialogs(prev => ({ ...prev, project: false })),
  closeFolder: () => setDialogs(prev => ({ ...prev, folder: false })),
  closeDelete: () => setDialogs(prev => ({ ...prev, delete: false })),
  setProjectId: (id: string) => setSelected(prev => ({ ...prev, projectId: id })),
  setFolderId: (id: string) => setSelected(prev => ({ ...prev, folderId: id }))
});

// Type-safe dialog sections
interface BaseDialogProps {
  selectedFileNames: string[];
  selectedCount: number;
  loading: boolean;
}

const ProjectDialogSection: React.FC<BulkProjectDialogProps> = (props) => (
  <BulkProjectDialog {...props} />
);

const FolderDialogSection: React.FC<BulkFolderDialogProps> = (props) => (
  <BulkFolderDialog {...props} />
);

const DeleteDialogSection: React.FC<BulkDeleteDialogProps> = (props) => (
  <BulkDeleteDialog {...props} />
);

// Render all three dialogs
interface DialogsContainerProps {
  dialogs: DialogState;
  selected: SelectedState;
  loading: boolean;
  projects: Project[];
  folders: Folder[];
  selectedCount: number;
  handlers: DialogHandlers;
  baseProps: BaseDialogProps;
  handleBulkAssignProject: () => Promise<void>;
  handleBulkMoveToFolder: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
}

const ProjectDialogWrapper: React.FC<Pick<DialogsContainerProps, 'dialogs' | 'selected' | 'projects' | 'handlers' | 'baseProps' | 'handleBulkAssignProject'>> = 
  ({ dialogs, selected, projects, handlers, baseProps, handleBulkAssignProject }) => (
  <ProjectDialogSection
    {...baseProps}
    open={dialogs.project}
    onClose={handlers.closeProject}
    onConfirm={handleBulkAssignProject}
    selectedProjectId={selected.projectId}
    onProjectChange={handlers.setProjectId}
    projects={projects}
  />
);

const FolderDialogWrapper: React.FC<Pick<DialogsContainerProps, 'dialogs' | 'selected' | 'folders' | 'handlers' | 'baseProps' | 'handleBulkMoveToFolder'>> = 
  ({ dialogs, selected, folders, handlers, baseProps, handleBulkMoveToFolder }) => (
  <FolderDialogSection
    {...baseProps}
    open={dialogs.folder}
    onClose={handlers.closeFolder}
    onConfirm={handleBulkMoveToFolder}
    selectedFolderId={selected.folderId}
    onFolderChange={handlers.setFolderId}
    folders={folders}
  />
);

const DialogsContainer: React.FC<DialogsContainerProps> = (props) => (
  <>
    <ProjectDialogWrapper {...props} />
    <FolderDialogWrapper {...props} />
    <DeleteDialogSection
      {...props.baseProps}
      open={props.dialogs.delete}
      onClose={props.handlers.closeDelete}
      onConfirm={props.handleBulkDelete}
    />
  </>
);

// Main component - now under 30 lines
export const BulkActionsDialogs: React.FC<BulkActionsDialogsProps> = (props) => {
  const { dialogs, selected, loading, projects, folders, selectedCount,
          setDialogs, setSelected, handleBulkAssignProject,
          handleBulkMoveToFolder, handleBulkDelete, getFileNames } = props;
  
  const handlers = createDialogHandlers(setDialogs, setSelected);
  const fileNames = getFileNames();
  const baseProps = { selectedFileNames: fileNames, selectedCount, loading };

  return (
    <DialogsContainer
      dialogs={dialogs}
      selected={selected}
      loading={loading}
      projects={projects}
      folders={folders}
      selectedCount={selectedCount}
      handlers={handlers}
      baseProps={baseProps}
      handleBulkAssignProject={handleBulkAssignProject}
      handleBulkMoveToFolder={handleBulkMoveToFolder}
      handleBulkDelete={handleBulkDelete}
    />
  );
};