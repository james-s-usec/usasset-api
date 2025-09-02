import { useCallback } from 'react';
import { useProjects } from './useProjects';
import { useProjectDialogs } from './useProjectDialogs';
import { useProjectPagination } from './useProjectPagination';
import { useProjectActions } from './useProjectActions';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../types/project.types';

/**
 * Return type for useProjectsPageLogic hook
 */
interface ProjectsPageLogicReturn {
  // State
  projects: Project[];
  loading: boolean;
  error: string | null;
  total: number;
  // Pagination
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  // Dialogs
  dialogOpen: boolean;
  selectedProject: Project | null;
  membersDialogOpen: boolean;
  membersProject: Project | null;
  onCreateClick: () => void;
  onEditClick: (project: Project) => void;
  onMembersClick: (project: Project) => void;
  closeProjectDialog: () => void;
  closeMembersDialog: () => void;
  // Actions
  onSave: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>;
  onDelete: (project: Project) => Promise<void>;
}

/**
 * Hook to handle save action with context from dialogs
 */
function useProjectSaveHandler(
  selectedProject: Project | null,
  handleSaveProject: (data: CreateProjectDto | UpdateProjectDto, isEdit: boolean, projectId?: string) => Promise<void>
): (data: CreateProjectDto | UpdateProjectDto) => Promise<void> {
  return useCallback(async (data: CreateProjectDto | UpdateProjectDto) => {
    await handleSaveProject(
      data,
      !!selectedProject,
      selectedProject?.id
    );
  }, [selectedProject, handleSaveProject]);
}

/**
 * Hook to handle delete action with project count
 */
function useProjectDeleteHandler(
  handleDeleteProject: (project: Project, currentCount: number) => Promise<void>,
  projectsLength: number
): (project: Project) => Promise<void> {
  return useCallback((project: Project) => {
    return handleDeleteProject(project, projectsLength);
  }, [handleDeleteProject, projectsLength]);
}


/**
 * Composite hook that orchestrates all Projects page logic
 * Single responsibility: coordinate between different hooks
 */
export function useProjectsPageLogic(): ProjectsPageLogicReturn {
  const { projects, loading, error, total, fetchProjects, createProject, updateProject, deleteProject } = useProjects();
  const dialogs = useProjectDialogs();
  
  const onPaginationChange = useCallback((page: number, pageSize: number) => {
    void fetchProjects({ page, limit: pageSize });
  }, [fetchProjects]);
  const pagination = useProjectPagination({ onPaginationChange });

  const onDeleteSuccess = useCallback((_: Project, wasLastItem: boolean) => {
    if (wasLastItem && pagination.page > 1) {
      pagination.handlePageChange(pagination.page - 1);
    }
  }, [pagination]);

  const actions = useProjectActions({ createProject, updateProject, deleteProject, onDeleteSuccess });
  const handleSave = useProjectSaveHandler(dialogs.selectedProject, actions.handleSaveProject);
  const handleDelete = useProjectDeleteHandler(actions.handleDeleteProject, projects.length);

  return {
    projects, loading, error, total,
    page: pagination.page, pageSize: pagination.pageSize,
    onPageChange: pagination.handlePageChange, onPageSizeChange: pagination.handlePageSizeChange,
    dialogOpen: dialogs.dialogOpen, selectedProject: dialogs.selectedProject,
    membersDialogOpen: dialogs.membersDialogOpen, membersProject: dialogs.membersProject,
    onCreateClick: dialogs.openCreateDialog, onEditClick: dialogs.openEditDialog,
    onMembersClick: dialogs.openMembersDialog, closeProjectDialog: dialogs.closeProjectDialog,
    closeMembersDialog: dialogs.closeMembersDialog,
    onSave: handleSave, onDelete: handleDelete,
  };
}