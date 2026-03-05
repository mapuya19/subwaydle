import { createContext, useContext, useState, useMemo } from 'react';
import { loadSettings, saveSettings, GameSettings } from '../utils/settings';
import { isNight, todayGameIndex, NIGHT_GAMES } from '../utils/answerValidations';

interface SettingsContextValue {
  settings: GameSettings;
  setSettings: (settings: GameSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());

  const updateSettings = (newSettings: GameSettings) => {
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

export const useDarkMode = (practiceMode: string | null = null): boolean => {
  const { settings } = useSettings();
  return useMemo(() => {
    const currentIsNight = isNight(practiceMode);
    return currentIsNight || (todayGameIndex() > Math.max(...NIGHT_GAMES) && settings.display.darkMode);
  }, [settings.display.darkMode, practiceMode]);
};
