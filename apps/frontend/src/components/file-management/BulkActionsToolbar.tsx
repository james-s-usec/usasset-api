import React, { useCallback } from 'react';
import { Box, Toolbar, Collapse } from '@mui/material';
import type { FileData } from './types';
import { SelectionInfo, BulkActionButtons } from './BulkActionsToolbar.components';
import { BulkActionsDialogs } from './BulkActionsDialogs';
import { useBulkActions } from './BulkActionsToolbar.hooks';
import type { DialogState } from './BulkActionsToolbar.hooks';
import { getSelectedFileNames, calculateSelectionState } from './BulkActionsToolbar.helpers';

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

interface BulkActionsToolbarProps {
  selectedFiles: Set<string>;
  allFiles: FileData[];
  folders: Folder[];
  projects: Project[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkAssignProject: (fileIds: string[], projectId: string | null) => Promise<void>;
  onBulkMoveToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  onBulkDelete: (fileIds: string[]) => Promise<void>;
}

// Container styles
const toolbarStyles = {
  bgcolor: 'primary.light',
  color: 'primary.contrastText',
  mb: 2,
  borderRadius: 1
};

interface ToolbarContentProps {
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  selectedFileNames: string[];
  remainingCount: number;
  onToggleSelect: () => void;
  onProjectClick: () => void;
  onFolderClick: () => void;
  onDeleteClick: () => void;
  onClear: () => void;
}

// Simplified component - under 30 lines
const BulkToolbarContent: React.FC<ToolbarContentProps> = (props) => {
  const { selectedCount, onProjectClick, onFolderClick, onDeleteClick, onClear, ...selectionProps } = props;
  
  return (
    <Collapse in={selectedCount > 0}>
      <Box sx={toolbarStyles}>
        <Toolbar sx={{ minHeight: '48px !important' }}>
          <SelectionInfo {...selectionProps} selectedCount={selectedCount} />
          <BulkActionButtons {...{ onProjectClick, onFolderClick, onDeleteClick, onClear }} />
        </Toolbar>
      </Box>
    </Collapse>
  );
};

// Helper hook for dialog actions
const useDialogActions = (setDialogs: React.Dispatch<React.SetStateAction<DialogState>>): {
  openProject: () => void;
  openFolder: () => void;
  openDelete: () => void;
} => ({
  openProject: (): void => setDialogs((prev) => ({ ...prev, project: true })),
  openFolder: (): void => setDialogs((prev) => ({ ...prev, folder: true })),
  openDelete: (): void => setDialogs((prev) => ({ ...prev, delete: true }))
});

// Helper for toolbar props
const useToolbarProps = (props: BulkActionsToolbarProps): { selectedCount: number; allSelected: boolean; someSelected: boolean; selectedFileNames: string[]; remainingCount: number; handleToggleSelect: () => void; getFileNames: () => string[] } => {
  const { selectedFiles, allFiles, onClearSelection, onSelectAll } = props;
  const selectedCount = selectedFiles.size;
  const { allSelected, someSelected } = calculateSelectionState(selectedCount, allFiles.length);
  
  const handleToggleSelect = useCallback(
    () => allSelected ? onClearSelection() : onSelectAll(),
    [allSelected, onClearSelection, onSelectAll]
  );
  
  const getFileNames = useCallback(
    () => getSelectedFileNames(allFiles, selectedFiles),
    [allFiles, selectedFiles]
  );
  
  const selectedFileNames = getFileNames();
  const remainingCount = selectedCount - selectedFileNames.length;
  
  return {
    selectedCount, allSelected, someSelected, selectedFileNames,
    remainingCount, handleToggleSelect, getFileNames
  };
};

// Main component - refactored to under 30 lines
export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = (props) => {
  const { folders, projects, onClearSelection, onBulkAssignProject, onBulkMoveToFolder, onBulkDelete } = props;
  
  const bulkActions = useBulkActions(props.selectedFiles, {
    onBulkAssignProject, onBulkMoveToFolder, onBulkDelete, onClearSelection
  });
  
  const toolbarProps = useToolbarProps(props);
  const dialogActions = useDialogActions(bulkActions.setDialogs);
  
  if (toolbarProps.selectedCount === 0) return null;

  return (
    <>
      <BulkToolbarContent
        {...toolbarProps}
        onToggleSelect={toolbarProps.handleToggleSelect}
        onProjectClick={dialogActions.openProject}
        onFolderClick={dialogActions.openFolder}
        onDeleteClick={dialogActions.openDelete}
        onClear={onClearSelection}
      />
      <BulkActionsDialogs
        {...bulkActions}
        projects={projects}
        folders={folders}
        selectedCount={toolbarProps.selectedCount}
        getFileNames={toolbarProps.getFileNames}
      />
    </>
  );
};