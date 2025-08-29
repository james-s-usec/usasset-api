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

const useSubmitHandler = (
  props: UseUsersPageHandlersProps,
  handlers: ReturnType<typeof useHandlersSetup>
): (() => Promise<void>) => {
  const { editingUser, closeDialog, logCustom, startTiming, endTiming } = props;
  const { logSubmitStart, handleUpdate, handleCreate } = handlers;
  
  return useCallback(async (): Promise<void> => {
    const operation = editingUser ? 'update' : 'create';
    const mark = startTiming(`${operation}-user`);
    
    logSubmitStart(operation, editingUser?.id);

    try {
      if (editingUser) {
        await handleUpdate(editingUser, mark);
      } else {
        await handleCreate(mark);
      }
      closeDialog();
    } catch (error) {
      logCustom(`Failed to ${operation} user`, { error });
      endTiming(mark, `${operation}-user-error`);
    }
  }, [editingUser, closeDialog, logCustom, startTiming, endTiming, handleCreate, handleUpdate, logSubmitStart]);
};

export function useUsersPageHandlers(props: UseUsersPageHandlersProps): UseUsersPageHandlersReturn {
  const { deleteUser, logEvent, logCustom, startTiming, endTiming } = props;
  
  const handlers = useHandlersSetup(props);
  const handleSubmit = useSubmitHandler(props, handlers);

  const handleDeleteUser = useCallback(async (user: UserData): Promise<void> => {
    const deleteHandler = createDeleteHandler(deleteUser, { logEvent, logCustom, startTiming, endTiming });
    return await deleteHandler(user);
  }, [deleteUser, logEvent, logCustom, startTiming, endTiming]);

  return {
    handleSubmit,
    handleEditDialog: handlers.dialogHandlers.handleEditDialog,
    handleDeleteUser,
    handleCreateNew: handlers.dialogHandlers.handleCreateNew,
    handleCloseDialog: handlers.dialogHandlers.handleCloseDialog
  };
}