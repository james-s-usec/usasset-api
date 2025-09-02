import { useCallback } from 'react';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../types/project.types';

interface ProjectActionsOptions {
  createProject: (data: CreateProjectDto) => Promise<Project | undefined>;
  updateProject: (id: string, data: UpdateProjectDto) => Promise<Project | undefined>;
  deleteProject: (id: string) => Promise<boolean>;
  onDeleteSuccess?: (deletedProject: Project, wasLastItem: boolean) => void;
}

interface ProjectActions {
  handleSaveProject: (data: CreateProjectDto | UpdateProjectDto, isUpdate: boolean, projectId?: string) => Promise<void>;
  handleDeleteProject: (project: Project, currentItemsCount: number) => Promise<void>;
}

/**
 * Hook to manage project CRUD actions
 * Follows the complexity budget: focused on action handlers only
 */
export function useProjectActions(options: ProjectActionsOptions): ProjectActions {
  const { createProject, updateProject, deleteProject, onDeleteSuccess } = options;

  const handleSaveProject = useCallback(async (
    data: CreateProjectDto | UpdateProjectDto,
    isUpdate: boolean,
    projectId?: string
  ) => {
    if (isUpdate && projectId) {
      await updateProject(projectId, data as UpdateProjectDto);
    } else {
      await createProject(data as CreateProjectDto);
    }
  }, [createProject, updateProject]);

  const handleDeleteProject = useCallback(async (
    project: Project,
    currentItemsCount: number
  ) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      const success = await deleteProject(project.id);
      if (success && onDeleteSuccess) {
        const wasLastItem = currentItemsCount === 1;
        onDeleteSuccess(project, wasLastItem);
      }
    }
  }, [deleteProject, onDeleteSuccess]);

  return {
    handleSaveProject,
    handleDeleteProject,
  };
}