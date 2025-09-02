import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  autoHideDuration?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  showNotification: (message: string, severity?: Notification['severity']) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, severity: Notification['severity'] = 'info') => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      severity,
      autoHideDuration: severity === 'error' ? 6000 : 4000
    };
    setNotifications(prev => [...prev, notification]);
  }, []);

  const showSuccess = useCallback((message: string) => showNotification(message, 'success'), [showNotification]);
  const showError = useCallback((message: string) => showNotification(message, 'error'), [showNotification]);
  const hideNotification = useCallback((id: string) => setNotifications(prev => prev.filter(n => n.id !== id)), []);
  const clearAll = useCallback(() => setNotifications([]), []);

  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    hideNotification,
    clearAll
  };
}