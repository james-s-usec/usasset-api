import { useDebugEffect } from './useDebugEffect';
import { useProjectsState } from './useProjectsState';
import { useProjectsList } from './useProjectsList';
import { useProjectsCRUD } from './useProjectsCRUD';
import type { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto,
  ProjectSearchParams 
} from '../types/project.types';

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
  const state = useProjectsState();
  const list = useProjectsList({
    setProjects: state.setProjects,
    setLoading: state.setLoading,
    setError: state.setError,
    setTotal: state.setTotal,
    setLastParams: state.setLastParams,
    lastParams: state.lastParams
  });
  const crud = useProjectsCRUD({
    setProjects: state.setProjects,
    setError: state.setError,
    setTotal: state.setTotal,
    fetchProjects: list.fetchProjects,
    lastParams: state.lastParams
  });

  useDebugEffect(
    () => void list.fetchProjects({ page: 1, limit: 10 }),
    [],
    { name: 'initialFetch', componentName: 'useProjects' }
  );

  return {
    projects: state.projects, loading: state.loading,
    error: state.error, total: state.total,
    fetchProjects: list.fetchProjects, refreshProjects: list.refreshProjects,
    createProject: crud.createProject, updateProject: crud.updateProject,
    deleteProject: crud.deleteProject
  };
}