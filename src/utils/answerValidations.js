import transfers from './../data/transfers.json';
import { getGameData, todayGameIndex, NIGHT_GAMES } from './gameDataLoader';

const ROUTES_WITH_NO_WEEKEND_SERVICE = ['B', 'W'];
const ROUTES_WITH_NO_NIGHT_SERVICE = ['B', 'C', 'W', 'GS'];
const ACCESSIBLE_GAME = 793;
const DEKALB_AV_FLATBUSH_STOP = "R30";

const today = new Date();

const isSimilarToAnswerTrain = (guess, index, practiceMode = null, practiceGameIndex = null) => {
  let begin;
  let end;
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

  const guessSubroutingInner = guessSubrouting.slice(1, guessSubrouting.length).filter(s => s !== DEKALB_AV_FLATBUSH_STOP);
  const answerSubroutingInner = answerSubrouting.slice(1, answerSubrouting.length).filter(s => s !== DEKALB_AV_FLATBUSH_STOP);

  if (guessSubroutingInner.every(s => answerSubroutingInner.includes(s)) || answerSubroutingInner.every(s => guessSubroutingInner.includes(s))) {
    return (guessSubrouting.includes(begin) && answerSubrouting.includes(begin)) || (guessSubrouting.includes(end) && answerSubrouting.includes(end));
  }

  return false;
}

const retrieveSubrouting = (train, routings, begin, end) => {
  let trainLookup;
  if (train === 'A') {
    if (routings['A1'].includes(begin) && routings['A1'].includes(end)) {
      trainLookup = 'A1';
    } else {
      trainLookup = 'A2';
    }
  } else {
    trainLookup = train;
  }

  const beginIndex = [begin, transfers[begin]].flat().filter(n => n).map(s => routings[trainLookup].indexOf(s)).find(i => i > -1);
  const endIndex = [end, transfers[end]].flat().filter(n => n).map(s => routings[trainLookup].indexOf(s)).find(i => i > -1);

  if (beginIndex == null || endIndex == null) {
    return;
  }

  if (beginIndex < endIndex) {
    return routings[trainLookup].slice(beginIndex, endIndex + 1);
  }
  return routings[trainLookup].slice(endIndex, beginIndex + 1);
}

export const isWeekend = [0, 6].includes(today.getDay());

// Re-export from gameDataLoader for backwards compatibility
export { todayGameIndex, NIGHT_GAMES };

const getGameModeFlags = (practiceMode = null) => {
  // If practice mode is enabled, derive flags from the mode
  if (practiceMode) {
    return {
      isNight: practiceMode === 'night',
      isAccessible: practiceMode === 'accessible',
      isWeekend: practiceMode === 'weekend',
    };
  }

  // Otherwise, use automatic detection
  const index = todayGameIndex();
  return {
    isNight: NIGHT_GAMES.includes(index),
    isAccessible: index === ACCESSIBLE_GAME,
    isWeekend: isWeekend,
  };
};

export const routesWithNoService = (practiceMode = null) => {
  const { isNight, isWeekend: isWeekendFlag } = getGameModeFlags(practiceMode);
  if (isNight) {
    return ROUTES_WITH_NO_NIGHT_SERVICE;
  }
  if (isWeekendFlag) {
    return ROUTES_WITH_NO_WEEKEND_SERVICE;
  }
  return [];
}

export const isValidGuess = (guess) => {
  const { solutions } = getGameData();
  const flattenedGuess = guess.join('-');
  return !!solutions[flattenedGuess];
}

export const isNight = (practiceMode = null) => getGameModeFlags(practiceMode).isNight;
export const isAccessible = (practiceMode = null) => getGameModeFlags(practiceMode).isAccessible;

const todaysRoutings = () => {
  const { routings } = getGameData();
  return routings;
}

export const todaysTrip = (practiceMode = null, practiceGameIndex = null) => {
  const { answers } = getGameData();
  let index;
  if (practiceMode && practiceGameIndex !== null) {
    index = practiceGameIndex;
  } else {
    index = todayGameIndex();
  }
  return answers[index % answers.length];
}

export const flattenedTodaysTrip = (practiceMode = null, practiceGameIndex = null) => {
  return todaysTrip(practiceMode, practiceGameIndex).join('-');
}

export const todaysSolution = (practiceMode = null, practiceGameIndex = null) => {
  const { solutions } = getGameData();
  return solutions[todaysTrip(practiceMode, practiceGameIndex).join("-")];
}

export const isWinningGuess = (guess) => {
  return guess.join('-') === todaysTrip().join('-');
}

export const updateGuessStatuses = (guesses, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, correctRoutes, similarRoutes, presentRoutes, absentRoutes, similarRoutesIndexes, practiceMode = null, practiceGameIndex = null) => {
  const correct = correctRoutes || [];
  let similar = similarRoutes || [];
  let present = presentRoutes || [];
  let absent = absentRoutes || [];
  const similarIndexes = similarRoutesIndexes || {};

  guesses.forEach((guess) => {
    const remainingRoutes = [];
    const remainingGuessPositions = [];
    const similarPositions = new Set(); // Track positions marked as 'similar'
    const routesToAddToSimilar = new Set();
    const routesToAddToPresent = new Set();
    const routesToAddToAbsent = new Set();

    todaysTrip(practiceMode, practiceGameIndex).forEach((routeId, index) => {
      if (guess[index] === routeId) {
        // Route is correct - remove from all other arrays
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
        })
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
        }
      }
    });

    remainingGuessPositions.forEach((index) => {
      // Only add to 'present' if not already marked as 'similar' at this position
      // 'similar' takes precedence because it provides more specific feedback
      if (!similarPositions.has(index)) {
        if (remainingRoutes.includes(guess[index])) {
          routesToAddToPresent.add(guess[index]);
        } else {
          routesToAddToAbsent.add(guess[index]);
        }
      }
    });

    // Add routes to appropriate arrays and remove from lower-priority arrays
    routesToAddToSimilar.forEach((routeId) => {
      if (!similar.includes(routeId)) {
        similar.push(routeId);
      }
      // Remove from present and absent since similar takes precedence
      present = present.filter(t => t !== routeId);
      absent = absent.filter(t => t !== routeId);
    });

    routesToAddToPresent.forEach((routeId) => {
      if (!present.includes(routeId)) {
        present.push(routeId);
      }
      // Remove from absent since present takes precedence
      absent = absent.filter(t => t !== routeId);
    });

    routesToAddToAbsent.forEach((routeId) => {
      // Only add to absent if not already in correct, similar, or present
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
}

export const checkGuessStatuses = (guess, practiceMode = null, practiceGameIndex = null) => {
  const results = ['absent', 'absent', 'absent'];
  const remainingRoutes = [];
  const remainingGuessPositions = [];

  todaysTrip(practiceMode, practiceGameIndex).forEach((routeId, index) => {
    if (guess[index] === routeId) {
      results[index] = 'correct';
    } else {
      remainingRoutes.push(routeId);
      remainingGuessPositions.push(index);
      if (isSimilarToAnswerTrain(guess[index], index, practiceMode, practiceGameIndex)) {
        results[index] = 'similar';
      }
    }
  });

  remainingGuessPositions.forEach((index) => {
    // Only set 'present' if not already marked as 'similar' or 'correct'
    // 'similar' takes precedence because it provides more specific feedback
    if (results[index] !== 'similar' && results[index] !== 'correct') {
      if (remainingRoutes.includes(guess[index])) {
        results[index] = 'present';
      }
    }
  });

  return results;
}
