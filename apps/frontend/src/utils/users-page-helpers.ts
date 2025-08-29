/**
 * Users Page Helper Functions
 * Extracted from useUsersPageHandlers for CLAUDE.md compliance
 */

import type { UserData, CreateUserRequest, UpdateUserRequest } from '../types/user';

interface OperationLoggers {
  logEvent: (event: string, data?: unknown) => void;
  logCustom: (message: string, data?: unknown) => void;
  startTiming: (name: string) => string | undefined;
  endTiming: (mark?: string, name?: string) => void;
}

export const createSubmitLogger = (
  logEvent: (event: string, data?: unknown) => void,
  formData: Partial<CreateUserRequest>
): ((operation: string, userId?: string) => void) => {
  return (operation: string, userId?: string): void => {
    logEvent(`user-${operation}-form`, {
      editingUser: userId,
      formData: Object.keys(formData)
    });
  };
};

export const createUpdateHandler = (
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>,
  logCustom: (message: string, data?: unknown) => void,
  endTiming: (mark?: string, name?: string) => void,
  formData: Partial<CreateUserRequest>
): ((user: UserData, mark?: string) => Promise<void>) => {
  return async (user: UserData, mark?: string): Promise<void> => {
    const updateData: UpdateUserRequest = {
      name: formData.name || undefined,
      role: formData.role
    };
    await updateUser(user.id, updateData);
    logCustom(`User ${user.id} updated successfully`);
    endTiming(mark, 'update-user-success');
  };
};

export const createCreateHandler = (
  createUser: (data: CreateUserRequest) => Promise<void>,
  logCustom: (message: string, data?: unknown) => void,
  endTiming: (mark?: string, name?: string) => void,
  formData: Partial<CreateUserRequest>
): ((mark?: string) => Promise<void>) => {
  return async (mark?: string): Promise<void> => {
    await createUser(formData as CreateUserRequest);
    logCustom('New user created successfully');
    endTiming(mark, 'create-user-success');
  };
};

export const createDeleteHandler = (
  deleteUser: (user: UserData) => Promise<void>,
  loggers: OperationLoggers
): ((user: UserData) => Promise<void>) => {
  return async (user: UserData): Promise<void> => {
    loggers.logEvent('delete-user-button', { userId: user.id });
    const mark = loggers.startTiming('delete-user');
    
    try {
      await deleteUser(user);
      loggers.logCustom(`Successfully deleted user ${user.id}`);
      loggers.endTiming(mark, 'delete-user-success');
    } catch (error) {
      loggers.logCustom(`Failed to delete user ${user.id}`, { error });
      loggers.endTiming(mark, 'delete-user-error');
    }
  };
};

export const createDialogHandlers = (
  openEditDialog: (user: UserData) => void,
  closeDialog: () => void,
  logEvent: (event: string, data?: unknown) => void,
  logCustom: (message: string, data?: unknown) => void
): {
  handleEditDialog: (user: UserData) => void;
  handleCreateNew: () => void;
  handleCloseDialog: () => void;
} => ({
  handleEditDialog: (user: UserData): void => {
    logEvent('edit-user-button', { userId: user.id });
    openEditDialog(user);
  },
  handleCreateNew: (): void => {
    logEvent('create-user-button');
    logCustom('Opening create user dialog');
  },
  handleCloseDialog: (): void => {
    logEvent('close-dialog');
    closeDialog();
  }
});