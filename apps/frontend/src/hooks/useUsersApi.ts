/**
 * Users API Hook
 * Handles all API operations for users
 */

import { useCallback, useRef } from 'react';
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

// Custom hook for managing abort controller
const useAbortController = (): {
  cancelPreviousRequest: () => void;
  createNewController: () => AbortController;
} => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPreviousRequest = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const createNewController = useCallback((): AbortController => {
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  return { cancelPreviousRequest, createNewController };
};

// Custom hook for handling fetch response states
const useFetchResponseHandlers = (
  setUsers: (users: UserData[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  fetchLogger: ReturnType<typeof createFetchLogger>
): {
  handleSuccess: (response: { data: { users: UserData[]; }; correlationId: string; }, controller: AbortController) => void;
  handleError: (err: unknown, controller: AbortController) => void;
  handleFinally: (controller: AbortController) => void;
} => {
  const handleSuccess = useCallback((response: { data: { users: UserData[]; }; correlationId: string; }, controller: AbortController): void => {
    if (!controller.signal.aborted) {
      setUsers(response.data.users);
      fetchLogger.logFetchSuccess(response.data.users.length, response.correlationId);
    }
  }, [setUsers, fetchLogger]);

  const handleError = useCallback((err: unknown, controller: AbortController): void => {
    if (!controller.signal.aborted) {
      setError(fetchLogger.logFetchError(err));
    }
  }, [setError, fetchLogger]);

  const handleFinally = useCallback((controller: AbortController): void => {
    if (!controller.signal.aborted) {
      setLoading(false);
    }
  }, [setLoading]);

  return { handleSuccess, handleError, handleFinally };
};

const useFetchUsers = (props: UseUsersApiProps, fetchLogger: ReturnType<typeof createFetchLogger>): (() => Promise<void>) => {
  const { setUsers, setLoading, setError } = props;
  const { cancelPreviousRequest, createNewController } = useAbortController();
  const { handleSuccess, handleError, handleFinally } = useFetchResponseHandlers(
    setUsers,
    setLoading, 
    setError,
    fetchLogger
  );
  
  return useCallback(async (): Promise<void> => {
    cancelPreviousRequest();
    const controller = createNewController();
    
    fetchLogger.logFetchStart();
    setLoading(true);
    setError(null);
    
    try {
      const response = await userApiService.getUsers(1, 50);
      handleSuccess(response, controller);
    } catch (err) {
      handleError(err, controller);
    } finally {
      handleFinally(controller);
    }
  }, [cancelPreviousRequest, createNewController, fetchLogger, setLoading, setError, handleSuccess, handleError, handleFinally]);
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