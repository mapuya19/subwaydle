import {
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
} from './localStorage';
import { PracticeMode } from './constants';

export type DisplaySettings = {
  showAnswerStatusBadges: boolean;
  darkMode: boolean;
};

export type PracticeSettings = {
  enabled: boolean;
  mode: PracticeMode | null;
};

export type GameSettings = {
  display: DisplaySettings;
  practice: PracticeSettings;
};

export const defaultSettings: GameSettings = {
  display: {
    showAnswerStatusBadges: false,
    darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  },
  practice: {
    enabled: false,
    mode: null,
  }
};

export const saveSettings = (gameSettings: GameSettings): void => {
  saveSettingsToLocalStorage(gameSettings);
};

export const loadSettings = (): GameSettings => {
  return loadSettingsFromLocalStorage() || defaultSettings;
};
