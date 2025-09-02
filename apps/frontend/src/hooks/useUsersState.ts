/**
 * Users State Hook
 * Manages users array and loading/error state
 */

import { useDebugState, useDebugArrayState } from './useDebugState';
import type { UserData } from '../types/user';

interface UseUsersStateReturn {
  users: UserData[];
  loading: boolean;
  error: string | null;
  setUsers: (users: UserData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export function useUsersState(): UseUsersStateReturn {
  const [users, setUsers] = useDebugArrayState<UserData>([], {
    name: 'users',
    componentName: 'useUsers'
  });
  
  const [loading, setLoading] = useDebugState(true, {
    name: 'loading',
    componentName: 'useUsers'
  });
  
  const [error, setError] = useDebugState<string | null>(null, {
    name: 'error',
    componentName: 'useUsers'
  });

  const clearError = (): void => {
    setError(null);
  };

  return {
    users,
    loading,
    error,
    setUsers,
    setLoading,
    setError,
    clearError
  };
}
