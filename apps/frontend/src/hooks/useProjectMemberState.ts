import { useState } from 'react';
import type { ProjectMember } from '../types/project.types';
import { useDebugState, useDebugArrayState } from './useDebugState';

export interface UseProjectMemberStateReturn {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  setMembers: (members: ProjectMember[] | ((prev: ProjectMember[]) => ProjectMember[])) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
}

export const useProjectMemberState = (): UseProjectMemberStateReturn => {
  const [members, setMembers] = useDebugArrayState<ProjectMember>([], { 
    name: 'members', 
    componentName: 'useProjectMemberState' 
  });
  const [loading, setLoading] = useDebugState(false, { 
    name: 'loading', 
    componentName: 'useProjectMemberState' 
  });
  const [error, setError] = useDebugState<string | null>(null, { 
    name: 'error', 
    componentName: 'useProjectMemberState' 
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  return {
    members,
    loading,
    error,
    setMembers,
    setLoading,
    setError,
    currentProjectId,
    setCurrentProjectId,
  };
};