import {
  loadStatsFromLocalStorage,
  saveStatsToLocalStorage,
} from './localStorage';
import type { Stats } from '../types/data';

export interface GameStats {
  winDistribution: number[];
  gamesFailed: number;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  successRate: number;
}

// In stats array elements 0-5 are successes in 1-6 tries
export const addStatsForCompletedGame = (gameStats: GameStats, count: number): GameStats => {
  // Count is number of incorrect guesses before end.
  const stats = { ...gameStats };

  stats.totalGames += 1;

  if (count > 5) {
    // A fail situation
    stats.currentStreak = 0;
    stats.gamesFailed += 1;
  } else {
    stats.winDistribution[count] += 1;
    stats.currentStreak += 1;

    if (stats.bestStreak < stats.currentStreak) {
      stats.bestStreak = stats.currentStreak;
    }
  }

  stats.successRate = getSuccessRate(stats);

  saveStatsToLocalStorage(stats as Stats);
  return stats;
};

export const loadStats = (): Stats => {
  const loadedStats = loadStatsFromLocalStorage() as Stats;
  
  // If loaded stats exist, use them. Otherwise, create default Stats with the GameStats format
  if (loadedStats) {
    return loadedStats;
  }
  
  // Return default stats in Stats format (matches what GameStats provides)
  return {
    totalGames: 0,
    successRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    // Additional fields for GameStats format
    gamesFailed: 0,
    winDistribution: [0, 0, 0, 0, 0, 0],
    played: 0,
    win: 0,
    streak: 0,
    maxStreak: 0,
  };
};

const getSuccessRate = (gameStats: GameStats): number => {
  const { totalGames, gamesFailed } = gameStats;

  return Math.round((100 * (totalGames - gamesFailed)) / Math.max(totalGames, 1));
};
