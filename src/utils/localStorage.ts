import { GameState } from './types';
import type { GameStats } from './stats';
import type { GameSettings } from './settings';

const GAME_STATE_KEY = 'gameState';
const GAME_STATS_KEY = 'gameStats';
const GAME_SETTINGS_KEY = 'gameSettings';

const isAvailable = (): boolean => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  return (
    typeof localStorage.getItem === 'function' &&
    typeof localStorage.setItem === 'function' &&
    typeof localStorage.removeItem === 'function'
  );
};

const safeGet = (key: string): string | null => {
  if (!isAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): boolean => {
  if (!isAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeRemove = (key: string): boolean => {
  if (!isAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const getGameStateKey = (practiceMode: string | null = null, practiceGameIndex: number | null = null): string => {
  if (practiceMode && practiceGameIndex !== null) {
    const index = Number(practiceGameIndex);
    if (!isNaN(index) && index >= 0) {
      return `${GAME_STATE_KEY}_${practiceMode}_${index}`;
    }
  }
  return GAME_STATE_KEY;
};

export type { GameState };

export const saveGameStateToLocalStorage = (gameState: GameState | null, practiceMode: string | null = null, practiceGameIndex: number | null = null): boolean => {
  if (!gameState) return false;
  const key = getGameStateKey(practiceMode, practiceGameIndex);
  try {
    return safeSet(key, JSON.stringify(gameState));
  } catch {
    return false;
  }
};

export const loadGameStateFromLocalStorage = (practiceMode: string | null = null, practiceGameIndex: number | null = null): GameState | null => {
  const key = getGameStateKey(practiceMode, practiceGameIndex);
  const state = safeGet(key);
  if (!state || !state.trim()) return null;
  
  try {
    return JSON.parse(state) as GameState;
  } catch {
    safeRemove(key);
    return null;
  }
};

export const saveStatsToLocalStorage = (gameStats: GameStats | null): boolean => {
  if (!gameStats) return false;
  try {
    return safeSet(GAME_STATS_KEY, JSON.stringify(gameStats));
  } catch {
    return false;
  }
};

export const loadStatsFromLocalStorage = (): GameStats | null => {
  const stats = safeGet(GAME_STATS_KEY);
  if (!stats || !stats.trim()) return null;
  
  try {
    return JSON.parse(stats) as GameStats;
  } catch {
    safeRemove(GAME_STATS_KEY);
    return null;
  }
};

export const isNewToGame = (practiceMode: string | null = null, practiceGameIndex: number | null = null): boolean => {
  const gameStateKey = getGameStateKey(practiceMode, practiceGameIndex);
  return safeGet(gameStateKey) === null && safeGet(GAME_STATS_KEY) === null;
};

export const saveSettingsToLocalStorage = (gameSettings: GameSettings | null): boolean => {
  if (!gameSettings) return false;
  try {
    return safeSet(GAME_SETTINGS_KEY, JSON.stringify(gameSettings));
  } catch {
    return false;
  }
};

export const loadSettingsFromLocalStorage = (): GameSettings | null => {
  const settings = safeGet(GAME_SETTINGS_KEY);
  if (!settings || !settings.trim()) return null;
  
  try {
    return JSON.parse(settings) as GameSettings;
  } catch {
    safeRemove(GAME_SETTINGS_KEY);
    return null;
  }
};
