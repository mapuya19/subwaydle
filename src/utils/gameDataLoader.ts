// Lazy loader for game data files to reduce initial bundle size
// Only loads the data files needed for the current game mode

import type { GameData, PracticeMode, RouteComboKey, Solution } from '../types/game';

let gameDataCache: GameData = {
  answers: null,
  solutions: null,
  routings: null,
  loading: false,
  loadPromise: null,
  currentMode: null,
};

const GAME_EPOCH = new Date('January 29, 2022 00:00:00').valueOf();
export const NIGHT_GAMES: readonly [number, number] = [350, 351];
export const ACCESSIBLE_GAME = 793;

// Staten Island Railway can only interchange with the rest of the subway network
// via the Staten Island Ferry (South Ferry, Whitehall St–South Ferry, Bowling Green).
const SIR_STOP_ID = 'S31';
const ALLOWED_SIR_TRANSFER_STOPS = new Set(['142', 'R27', '420']);

const comboToKey = (combo: RouteComboKey | string[]): string => (Array.isArray(combo) ? combo.join('-') : combo);
const keyToCombo = (key: string): string[] => key.split('-');

const comboIncludesRoute = (combo: RouteComboKey | string[], routeId: string): boolean => {
  const routes = Array.isArray(combo) ? combo : `${combo}`.split('-');
  return routes.includes(routeId);
};

const isValidSISolution = (solution: Solution): boolean => {
  if (!solution) {
    return false;
  }

  const transferPairs: Array<[string | undefined, string | undefined]> = [
    [solution.first_transfer_arrival, solution.first_transfer_departure],
    [solution.second_transfer_arrival, solution.second_transfer_departure],
  ];

  let hasSIPair = false;

  return transferPairs.every(([stopA, stopB]) => {
    if (stopA === SIR_STOP_ID || stopB === SIR_STOP_ID) {
      hasSIPair = true;
      const otherStop = stopA === SIR_STOP_ID ? stopB : stopA;
      return otherStop !== undefined && ALLOWED_SIR_TRANSFER_STOPS.has(otherStop);
    }
    return true;
  }) && hasSIPair;
};

const hasInvalidSIRoute = (comboKey: string, solution: Solution): boolean => {
  if (!comboIncludesRoute(comboKey, 'SI')) {
    return false;
  }

  if (!solution) {
    return true;
  }

  const candidateSolutions: Solution[] = Array.isArray(solution) ? solution : [solution];
  return !candidateSolutions.some(isValidSISolution);
};

export const removeDisconnectedRouteCombos = (answers: (string[] | string)[] = [], solutions: Record<string, Solution> = {}) => {
  const filteredSolutions = Object.entries(solutions).reduce((acc, [key, value]) => {
    if (!hasInvalidSIRoute(key, value)) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, Solution>);

  const filteredAnswers = answers
    .filter((combo) => {
      const key = comboToKey(combo);
      return filteredSolutions[key];
    })
    .map((combo) => (Array.isArray(combo) ? combo : keyToCombo(combo)));

  return {
    answers: filteredAnswers,
    solutions: filteredSolutions,
  };
};

const treatAsUTC = (date: Date): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
};

const daysBetween = (startDate: Date, endDate: Date): number => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return (treatAsUTC(endDate).getTime() - treatAsUTC(startDate).getTime()) / millisecondsPerDay;
};

export const todayGameIndex = (): number => {
  const now = Date.now();
  return Math.floor(daysBetween(new Date(GAME_EPOCH), new Date(now)));
};

const getGameMode = (practiceMode: PracticeMode = null): PracticeMode => {
  // If practice mode is enabled, use that mode
  if (practiceMode) {
    return practiceMode;
  }

  // Otherwise, use automatic detection
  const today = new Date();
  const index = todayGameIndex();
  const isWeekend = [0, 6].includes(today.getDay());
  const isNight = NIGHT_GAMES.includes(index);
  const isAccessible = index === ACCESSIBLE_GAME;

  if (isNight) return 'night';
  if (isAccessible) return 'accessible';
  if (isWeekend) return 'weekend';
  return 'weekday';
};

export const loadGameData = async (practiceMode: PracticeMode = null): Promise<GameData> => {
  const mode = getGameMode(practiceMode);

  // If mode changed, set loading first, then clear cache and cancel any existing load
  if (gameDataCache.currentMode !== mode) {
    gameDataCache.loading = true;
    gameDataCache.loadPromise = null;
    gameDataCache.answers = null;
    gameDataCache.solutions = null;
    gameDataCache.routings = null;
    gameDataCache.currentMode = mode;
  }

  if (gameDataCache.answers && gameDataCache.solutions && gameDataCache.routings) {
    gameDataCache.loading = false;
    return gameDataCache;
  }

  if (gameDataCache.loading && gameDataCache.loadPromise) {
    return gameDataCache.loadPromise;
  }

  gameDataCache.loading = true;

  gameDataCache.loadPromise = Promise.all([
    import(`../data/${mode}/answers.json`),
    import(`../data/${mode}/solutions.json`),
    import(`../data/${mode}/routings.json`),
  ])
    .then(([answersModule, solutionsModule, routingsModule]) => {
      const { answers, solutions } = removeDisconnectedRouteCombos(answersModule.default, solutionsModule.default);
      gameDataCache.answers = answers;
      gameDataCache.solutions = solutions;
      gameDataCache.routings = routingsModule.default;
      gameDataCache.loading = false;
      return gameDataCache;
    })
    .catch((error) => {
      gameDataCache.loading = false;
      gameDataCache.loadPromise = null;
      throw error;
    });

  return gameDataCache.loadPromise;
};

export const getGameData = (): GameData => {
  // Check if data is currently loading - this prevents access during mode transitions
  if (gameDataCache.loading) {
    throw new Error('Game data is currently loading. Please wait for loadGameData() to complete.');
  }

  // Check if data exists
  if (!gameDataCache.answers || !gameDataCache.solutions || !gameDataCache.routings) {
    throw new Error('Game data not loaded. Call loadGameData() first.');
  }

  return gameDataCache;
};

export const isGameDataLoaded = (): boolean => {
  return !!(gameDataCache.answers && gameDataCache.solutions && gameDataCache.routings);
};

export const isGameDataLoadedForMode = (practiceMode: PracticeMode = null): boolean => {
  const expectedMode = getGameMode(practiceMode);
  return isGameDataLoaded() && gameDataCache.currentMode === expectedMode && !gameDataCache.loading;
};

export const clearGameDataCache = (): void => {
  gameDataCache.answers = null;
  gameDataCache.solutions = null;
  gameDataCache.routings = null;
  gameDataCache.currentMode = null;
  gameDataCache.loading = false;
  gameDataCache.loadPromise = null;
};
