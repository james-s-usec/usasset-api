import React, { useCallback } from 'react';
import { Box, Toolbar, Collapse } from '@mui/material';
import type { FileData } from './types';
import { SelectionInfo, BulkActionButtons } from './BulkActionsToolbar.components';
import { BulkActionsDialogs } from './BulkActionsDialogs';
import { useBulkActions } from './BulkActionsToolbar.hooks';
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

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedFiles,
  allFiles,
  folders,
  projects,
  onClearSelection,
  onSelectAll,
  onBulkAssignProject,
  onBulkMoveToFolder,
  onBulkDelete,
}): React.ReactElement | null => {
  const {
    dialogs,
    setDialogs,
    selected,
    setSelected,
    loading,
    handleBulkAssignProject,
    handleBulkMoveToFolder,
    handleBulkDelete,
  } = useBulkActions(selectedFiles, {
    onBulkAssignProject,
    onBulkMoveToFolder,
    onBulkDelete,
    onClearSelection,
  });

  const selectedCount = selectedFiles.size;
  const { allSelected, someSelected } = calculateSelectionState(
    selectedCount,
    allFiles.length
  );

  const handleToggleSelect = useCallback((): void => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  }, [allSelected, onClearSelection, onSelectAll]);

  const getFileNames = useCallback(
    (): string[] => getSelectedFileNames(allFiles, selectedFiles),
    [allFiles, selectedFiles]
  );

  if (selectedCount === 0) return null;

  const selectedFileNames = getFileNames();
  const remainingCount = selectedCount - selectedFileNames.length;

  return (
    <>
      <Collapse in={selectedCount > 0}>
        <Box sx={{ 
          bgcolor: 'primary.light', 
          color: 'primary.contrastText', 
          mb: 2, 
          borderRadius: 1 
        }}>
          <Toolbar sx={{ minHeight: '48px !important' }}>
            <SelectionInfo
              allSelected={allSelected}
              someSelected={someSelected}
              selectedCount={selectedCount}
              selectedFileNames={selectedFileNames}
              remainingCount={remainingCount}
              onToggleSelect={handleToggleSelect}
            />
            <BulkActionButtons
              onProjectClick={(): void => setDialogs(prev => ({ ...prev, project: true }))}
              onFolderClick={(): void => setDialogs(prev => ({ ...prev, folder: true }))}
              onDeleteClick={(): void => setDialogs(prev => ({ ...prev, delete: true }))}
              onClear={onClearSelection}
            />
          </Toolbar>
        </Box>
      </Collapse>

      <BulkActionsDialogs
        dialogs={dialogs}
        selected={selected}
        loading={loading}
        projects={projects}
        folders={folders}
        selectedCount={selectedCount}
        setDialogs={setDialogs}
        setSelected={setSelected}
        handleBulkAssignProject={handleBulkAssignProject}
        handleBulkMoveToFolder={handleBulkMoveToFolder}
        handleBulkDelete={handleBulkDelete}
        getFileNames={getFileNames}
      />
    </>
  );
};