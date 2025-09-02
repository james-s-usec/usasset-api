import { useState, useCallback } from 'react';
import type { Project } from '../types/project.types';

interface ProjectDialogsState {
  // Project dialog state
  dialogOpen: boolean;
  selectedProject: Project | null;
  // Members dialog state
  membersDialogOpen: boolean;
  membersProject: Project | null;
  // Actions
  openCreateDialog: () => void;
  openEditDialog: (project: Project) => void;
  closeProjectDialog: () => void;
  openMembersDialog: (project: Project) => void;
  closeMembersDialog: () => void;
}

/**
 * Hook to manage project dialog states
 * Follows the complexity budget: focused on dialog state management only
 */
export function useProjectDialogs(): ProjectDialogsState {
  // Consolidated state for project dialog
  const [projectDialog, setProjectDialog] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });

  // Consolidated state for members dialog
  const [membersDialog, setMembersDialog] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });

  const openCreateDialog = useCallback(() => {
    setProjectDialog({ open: true, project: null });
  }, []);

  const openEditDialog = useCallback((project: Project) => {
    setProjectDialog({ open: true, project });
  }, []);

  const closeProjectDialog = useCallback(() => {
    setProjectDialog(prev => ({ ...prev, open: false }));
  }, []);

  const openMembersDialog = useCallback((project: Project) => {
    setMembersDialog({ open: true, project });
  }, []);

  const closeMembersDialog = useCallback(() => {
    setMembersDialog(prev => ({ ...prev, open: false }));
  }, []);

  return {
    dialogOpen: projectDialog.open,
    selectedProject: projectDialog.project,
    membersDialogOpen: membersDialog.open,
    membersProject: membersDialog.project,
    openCreateDialog,
    openEditDialog,
    closeProjectDialog,
    openMembersDialog,
    closeMembersDialog,
  };
}