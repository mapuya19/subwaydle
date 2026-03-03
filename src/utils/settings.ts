import {
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
} from './localStorage';
import type { SettingsState } from '../types/data';

export interface GameSettings {
  display: {
    showAnswerStatusBadges: boolean;
    darkMode: boolean;
  };
  practice: {
    enabled: boolean;
    mode: 'weekday' | 'weekend' | 'night' | 'accessible' | null;
  };
}

export const defaultSettings: GameSettings = {
  display: {
    showAnswerStatusBadges: false,
    darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  },
  practice: {
    enabled: false,
    mode: null, // 'weekday', 'weekend', 'night', or 'accessible'
  },
};

export const saveSettings = (gameSettings: GameSettings): void => {
  saveSettingsToLocalStorage(gameSettings as SettingsState);
};

export const loadSettings = (): GameSettings => {
  return (loadSettingsFromLocalStorage() as GameSettings) || defaultSettings;
};
