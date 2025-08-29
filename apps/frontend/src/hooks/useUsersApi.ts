/**
 * Users API Hook
 * Handles all API operations for users
 */

import { useCallback } from 'react';
import { userApiService } from '../services/user-api';
import { logHookCall } from '../utils/debug';
import { 
  createFetchLogger, 
  createUserLogger, 
  updateUserLogger, 
  deleteUserHelpers 
} from '../utils/users-api-helpers';
import type { UserData, CreateUserRequest, UpdateUserRequest } from '../types/user';

interface UseUsersApiProps {
  setUsers: (users: UserData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface UseUsersApiReturn {
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  deleteUser: (user: UserData) => Promise<void>;
}

const useFetchUsers = (props: UseUsersApiProps, fetchLogger: ReturnType<typeof createFetchLogger>): (() => Promise<void>) => {
  const { setUsers, setLoading, setError } = props;
  
  return useCallback(async (): Promise<void> => {
    fetchLogger.logFetchStart();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApiService.getUsers(1, 50);
      setUsers(response.data.users);
      
      fetchLogger.logFetchSuccess(response.data.users.length, response.correlationId);
    } catch (err) {
      setError(fetchLogger.logFetchError(err));
    } finally {
      setLoading(false);
    }
  }, [setUsers, setLoading, setError, fetchLogger]);
};

const useCreateUser = (fetchUsers: () => Promise<void>, setError: (error: string | null) => void): ((data: CreateUserRequest) => Promise<void>) => {
  return useCallback(async (createData: CreateUserRequest): Promise<void> => {
    createUserLogger.logCreateStart(createData.email);
    
    try {
      await userApiService.createUser(createData);
      createUserLogger.logCreateSuccess();
      await fetchUsers();
    } catch (err) {
      setError(createUserLogger.logCreateError(err));
      throw err;
    }
  }, [fetchUsers, setError]);
};

const useUpdateUser = (fetchUsers: () => Promise<void>, setError: (error: string | null) => void): ((id: string, data: UpdateUserRequest) => Promise<void>) => {
  return useCallback(async (userId: string, updateData: UpdateUserRequest): Promise<void> => {
    updateUserLogger.logUpdateStart(userId, updateData);
    
    try {
      await userApiService.updateUser(userId, updateData);
      updateUserLogger.logUpdateSuccess(userId, updateData);
      await fetchUsers();
    } catch (err) {
      setError(updateUserLogger.logUpdateError(userId, updateData, err));
      throw err;
    }
  }, [fetchUsers, setError]);
};

const useDeleteUser = (fetchUsers: () => Promise<void>, setError: (error: string | null) => void): ((user: UserData) => Promise<void>) => {
  return useCallback(async (user: UserData): Promise<void> => {
    logHookCall('useUsers.deleteUser', 'entry', { userId: user.id });
    
    if (!deleteUserHelpers.confirmDelete(user)) {
      logHookCall('useUsers.deleteUser', 'exit', { cancelled: true });
      return;
    }

    try {
      deleteUserHelpers.logDeleteStart(user.id);
      await userApiService.deleteUser(user.id);
      deleteUserHelpers.logDeleteSuccess(user.id);
      await fetchUsers();
    } catch (err) {
      setError(deleteUserHelpers.logDeleteError(user.id, err));
    }
  }, [fetchUsers, setError]);
};

export function useUsersApi(props: UseUsersApiProps): UseUsersApiReturn {
  const fetchLogger = createFetchLogger();
  const fetchUsers = useFetchUsers(props, fetchLogger);
  const createUser = useCreateUser(fetchUsers, props.setError);
  const updateUser = useUpdateUser(fetchUsers, props.setError);
  const deleteUser = useDeleteUser(fetchUsers, props.setError);

  return { fetchUsers, createUser, updateUser, deleteUser };
}