/**
 * Projects CRUD Hook
 * Handles create, update, and delete operations for projects
 */

import { useCallback } from 'react';
import { projectApi } from '../services/project-api';
import { DebugService } from '../services/debug-logger';
import type { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto,
  ProjectSearchParams 
} from '../types/project.types';
import type { ApiError } from '../types/error.types';

interface UseProjectsCRUDProps {
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  setError: (error: string | null) => void;
  setTotal: (total: number | ((prev: number) => number)) => void;
  fetchProjects: (params?: ProjectSearchParams) => Promise<void>;
  lastParams: ProjectSearchParams | undefined;
}

interface UseProjectsCRUDReturn {
  createProject: (data: CreateProjectDto) => Promise<Project | undefined>;
  updateProject: (id: string, data: UpdateProjectDto) => Promise<Project | undefined>;
  deleteProject: (id: string) => Promise<boolean>;
}

const handleCreateProject = async (
  data: CreateProjectDto,
  setError: (error: string | null) => void,
  fetchProjects: (params?: ProjectSearchParams) => Promise<void>,
  lastParams: ProjectSearchParams | undefined
): Promise<Project | undefined> => {
  try {
    setError(null);
    const newProject = await projectApi.createProject(data);
    
    // Refresh the list to include the new project
    await fetchProjects(lastParams);
    
    return newProject;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
    setError(errorMessage);
    DebugService.logError('Failed to create project', err as ApiError);
    return undefined;
  }
};

const handleUpdateProject = async (
  id: string,
  data: UpdateProjectDto,
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void,
  setError: (error: string | null) => void
): Promise<Project | undefined> => {
  try {
    setError(null);
    const updatedProject = await projectApi.updateProject(id, data);
    
    // Update the project in the local state
    setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
    
    return updatedProject;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
    setError(errorMessage);
    DebugService.logError('Failed to update project', err as ApiError);
    return undefined;
  }
};

const handleDeleteProject = async (
  id: string,
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void,
  setTotal: (total: number | ((prev: number) => number)) => void,
  setError: (error: string | null) => void
): Promise<boolean> => {
  try {
    setError(null);
    await projectApi.deleteProject(id);
    
    // Remove the project from local state
    setProjects(prev => prev.filter(p => p.id !== id));
    setTotal(prev => prev - 1);
    
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
    setError(errorMessage);
    DebugService.logError('Failed to delete project', err as ApiError);
    return false;
  }
};

export function useProjectsCRUD(props: UseProjectsCRUDProps): UseProjectsCRUDReturn {
  const { setProjects, setError, setTotal, fetchProjects, lastParams } = props;

  const createProject = useCallback(
    async (data: CreateProjectDto): Promise<Project | undefined> => {
      return handleCreateProject(data, setError, fetchProjects, lastParams);
    },
    [setError, fetchProjects, lastParams]
  );

  const updateProject = useCallback(
    async (id: string, data: UpdateProjectDto): Promise<Project | undefined> => {
      return handleUpdateProject(id, data, setProjects, setError);
    },
    [setProjects, setError]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      return handleDeleteProject(id, setProjects, setTotal, setError);
    },
    [setProjects, setTotal, setError]
  );

  return {
    createProject,
    updateProject,
    deleteProject
  };
}