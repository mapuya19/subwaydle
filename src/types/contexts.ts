/**
 * Context types
 */

import type { PracticeMode, RouteCombo, RouteId, SimilarRouteIndexes } from './game';
import type { Stats as DataStats } from './data';

export interface SettingsState {
  display: {
    showAnswerStatusBadges: boolean;
    darkMode: boolean;
  };
  practice: {
    enabled: boolean;
    mode: PracticeMode;
  };
}

export interface SettingsContextValue {
  settings: SettingsState;
  setSettings: (settings: SettingsState) => void;
}

export interface GameContextValue {
  guesses: RouteCombo[];
  currentGuess: string[];
  isGameWon: boolean;
  isGameLost: boolean;
  correctRoutes: RouteId[];
  similarRoutes: RouteId[];
  presentRoutes: RouteId[];
  absentRoutes: RouteId[];
  similarRoutesIndexes: SimilarRouteIndexes;
  setGuesses: (guesses: RouteCombo[]) => void;
  setCurrentGuess: (guess: string[]) => void;
  setIsGameWon: (won: boolean) => void;
  setIsGameLost: (lost: boolean) => void;
  setCorrectRoutes: (routes: RouteId[]) => void;
  setSimilarRoutes: (routes: RouteId[]) => void;
  setPresentRoutes: (routes: RouteId[]) => void;
  setAbsentRoutes: (routes: RouteId[]) => void;
  setSimilarRoutesIndexes: (indexes: SimilarRouteIndexes) => void;
}

export interface StatsContextValue {
  stats: DataStats;
  setStats: React.Dispatch<React.SetStateAction<DataStats>>;
}
