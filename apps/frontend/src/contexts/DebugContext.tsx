import React, { useEffect } from 'react';
import { DebugContext } from './debug-context';
import { useDebugMessages } from '../hooks/useDebugMessages';
import { useDebugDatabase } from '../hooks/useDebugDatabase';
import { useDebugErrorHandlers } from '../hooks/useDebugErrorHandlers';

interface DebugProviderProps {
  children: React.ReactNode;
}

export const DebugProvider = ({ children }: DebugProviderProps): React.ReactElement => {
  const messages = useDebugMessages();
  const database = useDebugDatabase();
  const errorHandlers = useDebugErrorHandlers(messages.addMessage);

  useEffect(() => {
    errorHandlers.attachHandlers();
    return errorHandlers.detachHandlers;
  }, [errorHandlers]);

  const value = {
    messages: messages.messages,
    addMessage: messages.addMessage,
    clearMessages: messages.clearMessages,
    clearDatabaseLogs: database.clearDatabaseLogs,
    copyAllDebugInfo: database.copyAllDebugInfo,
    refreshMessages: database.refreshFromDatabase
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};