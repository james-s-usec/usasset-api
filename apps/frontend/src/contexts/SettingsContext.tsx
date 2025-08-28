import React, { useState, useCallback, useEffect } from 'react';
import { SettingsContext, DEFAULT_SETTINGS, type AppSettings } from './settings-context';

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('usasset-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Listen for settings changes from other tabs/windows
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      setSettings(event.detail);
    };

    window.addEventListener('settings-changed', handleSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange as EventListener);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem('usasset-settings', JSON.stringify(updatedSettings));
      
      // Notify other components/tabs
      window.dispatchEvent(new CustomEvent('settings-changed', { 
        detail: updatedSettings 
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    
    try {
      localStorage.setItem('usasset-settings', JSON.stringify(DEFAULT_SETTINGS));
      
      // Notify other components/tabs
      window.dispatchEvent(new CustomEvent('settings-changed', { 
        detail: DEFAULT_SETTINGS 
      }));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }, []);

  const value = {
    settings,
    updateSettings,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};