import { createContext, useContext, useState, useMemo } from 'react';
import { loadSettings, saveSettings } from '../utils/settings';
import { isNight, todayGameIndex, NIGHT_GAMES } from '../utils/answerValidations';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => loadSettings());

  const updateSettings = (newSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  const value = {
    settings,
    setSettings: updateSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

/**
 * Hook to get isDarkMode based on settings and practice mode
 * @param {string} practiceMode - Current practice mode
 * @returns {boolean} - Whether dark mode is active
 */
export const useDarkMode = (practiceMode = null) => {
  const { settings } = useSettings();
  return useMemo(() => {
    const currentIsNight = isNight(practiceMode);
    return currentIsNight || (todayGameIndex() > Math.max(...NIGHT_GAMES) && settings.display.darkMode);
  }, [settings.display.darkMode, practiceMode]);
};

