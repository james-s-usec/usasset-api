// Separate file for useDebug hook to satisfy react-refresh/only-export-components
import { useContext } from 'react';
import { DebugContext, type DebugContextType } from '../contexts/debug-context';

export const useDebug = (): DebugContextType => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within DebugProvider');
  }
  return context;
};