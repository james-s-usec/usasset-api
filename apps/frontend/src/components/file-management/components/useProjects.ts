import { useState, useEffect, useCallback } from "react";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface UseProjectsState {
  projects: Project[];
  loadProjects: () => Promise<void>;
}

export const useProjects = (
  fetchProjects: () => Promise<Project[]>
): UseProjectsState => {
  const [projects, setProjects] = useState<Project[]>([]);

  const loadProjects = useCallback(async (): Promise<void> => {
    try {
      const projectData = await fetchProjects();
      setProjects(projectData);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }, [fetchProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return { projects, loadProjects };
};
