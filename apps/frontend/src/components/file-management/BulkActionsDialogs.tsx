import React from 'react';
import { BulkProjectDialog } from './BulkProjectDialog';
import { BulkFolderDialog } from './BulkFolderDialog';
import { BulkDeleteDialog } from './BulkDeleteDialog';

interface DialogState {
  project: boolean;
  folder: boolean;
  delete: boolean;
}

interface SelectedState {
  projectId: string;
  folderId: string;
}

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

export const BulkActionsDialogs: React.FC<BulkActionsDialogsProps> = ({
  dialogs,
  selected,
  loading,
  projects,
  folders,
  selectedCount,
  setDialogs,
  setSelected,
  handleBulkAssignProject,
  handleBulkMoveToFolder,
  handleBulkDelete,
  getFileNames,
}) => (
  <>
    <BulkProjectDialog
      open={dialogs.project}
      onClose={() => setDialogs(prev => ({ ...prev, project: false }))}
      onConfirm={handleBulkAssignProject}
      selectedProjectId={selected.projectId}
      onProjectChange={(id) => setSelected(prev => ({ ...prev, projectId: id }))}
      projects={projects}
      selectedFileNames={getFileNames()}
      selectedCount={selectedCount}
      loading={loading}
    />
    
    <BulkFolderDialog
      open={dialogs.folder}
      onClose={() => setDialogs(prev => ({ ...prev, folder: false }))}
      onConfirm={handleBulkMoveToFolder}
      selectedFolderId={selected.folderId}
      onFolderChange={(id) => setSelected(prev => ({ ...prev, folderId: id }))}
      folders={folders}
      selectedFileNames={getFileNames()}
      selectedCount={selectedCount}
      loading={loading}
    />
    
    <BulkDeleteDialog
      open={dialogs.delete}
      onClose={() => setDialogs(prev => ({ ...prev, delete: false }))}
      onConfirm={handleBulkDelete}
      selectedFileNames={getFileNames()}
      selectedCount={selectedCount}
      loading={loading}
    />
  </>
);