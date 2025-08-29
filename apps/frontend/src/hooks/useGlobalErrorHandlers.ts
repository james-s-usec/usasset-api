import { useEffect } from 'react';

export interface UseGlobalErrorHandlersParams {
  addDebugMessage: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) => void;
}

export const useGlobalErrorHandlers = ({ addDebugMessage }: UseGlobalErrorHandlersParams): void => {
  
  useEffect(() => {
    // Global error handler for unhandled JavaScript errors
    const handleGlobalError = (event: ErrorEvent): void => {
      addDebugMessage('error', 'Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      addDebugMessage('error', 'Unhandled Promise Rejection', {
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        timestamp: new Date().toISOString()
      });
    };

    // Register global error handlers
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup function to remove event listeners
    return (): void => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addDebugMessage]);
};