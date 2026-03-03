import transfers from './../data/transfers.json';
import routes from './../data/routes.json';
import { getGameData, todayGameIndex, NIGHT_GAMES, ACCESSIBLE_GAME } from './gameDataLoader';
import type { RouteCombo, PracticeMode, RouteId, GuessStatus, SimilarRouteIndexes, Solution } from '../types/game';

const ROUTES_WITH_NO_WEEKEND_SERVICE: RouteId[] = ['B', 'W'];
const ROUTES_WITH_NO_NIGHT_SERVICE: RouteId[] = ['B', 'C', 'W', 'GS'];
const DEKALB_AV_FLATBUSH_STOP = 'R30';

const isSimilarToAnswerTrain = (
  guess: string,
  index: number,
  practiceMode: PracticeMode = null,
  practiceGameIndex: number | null = null
): boolean => {
  let begin: string;
  let end: string;
  const answer = todaysTrip(practiceMode, practiceGameIndex)[index];
  const solution = todaysSolution(practiceMode, practiceGameIndex);
  const routings = todaysRoutings();

  switch (index) {
    case 0:
      begin = solution.origin;
      end = solution.first_transfer_arrival!;
      break;
    case 1:
      begin = solution.first_transfer_departure!;
      end = solution.second_transfer_arrival!;
      break;
    default:
      begin = solution.second_transfer_departure!;
      end = solution.destination;
  }

  const guessSubrouting = retrieveSubrouting(guess, routings, begin, end);

  if (!guessSubrouting) {
    return false;
  }

  const answerSubrouting = retrieveSubrouting(answer, routings, begin, end);

  if (!answerSubrouting) {
    return false;
  }

  const guessSubroutingInner = guessSubrouting.slice(1, guessSubrouting.length).filter((s) => s !== DEKALB_AV_FLATBUSH_STOP);
  const answerSubroutingInner = answerSubrouting.slice(1, answerSubrouting.length).filter((s) => s !== DEKALB_AV_FLATBUSH_STOP);

  if (guessSubroutingInner.every((s) => answerSubroutingInner.includes(s)) || answerSubroutingInner.every((s) => guessSubroutingInner.includes(s))) {
    return (guessSubrouting.includes(begin) && answerSubrouting.includes(begin)) || (guessSubrouting.includes(end) && answerSubrouting.includes(end));
  }

  return false;
};

const retrieveSubrouting = (
  train: string,
  routings: Record<string, string[]>,
  begin: string,
  end: string
): string[] | undefined => {
  let trainLookup: string;
  if (train === 'A') {
    if (routings['A1'].includes(begin) && routings['A1'].includes(end)) {
      trainLookup = 'A1';
    } else {
      trainLookup = 'A2';
    }
  } else {
    trainLookup = train;
  }

  const beginIndex = [begin, transfers[begin]]
    .flat()
    .filter((n): n is string => !!n)
    .map((s) => routings[trainLookup].indexOf(s))
    .find((i) => i > -1);
  const endIndex = [end, transfers[end]]
    .flat()
    .filter((n): n is string => !!n)
    .map((s) => routings[trainLookup].indexOf(s))
    .find((i) => i > -1);

  if (beginIndex == null || endIndex == null) {
    return;
  }

  if (beginIndex < endIndex) {
    return routings[trainLookup].slice(beginIndex, endIndex + 1);
  }
  return routings[trainLookup].slice(endIndex, beginIndex + 1);
};

// Re-export from gameDataLoader for backwards compatibility
export { todayGameIndex, NIGHT_GAMES, ACCESSIBLE_GAME };

const getGameModeFlags = (practiceMode: PracticeMode = null) => {
  // If practice mode is enabled, derive flags from the mode
  if (practiceMode) {
    return {
      isNight: practiceMode === 'night',
      isAccessible: practiceMode === 'accessible',
      isWeekend: practiceMode === 'weekend',
    };
  }

  // Otherwise, use automatic detection
  const today = new Date();
  const index = todayGameIndex();
  return {
    isNight: NIGHT_GAMES.includes(index),
    isAccessible: index === ACCESSIBLE_GAME,
    isWeekend: [0, 6].includes(today.getDay()),
  };
};

export const routesWithNoService = (practiceMode: PracticeMode = null): RouteId[] => {
  const { isNight, isWeekend: isWeekendFlag } = getGameModeFlags(practiceMode);
  if (isNight) {
    return ROUTES_WITH_NO_NIGHT_SERVICE;
  }
  if (isWeekendFlag) {
    return ROUTES_WITH_NO_WEEKEND_SERVICE;
  }
  return [];
};

export const isValidGuess = (guess: RouteCombo): boolean => {
  const { solutions } = getGameData();
  if (!solutions) return false;
  const flattenedGuess = guess.join('-');
  return !!solutions[flattenedGuess];
};

export const isNight = (practiceMode: PracticeMode = null): boolean => getGameModeFlags(practiceMode).isNight;
export const isAccessible = (practiceMode: PracticeMode = null): boolean => getGameModeFlags(practiceMode).isAccessible;
export const isWeekend = (practiceMode: PracticeMode = null): boolean => getGameModeFlags(practiceMode).isWeekend;

const todaysRoutings = (): Record<string, string[]> => {
  const { routings } = getGameData();
  if (!routings) return {};
  return routings;
};

export const todaysTrip = (practiceMode: PracticeMode = null, practiceGameIndex: number | null = null): RouteCombo => {
  const data = getGameData();
  const answers = data.answers as unknown as (string[] | string)[];
  if (!answers || answers.length === 0) {
    throw new Error('Game data not loaded');
  }
  let index: number;
  if (practiceMode && practiceGameIndex !== null) {
    index = practiceGameIndex;
  } else {
    index = todayGameIndex();
  }
  const answer = answers[index % answers.length];
  if (Array.isArray(answer)) {
    return answer as RouteCombo;
  }
  return answer.split('-') as RouteCombo;
};

export const flattenedTodaysTrip = (practiceMode: PracticeMode = null, practiceGameIndex: number | null = null): string => {
  return todaysTrip(practiceMode, practiceGameIndex).join('-');
};

export const todaysSolution = (practiceMode: PracticeMode = null, practiceGameIndex: number | null = null): Solution => {
  const data = getGameData();
  const solutions = data.solutions as unknown as Record<string, Solution>;
  if (!solutions) {
    throw new Error('Game data not loaded');
  }
  const key = todaysTrip(practiceMode, practiceGameIndex).join('-');
  const solution = solutions[key];
  if (!solution) {
    throw new Error(`Solution not found for key: ${key}`);
  }
  return solution;
};

export const isWinningGuess = (guess: RouteCombo): boolean => {
  return guess.join('-') === todaysTrip().join('-');
};

export const updateGuessStatuses = (
  guesses: RouteCombo[],
  setCorrectRoutes: (routes: RouteId[]) => void,
  setSimilarRoutes: (routes: RouteId[]) => void,
  setPresentRoutes: (routes: RouteId[]) => void,
  setAbsentRoutes: (routes: RouteId[]) => void,
  setSimilarRoutesIndexes: (indexes: SimilarRouteIndexes) => void,
  correctRoutes: RouteId[] | null = null,
  similarRoutes: RouteId[] | null = null,
  presentRoutes: RouteId[] | null = null,
  absentRoutes: RouteId[] | null = null,
  similarRoutesIndexes: SimilarRouteIndexes | null = null,
  practiceMode: PracticeMode = null,
  practiceGameIndex: number | null = null
): void => {
  const correct: RouteId[] = correctRoutes || [];
  let similar: RouteId[] = similarRoutes || [];
  let present: RouteId[] = presentRoutes || [];
  let absent: RouteId[] = absentRoutes || [];
  const similarIndexes: SimilarRouteIndexes = similarRoutesIndexes || {};

  guesses.forEach((guess) => {
    const remainingRoutes: RouteId[] = [];
    const remainingGuessPositions: number[] = [];
    const similarPositions = new Set<number>();
    const routesToAddToSimilar = new Set<RouteId>();
    const routesToAddToPresent = new Set<RouteId>();
    const routesToAddToAbsent = new Set<RouteId>();
    const sameColorPositions = new Set<number>();

    todaysTrip(practiceMode, practiceGameIndex).forEach((routeId, index) => {
      if (guess[index] === routeId) {
        // Route is correct - remove from all other arrays
        if (!correct.includes(routeId)) {
          correct.push(routeId);
        }
        similar = similar.filter((t) => t !== routeId);
        present = present.filter((t) => t !== routeId);
        absent = absent.filter((t) => t !== routeId);
        // Clean up similar indexes for this position
        Object.keys(similarIndexes).forEach((r) => {
          const s = similarIndexes[r]!;
          if (s.includes(index)) {
            similarIndexes[r] = s.filter((t) => t !== index);
            if (similarIndexes[r]!.length === 0) {
              delete similarIndexes[r];
            }
          }
        });
      } else {
        remainingRoutes.push(routeId);
        remainingGuessPositions.push(index);

        if (isSimilarToAnswerTrain(guess[index], index, practiceMode, practiceGameIndex)) {
          routesToAddToSimilar.add(guess[index]);
          similarPositions.add(index);
          if (similarIndexes[guess[index]] && !similarIndexes[guess[index]]!.includes(index)) {
            similarIndexes[guess[index]]!.push(index);
          } else if (!similarIndexes[guess[index]]) {
            similarIndexes[guess[index]] = [index];
          }
        } else if (hasSameColor(guess[index], routeId)) {
          sameColorPositions.add(index);
        }
      }
    });

    // Process remaining positions (not correct, similar, or sameColor)
    remainingGuessPositions.forEach((index) => {
      if (!similarPositions.has(index) && !sameColorPositions.has(index)) {
        if (remainingRoutes.includes(guess[index])) {
          routesToAddToPresent.add(guess[index]);
        } else {
          routesToAddToAbsent.add(guess[index]);
        }
      }
    });

    // Apply route updates in priority order: similar > present > absent
    routesToAddToSimilar.forEach((routeId) => {
      if (!similar.includes(routeId)) {
        similar.push(routeId);
      }
      present = present.filter((t) => t !== routeId);
      absent = absent.filter((t) => t !== routeId);
    });

    routesToAddToPresent.forEach((routeId) => {
      if (!present.includes(routeId)) {
        present.push(routeId);
      }
      absent = absent.filter((t) => t !== routeId);
    });

    routesToAddToAbsent.forEach((routeId) => {
      if (!correct.includes(routeId) && !similar.includes(routeId) && !present.includes(routeId)) {
        if (!absent.includes(routeId)) {
          absent.push(routeId);
        }
      }
    });
  });

  setCorrectRoutes(correct);
  setSimilarRoutes(similar);
  setPresentRoutes(present);
  setAbsentRoutes(absent);
  setSimilarRoutesIndexes(similarIndexes);
};

// Helper function to check if two routes share the same color
// Excludes Staten Island Railroad and shuttles (GS, FS, H) as they're separate systems
const hasSameColor = (route1: string, route2: string): boolean => {
  const EXCLUDED_ROUTES = ['SI', 'GS', 'FS', 'H'];

  // Don't apply same-color hint for excluded routes
  if (EXCLUDED_ROUTES.includes(route1) || EXCLUDED_ROUTES.includes(route2)) {
    return false;
  }

  const r1 = routes[route1];
  const r2 = routes[route2];
  if (!r1 || !r2) return false;
  return r1.color === r2.color;
};

export const checkGuessStatuses = (
  guess: RouteCombo,
  practiceMode: PracticeMode = null,
  practiceGameIndex: number | null = null
): GuessStatus[] => {
  const results: GuessStatus[] = ['absent', 'absent', 'absent'];
  const remainingRoutes: RouteId[] = [];
  const remainingGuessPositions: number[] = [];

  todaysTrip(practiceMode, practiceGameIndex).forEach((routeId, index) => {
    if (guess[index] === routeId) {
      results[index] = 'correct';
    } else {
      remainingRoutes.push(routeId);
      remainingGuessPositions.push(index);
      if (isSimilarToAnswerTrain(guess[index], index, practiceMode, practiceGameIndex)) {
        results[index] = 'similar';
      } else if (hasSameColor(guess[index], routeId)) {
        // NEW: Mark as 'sameColor' if routes share the same color (deeper orange hint)
        results[index] = 'sameColor';
      }
    }
  });

  remainingGuessPositions.forEach((index) => {
    // Priority: correct > similar > sameColor > present > absent
    if (results[index] !== 'similar' && results[index] !== 'correct' && results[index] !== 'sameColor') {
      if (remainingRoutes.includes(guess[index])) {
        results[index] = 'present';
      }
    }
  });

  return results;
};
