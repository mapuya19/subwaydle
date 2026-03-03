/**
 * Data structure types
 */

import type { PracticeMode, RouteCombo, GameData, Solution } from './game';

export interface LoadedGameState {
  guesses: RouteCombo[];
  answer: string;
}

export interface Stats {
  played: number;
  win: number;
  streak: number;
  maxStreak: number;
  distribution: number[];
  // Also support legacy format for compatibility
  totalGames?: number;
  successRate?: number;
  currentStreak?: number;
  bestStreak?: number;
  gamesFailed?: number;
  winDistribution?: number[];
}

export interface SettingsState {
  display: {
    showAnswerStatusBadges: boolean;
    darkMode: boolean;
  };
  practice: {
    enabled: boolean;
    mode: PracticeMode | null;
  };
}

export interface TransferStation {
  [stopId: string]: string | string[];
}

export interface ShareConfig {
  guesses: RouteCombo[];
  isLoss: boolean;
  practiceMode?: PracticeMode;
  practiceGameIndex?: number;
}

export interface LocalStorageKey {
  GAME_STATE: string;
  STATS: string;
  SETTINGS: string;
  SEEN_TOAST: string;
  LAST_UPDATED: string;
}

export interface GameDataCache {
  answers: (string[] | string)[] | null;
  solutions: Record<string, Solution> | null;
  routings: Record<string, string[]> | null;
  loading: boolean;
  loadPromise: Promise<GameData> | null;
  currentMode: PracticeMode | null;
}
