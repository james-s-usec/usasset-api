import { useState, useCallback } from 'react';
import { projectApi } from '../services/project-api';
import type { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto,
  ProjectSearchParams 
} from '../types/project.types';
import { useDebugState } from './useDebugState';
import { useDebugEffect } from './useDebugEffect';
import { DebugService } from '../services/debug-logger';
import type { ApiError } from '../types/error.types';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  total: number;
  fetchProjects: (params?: ProjectSearchParams) => Promise<void>;
  createProject: (data: CreateProjectDto) => Promise<Project | undefined>;
  updateProject: (id: string, data: UpdateProjectDto) => Promise<Project | undefined>;
  deleteProject: (id: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useDebugState<Project[]>([], { name: 'projects', componentName: 'useProjects' });
  const [loading, setLoading] = useDebugState(false, { name: 'loading', componentName: 'useProjects' });
  const [error, setError] = useDebugState<string | null>(null, { name: 'error', componentName: 'useProjects' });
  const [total, setTotal] = useDebugState(0, { name: 'total', componentName: 'useProjects' });
  const [lastParams, setLastParams] = useState<ProjectSearchParams | undefined>();

  const fetchProjects = useCallback(async (params?: ProjectSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      setLastParams(params);
      
      const response = await projectApi.getProjects(params);
      setProjects(response.data);
      setTotal(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      DebugService.logError('Failed to fetch projects', err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError, setTotal]);

  const createProject = useCallback(async (data: CreateProjectDto): Promise<Project | undefined> => {
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
  }, [fetchProjects, lastParams, setError]);

  const updateProject = useCallback(async (id: string, data: UpdateProjectDto): Promise<Project | undefined> => {
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
  }, [setProjects, setError]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
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
  }, [setProjects, setTotal, setError]);

  const refreshProjects = useCallback(async () => {
    await fetchProjects(lastParams);
  }, [fetchProjects, lastParams]);

  // Initial fetch
  useDebugEffect(
    () => {
      void fetchProjects({ page: 1, limit: 10 });
    },
    [],
    { name: 'initialFetch', componentName: 'useProjects' }
  );

  return {
    projects,
    loading,
    error,
    total,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
}