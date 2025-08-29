import React, { useState, useCallback, useEffect } from 'react';
import { SettingsContext, DEFAULT_SETTINGS, type AppSettings } from './settings-context';

interface SettingsProviderProps {
  children: React.ReactNode;
}

const loadSavedSettings = (): AppSettings => {
  const saved = localStorage.getItem('usasset-settings');
  if (!saved) return DEFAULT_SETTINGS;
  
  try {
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
};

const saveToStorage = (settings: AppSettings): void => {
  try {
    localStorage.setItem('usasset-settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settings-changed', { 
      detail: settings 
    }));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const SettingsProvider = ({ children }: SettingsProviderProps): React.ReactElement => {
  const [settings, setSettings] = useState<AppSettings>(loadSavedSettings);

  useEffect(() => {
    const handleChange = (e: CustomEvent): void => setSettings(e.detail);
    window.addEventListener('settings-changed', handleChange as EventListener);
    return (): void => window.removeEventListener('settings-changed', handleChange as EventListener);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>): void => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveToStorage(updated);
  }, [settings]);

  const resetSettings = useCallback((): void => {
    setSettings(DEFAULT_SETTINGS);
    saveToStorage(DEFAULT_SETTINGS);
  }, []);

  const value = { settings, updateSettings, resetSettings };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};