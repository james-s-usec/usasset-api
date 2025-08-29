/**
 * Users API Hook
 * Handles all API operations for users
 */

import { useCallback } from 'react';
import { userApiService } from '../services/user-api';
import { logger } from '../services/logger';
import { logHookCall, logApiCall } from '../utils/debug';
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

export function useUsersApi({
  setUsers,
  setLoading,
  setError
}: UseUsersApiProps): UseUsersApiReturn {

  const logFetchStart = () => {
    logHookCall('useUsers.fetchUsers', 'entry');
    logger.info('useUsers: Starting user fetch');
    logApiCall('GET', '/users', { page: 1, limit: 50 });
  };

  const logFetchSuccess = (count: number, correlationId?: string) => {
    logger.info('useUsers: Users loaded successfully', { count, correlationId });
    logApiCall('GET', '/users', { page: 1, limit: 50, count, correlationId });
    logHookCall('useUsers.fetchUsers', 'exit', { usersCount: count });
  };

  const logFetchError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Failed to fetch users';
    logger.error('useUsers: Failed to fetch users', { error: msg });
    logApiCall('GET', '/users', { page: 1, limit: 50 }, err);
    return msg;
  };

  const fetchUsers = useCallback(async () => {
    logFetchStart();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApiService.getUsers(1, 50);
      setUsers(response.data.users);
      
      logFetchSuccess(response.data.users.length, response.correlationId);
    } catch (err) {
      setError(logFetchError(err));
    } finally {
      setLoading(false);
    }
  }, [setUsers, setLoading, setError]);

  const logCreateStart = (email: string) => {
    logHookCall('useUsers.createUser', 'entry', { email: '***' });
    logger.info('useUsers: Creating new user', { email });
    logApiCall('POST', '/users', { email: '***' });
  };

  const logCreateSuccess = () => {
    logger.info('useUsers: User created successfully');
    logApiCall('POST', '/users', { email: '***', success: true });
    logHookCall('useUsers.createUser', 'exit', { success: true });
  };

  const createUser = useCallback(async (createData: CreateUserRequest) => {
    logCreateStart(createData.email);
    
    try {
      await userApiService.createUser(createData);
      logCreateSuccess();
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      setError(msg);
      logger.error('useUsers: Failed to create user', { error: msg });
      logApiCall('POST', '/users', { email: '***' }, err);
      throw err;
    }
  }, [fetchUsers, setError]);

  const logUpdateStart = (userId: string, data: UpdateUserRequest) => {
    logHookCall('useUsers.updateUser', 'entry', { userId });
    logger.info('useUsers: Updating user', { userId });
    logApiCall('PUT', `/users/${userId}`, data);
  };

  const logUpdateSuccess = (userId: string, data: UpdateUserRequest) => {
    logger.info('useUsers: User updated successfully');
    logApiCall('PUT', `/users/${userId}`, { ...data, success: true });
    logHookCall('useUsers.updateUser', 'exit', { userId, success: true });
  };

  const updateUser = useCallback(async (userId: string, updateData: UpdateUserRequest) => {
    logUpdateStart(userId, updateData);
    
    try {
      await userApiService.updateUser(userId, updateData);
      logUpdateSuccess(userId, updateData);
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      setError(msg);
      logger.error('useUsers: Failed to update user', { error: msg });
      logApiCall('PUT', `/users/${userId}`, updateData, err);
      throw err;
    }
  }, [fetchUsers, setError]);

  const confirmDelete = (user: UserData): boolean => {
    return window.confirm(`Delete user "${user.name || user.email}"?`);
  };

  const logDeleteStart = (userId: string) => {
    logger.info('useUsers: Deleting user', { userId });
    logApiCall('DELETE', `/users/${userId}`);
  };

  const logDeleteSuccess = (userId: string) => {
    logger.info('useUsers: User deleted successfully');
    logApiCall('DELETE', `/users/${userId}`, { success: true });
    logHookCall('useUsers.deleteUser', 'exit', { userId, success: true });
  };

  const deleteUser = useCallback(async (user: UserData) => {
    logHookCall('useUsers.deleteUser', 'entry', { userId: user.id });
    
    if (!confirmDelete(user)) {
      logHookCall('useUsers.deleteUser', 'exit', { cancelled: true });
      return;
    }

    try {
      logDeleteStart(user.id);
      await userApiService.deleteUser(user.id);
      logDeleteSuccess(user.id);
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user';
      setError(msg);
      logger.error('useUsers: Failed to delete user', { error: msg });
      logApiCall('DELETE', `/users/${user.id}`, undefined, err);
    }
  }, [fetchUsers, setError]);

  return {
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
}