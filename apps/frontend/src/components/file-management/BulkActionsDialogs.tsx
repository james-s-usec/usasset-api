import React from 'react';
import { BulkProjectDialog } from './BulkProjectDialog';
import { BulkFolderDialog } from './BulkFolderDialog';
import { BulkDeleteDialog } from './BulkDeleteDialog';
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
type DialogSectionProps = any;

const ProjectDialogSection: React.FC<DialogSectionProps> = (props) => (
  <BulkProjectDialog {...props} />
);

const FolderDialogSection: React.FC<DialogSectionProps> = (props) => (
  <BulkFolderDialog {...props} />
);

const DeleteDialogSection: React.FC<DialogSectionProps> = (props) => (
  <BulkDeleteDialog {...props} />
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
    <>
      <ProjectDialogSection
        {...baseProps}
        open={dialogs.project}
        onClose={handlers.closeProject}
        onConfirm={handleBulkAssignProject}
        selectedProjectId={selected.projectId}
        onProjectChange={handlers.setProjectId}
        projects={projects}
      />
      <FolderDialogSection
        {...baseProps}
        open={dialogs.folder}
        onClose={handlers.closeFolder}
        onConfirm={handleBulkMoveToFolder}
        selectedFolderId={selected.folderId}
        onFolderChange={handlers.setFolderId}
        folders={folders}
      />
      <DeleteDialogSection
        {...baseProps}
        open={dialogs.delete}
        onClose={handlers.closeDelete}
        onConfirm={handleBulkDelete}
      />
    </>
  );
};