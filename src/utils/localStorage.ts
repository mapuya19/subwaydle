/**
 * localStorage utility functions with error handling for unavailable storage.
 */

import type { PracticeMode } from '../types/game';
import type { LoadedGameState, Stats, SettingsState } from '../types/data';

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
  } catch (error) {
    return null;
  }
};

const safeSet = (key: string, value: string): boolean => {
  if (!isAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
};

const safeRemove = (key: string): boolean => {
  if (!isAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
};

const getGameStateKey = (
  practiceMode: PracticeMode = null,
  practiceGameIndex: number | null = null
): string => {
  if (practiceMode && practiceGameIndex !== null) {
    const index = Number(practiceGameIndex);
    if (!isNaN(index) && index >= 0) {
      return `${GAME_STATE_KEY}_${practiceMode}_${index}`;
    }
  }
  return GAME_STATE_KEY;
};

export const saveGameStateToLocalStorage = (
  gameState: LoadedGameState,
  practiceMode: PracticeMode = null,
  practiceGameIndex: number | null = null
): boolean => {
  if (!gameState) return false;
  const key = getGameStateKey(practiceMode, practiceGameIndex);
  try {
    return safeSet(key, JSON.stringify(gameState));
  } catch (error) {
    return false;
  }
};

export const loadGameStateFromLocalStorage = (
  practiceMode: PracticeMode = null,
  practiceGameIndex: number | null = null
): LoadedGameState | null => {
  const key = getGameStateKey(practiceMode, practiceGameIndex);
  const state = safeGet(key);
  if (!state || !state.trim()) return null;

  try {
    return JSON.parse(state) as LoadedGameState;
  } catch (error) {
    safeRemove(key);
    return null;
  }
};

export const saveStatsToLocalStorage = (gameStats: Stats): boolean => {
  if (!gameStats) return false;
  try {
    return safeSet(GAME_STATS_KEY, JSON.stringify(gameStats));
  } catch (error) {
    return false;
  }
};

export const loadStatsFromLocalStorage = (): Stats | null => {
  const stats = safeGet(GAME_STATS_KEY);
  if (!stats || !stats.trim()) return null;

  try {
    return JSON.parse(stats) as Stats;
  } catch (error) {
    safeRemove(GAME_STATS_KEY);
    return null;
  }
};

export const isNewToGame = (
  practiceMode: PracticeMode = null,
  practiceGameIndex: number | null = null
): boolean => {
  const gameStateKey = getGameStateKey(practiceMode, practiceGameIndex);
  return safeGet(gameStateKey) === null && safeGet(GAME_STATS_KEY) === null;
};

export const saveSettingsToLocalStorage = (gameSettings: SettingsState): boolean => {
  if (!gameSettings) return false;
  try {
    return safeSet(GAME_SETTINGS_KEY, JSON.stringify(gameSettings));
  } catch (error) {
    return false;
  }
};

export const loadSettingsFromLocalStorage = (): SettingsState | null => {
  const settings = safeGet(GAME_SETTINGS_KEY);
  if (!settings || !settings.trim()) return null;

  try {
    return JSON.parse(settings) as SettingsState;
  } catch (error) {
    safeRemove(GAME_SETTINGS_KEY);
    return null;
  }
};
