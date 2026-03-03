import { createContext, useContext, useState, useMemo } from 'react';
import { loadSettings, saveSettings } from '../utils/settings';
import { isNight, todayGameIndex, NIGHT_GAMES } from '../utils/answerValidations';
import type { PracticeMode } from '../types/game';
import type { SettingsContextValue } from '../types/contexts';

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState(() => loadSettings());

  const updateSettings = (newSettings: typeof settings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  const value: SettingsContextValue = {
    settings,
    setSettings: updateSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

/**
 * Hook to get isDarkMode based on settings and practice mode
 * @param practiceMode - Current practice mode
 * @returns Whether dark mode is active
 */
export const useDarkMode = (practiceMode: PracticeMode = null): boolean => {
  const { settings } = useSettings();
  return useMemo(() => {
    const currentIsNight = isNight(practiceMode);
    return currentIsNight || (todayGameIndex() > Math.max(...NIGHT_GAMES) && settings.display.darkMode);
  }, [settings.display.darkMode, practiceMode]);
};
