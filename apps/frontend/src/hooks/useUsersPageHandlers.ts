/**
 * Users Page Handlers Hook
 * Handles user operations with debug logging
 */

import { useCallback } from 'react';
import { 
  createSubmitLogger, 
  createUpdateHandler, 
  createCreateHandler, 
  createDeleteHandler,
  createDialogHandlers 
} from '../utils/users-page-helpers';
import type { UserData, CreateUserRequest, UpdateUserRequest } from '../types/user';

interface UseUsersPageHandlersProps {
  editingUser: UserData | null;
  formData: Partial<CreateUserRequest>;
  createUser: (data: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  deleteUser: (user: UserData) => Promise<void>;
  openEditDialog: (user: UserData) => void;
  closeDialog: () => void;
  logEvent: (event: string, data?: unknown) => void;
  logCustom: (message: string, data?: unknown) => void;
  startTiming: (name: string) => string | undefined;
  endTiming: (mark?: string, name?: string) => void;
  showSuccess?: (message: string) => void;
  showError?: (message: string) => void;
}

interface UseUsersPageHandlersReturn {
  handleSubmit: () => Promise<void>;
  handleEditDialog: (user: UserData) => void;
  handleDeleteUser: (user: UserData) => Promise<void>;
  handleCreateNew: () => void;
  handleCloseDialog: () => void;
}

const useHandlersSetup = (props: UseUsersPageHandlersProps): {
  logSubmitStart: ReturnType<typeof createSubmitLogger>;
  handleUpdate: ReturnType<typeof createUpdateHandler>;
  handleCreate: ReturnType<typeof createCreateHandler>;
  dialogHandlers: ReturnType<typeof createDialogHandlers>;
} => {
  const { formData, updateUser, createUser, openEditDialog, closeDialog, logEvent, logCustom, endTiming } = props;
  
  const logSubmitStart = createSubmitLogger(logEvent, formData);
  const handleUpdate = createUpdateHandler(updateUser, logCustom, endTiming, formData);
  const handleCreate = createCreateHandler(createUser, logCustom, endTiming, formData);
  const dialogHandlers = createDialogHandlers(openEditDialog, closeDialog, logEvent, logCustom);
  
  return { logSubmitStart, handleUpdate, handleCreate, dialogHandlers };
};

const createUserHandlers = (
  handleUpdate: ReturnType<typeof createUpdateHandler>, 
  handleCreate: ReturnType<typeof createCreateHandler>, 
  showSuccess?: (message: string) => void
): {
  handleUpdateUser: (user: UserData, mark?: string) => Promise<void>;
  handleCreateUser: (mark?: string) => Promise<void>;
} => ({
  handleUpdateUser: async (user: UserData, mark?: string): Promise<void> => {
    await handleUpdate(user, mark);
    showSuccess?.(`User "${user.name || user.email}" updated successfully`);
  },
  handleCreateUser: async (mark?: string): Promise<void> => {
    await handleCreate(mark);
    showSuccess?.('User created successfully');
  }
});

const useSubmitHandler = (props: UseUsersPageHandlersProps, handlers: ReturnType<typeof useHandlersSetup>): (() => Promise<void>) => {
  const { editingUser, closeDialog, logCustom, startTiming, endTiming, showSuccess, showError } = props;
  const { logSubmitStart, handleUpdate, handleCreate } = handlers;
  const { handleUpdateUser, handleCreateUser } = createUserHandlers(handleUpdate, handleCreate, showSuccess);
  
  return useCallback(async (): Promise<void> => {
    const operation = editingUser ? 'update' : 'create';
    const mark = startTiming(`${operation}-user`);
    logSubmitStart(operation, editingUser?.id);

    try {
      if (editingUser) {
        await handleUpdateUser(editingUser, mark);
      } else {
        await handleCreateUser(mark);
      }
      closeDialog();
    } catch (error) {
      logCustom(`Failed to ${operation} user`, { error });
      showError?.(`Failed to ${operation} user`);
      endTiming(mark, `${operation}-user-error`);
    }
  }, [editingUser, closeDialog, logCustom, startTiming, endTiming, showError, handleUpdateUser, handleCreateUser, logSubmitStart]);
};

export function useUsersPageHandlers(props: UseUsersPageHandlersProps): UseUsersPageHandlersReturn {
  const { deleteUser, logEvent, logCustom, startTiming, endTiming, showSuccess, showError } = props;
  
  const handlers = useHandlersSetup(props);
  const handleSubmit = useSubmitHandler(props, handlers);

  const handleDeleteUser = useCallback(async (user: UserData): Promise<void> => {
    const deleteHandler = createDeleteHandler(deleteUser, { logEvent, logCustom, startTiming, endTiming });
    try {
      await deleteHandler(user);
      showSuccess?.(`User "${user.name || user.email}" deleted successfully`);
    } catch (error) {
      showError?.('Failed to delete user');
      throw error; // Re-throw to maintain existing error handling
    }
  }, [deleteUser, logEvent, logCustom, startTiming, endTiming, showSuccess, showError]);

  return {
    handleSubmit,
    handleEditDialog: handlers.dialogHandlers.handleEditDialog,
    handleDeleteUser,
    handleCreateNew: handlers.dialogHandlers.handleCreateNew,
    handleCloseDialog: handlers.dialogHandlers.handleCloseDialog
  };
}