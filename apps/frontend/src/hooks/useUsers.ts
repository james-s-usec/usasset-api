import { useDebugApiEffect } from './useDebugEffect';
import { logHookCall } from '../utils/debug';
import { useUsersState } from './useUsersState';
import { useUsersApi } from './useUsersApi';
import type { UserData, CreateUserRequest, UpdateUserRequest } from '../types/user';

interface UseUsersReturn {
  users: UserData[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  deleteUser: (user: UserData) => Promise<void>;
  clearError: () => void;
}

export const useUsers = (): UseUsersReturn => {
  logHookCall('useUsers', 'entry');

  const state = useUsersState();
  const api = useUsersApi(state);

  useDebugApiEffect(
    api.fetchUsers,
    [],
    {
      name: 'initialFetch',
      componentName: 'useUsers',
      logDependencies: false
    }
  );

  return {
    users: state.users,
    loading: state.loading,
    error: state.error,
    fetchUsers: api.fetchUsers,
    createUser: api.createUser,
    updateUser: api.updateUser,
    deleteUser: api.deleteUser,
    clearError: state.clearError
  };
};