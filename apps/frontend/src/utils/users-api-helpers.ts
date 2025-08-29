/**
 * Users API Helper Functions
 * Extracted from useUsersApi for CLAUDE.md compliance
 */

import { logger } from '../services/logger';
import { logHookCall, logApiCall } from '../utils/debug';
import type { UserData, UpdateUserRequest } from '../types/user';

export const createFetchLogger = (): { 
  logFetchStart: () => void; 
  logFetchSuccess: (count: number, correlationId?: string) => void; 
  logFetchError: (err: unknown) => string 
} => {
  const logFetchStart = (): void => {
    logHookCall('useUsers.fetchUsers', 'entry');
    logger.info('useUsers: Starting user fetch');
    logApiCall('GET', '/users', { page: 1, limit: 50 });
  };

  const logFetchSuccess = (count: number, correlationId?: string): void => {
    logger.info('useUsers: Users loaded successfully', { count, correlationId });
    logApiCall('GET', '/users', { page: 1, limit: 50, count, correlationId });
    logHookCall('useUsers.fetchUsers', 'exit', { usersCount: count });
  };

  const logFetchError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : 'Failed to fetch users';
    logger.error('useUsers: Failed to fetch users', { error: msg });
    logApiCall('GET', '/users', { page: 1, limit: 50 }, err);
    return msg;
  };

  return { logFetchStart, logFetchSuccess, logFetchError };
};

export const createUserLogger = {
  logCreateStart: (email: string): void => {
    logHookCall('useUsers.createUser', 'entry', { email: '***' });
    logger.info('useUsers: Creating new user', { email });
    logApiCall('POST', '/users', { email: '***' });
  },
  logCreateSuccess: (): void => {
    logger.info('useUsers: User created successfully');
    logApiCall('POST', '/users', { email: '***', success: true });
    logHookCall('useUsers.createUser', 'exit', { success: true });
  },
  logCreateError: (err: unknown): string => {
    const msg = err instanceof Error ? err.message : 'Failed to create user';
    logger.error('useUsers: Failed to create user', { error: msg });
    logApiCall('POST', '/users', { email: '***' }, err);
    return msg;
  }
};

export const updateUserLogger = {
  logUpdateStart: (userId: string, data: UpdateUserRequest): void => {
    logHookCall('useUsers.updateUser', 'entry', { userId });
    logger.info('useUsers: Updating user', { userId });
    logApiCall('PUT', `/users/${userId}`, data);
  },
  logUpdateSuccess: (userId: string, data: UpdateUserRequest): void => {
    logger.info('useUsers: User updated successfully');
    logApiCall('PUT', `/users/${userId}`, { ...data, success: true });
    logHookCall('useUsers.updateUser', 'exit', { userId, success: true });
  },
  logUpdateError: (userId: string, updateData: UpdateUserRequest, err: unknown): string => {
    const msg = err instanceof Error ? err.message : 'Failed to update user';
    logger.error('useUsers: Failed to update user', { error: msg });
    logApiCall('PUT', `/users/${userId}`, updateData, err);
    return msg;
  }
};

export const deleteUserHelpers = {
  confirmDelete: (user: UserData): boolean => {
    return window.confirm(`Delete user "${user.name || user.email}"?`);
  },
  logDeleteStart: (userId: string): void => {
    logger.info('useUsers: Deleting user', { userId });
    logApiCall('DELETE', `/users/${userId}`);
  },
  logDeleteSuccess: (userId: string): void => {
    logger.info('useUsers: User deleted successfully');
    logApiCall('DELETE', `/users/${userId}`, { success: true });
    logHookCall('useUsers.deleteUser', 'exit', { userId, success: true });
  },
  logDeleteError: (userId: string, err: unknown): string => {
    const msg = err instanceof Error ? err.message : 'Failed to delete user';
    logger.error('useUsers: Failed to delete user', { error: msg });
    logApiCall('DELETE', `/users/${userId}`, undefined, err);
    return msg;
  }
};