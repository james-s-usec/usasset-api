import { useState, useCallback, useMemo } from 'react';
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

type DialogState = { open: boolean; project: Project | null };

/**
 * Create dialog action handlers
 */
function createDialogHandlers(
  setDialog: React.Dispatch<React.SetStateAction<DialogState>>
): { open: (project: Project | null) => void; close: () => void } {
  const open = (project: Project | null): void => setDialog({ open: true, project });
  const close = (): void => setDialog(prev => ({ ...prev, open: false }));
  return { open, close };
}

/**
 * Hook to manage project dialog states
 * Follows the complexity budget: focused on dialog state management only
 */
export function useProjectDialogs(): ProjectDialogsState {
  const [projectDialog, setProjectDialog] = useState<DialogState>({ open: false, project: null });
  const [membersDialog, setMembersDialog] = useState<DialogState>({ open: false, project: null });

  const projectHandlers = useMemo(() => createDialogHandlers(setProjectDialog), []);
  const membersHandlers = useMemo(() => createDialogHandlers(setMembersDialog), []);

  return {
    dialogOpen: projectDialog.open,
    selectedProject: projectDialog.project,
    membersDialogOpen: membersDialog.open,
    membersProject: membersDialog.project,
    openCreateDialog: useCallback(() => projectHandlers.open(null), [projectHandlers]),
    openEditDialog: useCallback((project: Project) => projectHandlers.open(project), [projectHandlers]),
    closeProjectDialog: useCallback(() => projectHandlers.close(), [projectHandlers]),
    openMembersDialog: useCallback((project: Project) => membersHandlers.open(project), [membersHandlers]),
    closeMembersDialog: useCallback(() => membersHandlers.close(), [membersHandlers]),
  };
}