import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { Notification } from '../hooks/useNotifications';

interface NotificationSnackbarProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export function NotificationSnackbar({ notifications, onClose }: NotificationSnackbarProps): React.ReactElement | null {
  // Show only the most recent notification
  const currentNotification = notifications[notifications.length - 1];

  if (!currentNotification) {
    return null;
  }

  return (
    <Snackbar
      open={true}
      autoHideDuration={currentNotification.autoHideDuration}
      onClose={() => onClose(currentNotification.id)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => onClose(currentNotification.id)}
        severity={currentNotification.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
}