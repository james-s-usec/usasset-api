/**
 * Users Page Component
 * Main page for user management - simplified composition
 */

import React from 'react';
import { Box } from '@mui/material';
import { useUsers } from '../hooks/useUsers';
import { useUserDialog } from '../hooks/useUserDialog';
import { useDebugComponent } from '../hooks/useDebugComponent';
import { useUsersPageHandlers } from '../hooks/useUsersPageHandlers';
import { useNotifications } from '../hooks/useNotifications';
import { UsersPageHeader } from '../components/UsersPageHeader';
import { UsersPageContent } from '../components/UsersPageContent';
import { UserDialog } from '../components/UserDialog';
import { NotificationSnackbar } from '../components/NotificationSnackbar';

export function UsersPage(): React.ReactElement {
  const debug = useDebugComponent({ name: 'UsersPage', trackRenders: true, trackPerformance: true });
  const users = useUsers();
  const dialog = useUserDialog();
  const notifications = useNotifications();
  const handlers = useUsersPageHandlers({ ...dialog, ...users, ...debug, ...notifications, deleteUser: users.deleteUser });

  return (
    <Box sx={{ p: 4 }}>
      <UsersPageHeader onAdd={() => { handlers.handleCreateNew(); dialog.openCreateDialog(); }} />
      <UsersPageContent
        users={users.users} loading={users.loading} error={users.error}
        onEdit={handlers.handleEditDialog} onDelete={handlers.handleDeleteUser}
        onClearError={users.clearError}
      />
      <UserDialog
        open={dialog.dialogOpen} editingUser={dialog.editingUser}
        formData={dialog.formData} onClose={handlers.handleCloseDialog}
        onSubmit={handlers.handleSubmit} onFormChange={dialog.updateFormData}
        isValid={dialog.isFormValid}
      />
      <NotificationSnackbar
        notifications={notifications.notifications}
        onClose={notifications.hideNotification}
      />
    </Box>
  );
}