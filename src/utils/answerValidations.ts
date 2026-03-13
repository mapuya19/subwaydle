import transfers from './../data/transfers.json';
import routes from './../data/routes.json';
import { getGameData, todayGameIndex, NIGHT_GAMES, ACCESSIBLE_GAME, Solution } from './gameDataLoader';

const ROUTES_WITH_NO_WEEKEND_SERVICE = ['B', 'W'];
const ROUTES_WITH_NO_NIGHT_SERVICE = ['B', 'C', 'W', 'GS'];
const DEKALB_AV_FLATBUSH_STOP = "R30";

type Guess = string[];

type RouteInfo = {
  id: string;
  name: string;
  color: string;
  text_color: string | null;
  alternate_name: string | null;
};

type RoutesData = Record<string, RouteInfo>;

const isSimilarToAnswerTrain = (guess: string, index: number, practiceMode: string | null = null, practiceGameIndex: number | null = null): boolean => {
  let begin: string;
  let end: string;
  const answer = todaysTrip(practiceMode, practiceGameIndex)[index];
  const solution = todaysSolution(practiceMode, practiceGameIndex);
  const routings = todaysRoutings();
  switch (index) {
    case 0:
      begin = solution.origin;
      end = solution.first_transfer_arrival;
      break;
    case 1:
      begin = solution.first_transfer_departure;
      end = solution.second_transfer_arrival;
      break;
    default:
      begin = solution.second_transfer_departure;
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

  const guessSubroutingInner = guessSubrouting.slice(1, guessSubrouting.length).filter(s => s !== DEKALB_AV_FLATBUSH_STOP);
  const answerSubroutingInner = answerSubrouting.slice(1, answerSubrouting.length).filter(s => s !== DEKALB_AV_FLATBUSH_STOP);

  if (guessSubroutingInner.every(s => answerSubroutingInner.includes(s)) || answerSubroutingInner.every(s => guessSubroutingInner.includes(s))) {
    return (guessSubrouting.includes(begin) && answerSubrouting.includes(begin)) || (guessSubrouting.includes(end) && answerSubrouting.includes(end));
  }

  return false;
};

const retrieveSubrouting = (train: string, routings: Record<string, string[]>, begin: string, end: string): string[] | undefined => {
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

  const beginIndex = [begin, (transfers as Record<string, string[]>)[begin]].flat().filter(n => n).map(s => routings[trainLookup].indexOf(s)).find(i => i > -1);
  const endIndex = [end, (transfers as Record<string, string[]>)[end]].flat().filter(n => n).map(s => routings[trainLookup].indexOf(s)).find(i => i > -1);

  if (beginIndex == null || endIndex == null) {
    return;
  }

  if (beginIndex < endIndex) {
    return routings[trainLookup].slice(beginIndex, endIndex + 1);
  }
  return routings[trainLookup].slice(endIndex, beginIndex + 1);
};

export { todayGameIndex, NIGHT_GAMES };

const getGameModeFlags = (practiceMode: string | null = null): { isNight: boolean; isAccessible: boolean; isWeekend: boolean } => {
  if (practiceMode) {
    return {
      isNight: practiceMode === 'night',
      isAccessible: practiceMode === 'accessible',
      isWeekend: practiceMode === 'weekend',
    };
  }

  const today = new Date();
  const index = todayGameIndex();
  return {
    isNight: NIGHT_GAMES.includes(index),
    isAccessible: index === ACCESSIBLE_GAME,
    isWeekend: [0, 6].includes(today.getDay()),
  };
};

export const routesWithNoService = (practiceMode: string | null = null): string[] => {
  const { isNight, isWeekend: isWeekendFlag } = getGameModeFlags(practiceMode);
  if (isNight) {
    return ROUTES_WITH_NO_NIGHT_SERVICE;
  }
  if (isWeekendFlag) {
    return ROUTES_WITH_NO_WEEKEND_SERVICE;
  }
  return [];
};

export const isValidGuess = (guess: Guess): boolean => {
  const { solutions } = getGameData();
  if (!solutions) return false;
  const flattenedGuess = guess.join('-');
  return !!solutions[flattenedGuess];
};

export const isNight = (practiceMode: string | null = null): boolean => getGameModeFlags(practiceMode).isNight;
export const isAccessible = (practiceMode: string | null = null): boolean => getGameModeFlags(practiceMode).isAccessible;
export const isWeekend = (practiceMode: string | null = null): boolean => getGameModeFlags(practiceMode).isWeekend;

const todaysRoutings = (): Record<string, string[]> => {
  const { routings } = getGameData();
  if (!routings) {
    throw new Error('Routings not loaded');
  }
  return routings;
};

export const todaysTrip = (practiceMode: string | null = null, practiceGameIndex: number | null = null): string[] => {
  const { answers } = getGameData();
  if (!answers) {
    throw new Error('Answers not loaded');
  }
  let index: number;
  if (practiceMode && practiceGameIndex !== null) {
    index = practiceGameIndex;
  } else {
    index = todayGameIndex();
  }
  return answers[index % answers.length];
};

export const flattenedTodaysTrip = (practiceMode: string | null = null, practiceGameIndex: number | null = null): string => {
  return todaysTrip(practiceMode, practiceGameIndex).join('-');
};

export const todaysSolution = (practiceMode: string | null = null, practiceGameIndex: number | null = null): Solution => {
  const { solutions } = getGameData();
  if (!solutions) {
    throw new Error('Solutions not loaded');
  }
  return solutions[todaysTrip(practiceMode, practiceGameIndex).join("-")];
};

export const isWinningGuess = (guess: Guess): boolean => {
  return guess.join('-') === todaysTrip().join('-');
};

type GuessStatus = 'correct' | 'similar' | 'sameColor' | 'present' | 'absent';

export const updateGuessStatuses = (
  guesses: Guess[],
  setCorrectRoutes: (routes: string[]) => void,
  setSimilarRoutes: (routes: string[]) => void,
  setPresentRoutes: (routes: string[]) => void,
  setAbsentRoutes: (routes: string[]) => void,
  setSimilarRoutesIndexes: (indexes: Record<string, number[]>) => void,
  correctRoutes: string[] | undefined,
  similarRoutes: string[] | undefined,
  presentRoutes: string[] | undefined,
  absentRoutes: string[] | undefined,
  similarRoutesIndexes: Record<string, number[]> | undefined,
  practiceMode: string | null = null,
  practiceGameIndex: number | null = null
): void => {
  const correct = correctRoutes || [];
  let similar = similarRoutes || [];
  let present = presentRoutes || [];
  let absent = absentRoutes || [];
  const similarIndexes = similarRoutesIndexes || {};

  guesses.forEach((guess) => {
    const remainingRoutes: string[] = [];
    const remainingGuessPositions: number[] = [];
    const similarPositions = new Set<number>();
    const routesToAddToSimilar = new Set<string>();
    const routesToAddToPresent = new Set<string>();
    const routesToAddToAbsent = new Set<string>();
    const sameColorPositions = new Set<number>();

    todaysTrip(practiceMode, practiceGameIndex).forEach((routeId, index) => {
      if (guess[index] === routeId) {
        if (!correct.includes(routeId)) {
          correct.push(routeId);
        }
        similar = similar.filter(t => t !== routeId);
        present = present.filter(t => t !== routeId);
        absent = absent.filter(t => t !== routeId);
        Object.keys(similarIndexes).forEach((r) => {
          const s = similarIndexes[r];
          if (s.includes(index)) {
            similarIndexes[r] = s.filter(t => t !== index);
            if (similarIndexes[r].length === 0) {
              delete similarIndexes[r];
              similar = similar.filter(t => t !== r);
            }
          }
        });
      } else {
        remainingRoutes.push(routeId);
        remainingGuessPositions.push(index);

        if (isSimilarToAnswerTrain(guess[index], index, practiceMode, practiceGameIndex)) {
          routesToAddToSimilar.add(guess[index]);
          similarPositions.add(index);
          if (similarIndexes[guess[index]] && !similarIndexes[guess[index]].includes(index)) {
            similarIndexes[guess[index]].push(index);
          } else if (!similarIndexes[guess[index]]) {
            similarIndexes[guess[index]] = [index];
          }
        } else if (hasSameColor(guess[index], routeId)) {
          sameColorPositions.add(index);
        }
      }
    });

    remainingGuessPositions.forEach((index) => {
      if (!similarPositions.has(index) && !sameColorPositions.has(index)) {
        if (remainingRoutes.includes(guess[index])) {
          routesToAddToPresent.add(guess[index]);
        } else {
          routesToAddToAbsent.add(guess[index]);
        }
      }
    });

    routesToAddToSimilar.forEach((routeId) => {
      if (!similar.includes(routeId)) {
        similar.push(routeId);
      }
      present = present.filter(t => t !== routeId);
      absent = absent.filter(t => t !== routeId);
    });

    routesToAddToPresent.forEach((routeId) => {
      if (!present.includes(routeId)) {
        present.push(routeId);
      }
      absent = absent.filter(t => t !== routeId);
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

const hasSameColor = (route1: string, route2: string): boolean => {
  const EXCLUDED_ROUTES = ['SI', 'GS', 'FS', 'H'];
  
  if (EXCLUDED_ROUTES.includes(route1) || EXCLUDED_ROUTES.includes(route2)) {
    return false;
  }
  
  const r1 = (routes as RoutesData)[route1];
  const r2 = (routes as RoutesData)[route2];
  if (!r1 || !r2) return false;
  return r1.color === r2.color;
};

export const checkGuessStatuses = (guess: Guess, practiceMode: string | null = null, practiceGameIndex: number | null = null): GuessStatus[] => {
  const results: GuessStatus[] = ['absent', 'absent', 'absent'];
  const remainingRoutes: string[] = [];
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
        results[index] = 'sameColor';
      }
    }
  });

  remainingGuessPositions.forEach((index) => {
    if (results[index] !== 'similar' && results[index] !== 'correct' && results[index] !== 'sameColor') {
      if (remainingRoutes.includes(guess[index])) {
        results[index] = 'present';
      }
    }
  });

  return results;
};
