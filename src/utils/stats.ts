import {
  loadStatsFromLocalStorage,
  saveStatsToLocalStorage,
} from './localStorage';

export type GameStats = {
  winDistribution: number[];
  gamesFailed: number;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  successRate: number;
};

export const addStatsForCompletedGame = (gameStats: GameStats, count: number): GameStats => {
  const stats = { ...gameStats };

  stats.totalGames += 1;

  if (count > 5) {
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

  saveStatsToLocalStorage(stats);
  return stats;
};

const defaultStats: GameStats = {
  winDistribution: [0, 0, 0, 0, 0, 0],
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
};

export const loadStats = (): GameStats => {
  return loadStatsFromLocalStorage() || defaultStats;
};

const getSuccessRate = (gameStats: GameStats): number => {
  const { totalGames, gamesFailed } = gameStats;

  return Math.round(
    (100 * (totalGames - gamesFailed)) / Math.max(totalGames, 1)
  );
};
