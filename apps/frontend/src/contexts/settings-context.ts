import { createContext } from 'react';

export interface AppSettings {
  debugConsole: boolean;
  autoRefresh: boolean;
  maxDebugMessages: number;
}

export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const DEFAULT_SETTINGS: AppSettings = {
  debugConsole: true,
  autoRefresh: false,
  maxDebugMessages: 50
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);