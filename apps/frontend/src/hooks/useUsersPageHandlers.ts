/**
 * Users Page Handlers Hook
 * Handles user operations with debug logging
 */

import { useCallback } from 'react';
import type { UserData, CreateUserRequest, UpdateUserRequest } from '../types/user';

interface UseUsersPageHandlersProps {
  editingUser: UserData | null;
  formData: Partial<CreateUserRequest>;
  createUser: (data: CreateUserRequest) => Promise<UserData>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<UserData>;
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

export function useUsersPageHandlers(props: UseUsersPageHandlersProps): UseUsersPageHandlersReturn {
  const {
    editingUser, formData, createUser, updateUser, deleteUser,
    openEditDialog, closeDialog, logEvent, logCustom, startTiming, endTiming
  } = props;

  const handleSubmit = useCallback(async () => {
    const operation = editingUser ? 'update' : 'create';
    const timingMark = startTiming(`${operation}-user`);
    
    logEvent(`user-${operation}-form`, {
      editingUser: editingUser?.id,
      formData: Object.keys(formData)
    });

    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          name: formData.name || undefined,
          role: formData.role
        };
        await updateUser(editingUser.id, updateData);
        logCustom(`User ${editingUser.id} updated successfully`);
      } else {
        await createUser(formData as CreateUserRequest);
        logCustom('New user created successfully');
      }
      
      endTiming(timingMark, `${operation}-user-success`);
      closeDialog();
    } catch (error) {
      logCustom(`Failed to ${operation} user`, { error });
      endTiming(timingMark, `${operation}-user-error`);
    }
  }, [editingUser, formData, createUser, updateUser, closeDialog, logEvent, logCustom, startTiming, endTiming]);

  const handleEditDialog = useCallback((user: UserData) => {
    logEvent('edit-user-button', { userId: user.id });
    openEditDialog(user);
  }, [openEditDialog, logEvent]);

  const handleDeleteUser = useCallback(async (user: UserData) => {
    logEvent('delete-user-button', { userId: user.id });
    const timingMark = startTiming('delete-user');
    
    try {
      await deleteUser(user);
      logCustom(`Successfully deleted user ${user.id}`);
      endTiming(timingMark, 'delete-user-success');
    } catch (error) {
      logCustom(`Failed to delete user ${user.id}`, { error });
      endTiming(timingMark, 'delete-user-error');
    }
  }, [deleteUser, logEvent, logCustom, startTiming, endTiming]);

  const handleCreateNew = useCallback(() => {
    logEvent('create-user-button');
    logCustom('Opening create user dialog');
    // The actual dialog opening is handled by parent
  }, [logEvent, logCustom]);

  const handleCloseDialog = useCallback(() => {
    logEvent('close-dialog');
    closeDialog();
  }, [closeDialog, logEvent]);

  return {
    handleSubmit,
    handleEditDialog,
    handleDeleteUser,
    handleCreateNew,
    handleCloseDialog
  };
}