import { useCallback } from 'react';
import { routesWithNoService, isValidGuess, updateGuessStatuses } from '../utils/answerValidations';
import { flattenedTodaysTrip } from '../utils/answerValidations';
import { addStatsForCompletedGame } from '../utils/stats';
import { ATTEMPTS, ALERT_TIME_MS } from '../utils/constants';

/**
 * Hook to handle keyboard input and game logic
 */
export const useKeyboard = ({
  isStatsOpen,
  isGameWon,
  isGameLost,
  guesses,
  setGuesses,
  currentGuess,
  setCurrentGuess,
  practiceMode,
  effectivePracticeGameIndex,
  setIsGameWon,
  setIsGameLost,
  setIsSolutionsOpen,
  setIsNotEnoughRoutes,
  setIsGuessInvalid,
  correctRoutes,
  setCorrectRoutes,
  similarRoutes,
  setSimilarRoutes,
  presentRoutes,
  setPresentRoutes,
  absentRoutes,
  setAbsentRoutes,
  similarRoutesIndexes,
  setSimilarRoutesIndexes,
  stats,
  setStats,
}) => {
  const onChar = useCallback((routeId) => {
    setCurrentGuess((prevGuess) => {
      if (!isStatsOpen && !isGameWon && prevGuess.length < 3 && guesses.length < ATTEMPTS) {
        if (!routesWithNoService(practiceMode).includes(routeId)) {
          return [...prevGuess, routeId];
        }
      }
      return prevGuess;
    });
  }, [isStatsOpen, isGameWon, guesses.length, practiceMode, setCurrentGuess]);

  const onDelete = useCallback(() => {
    setCurrentGuess((prevGuess) => {
      if (prevGuess.length > 0) {
        return prevGuess.slice(0, prevGuess.length - 1);
      }
      return prevGuess;
    });
  }, [setCurrentGuess]);

  const onEnter = useCallback(() => {
    setCurrentGuess((prevGuess) => {
      const guessCount = guesses.length;
      if (isGameWon || isGameLost || guessCount === 6) {
        return prevGuess;
      }

      if (prevGuess.length !== 3) {
        setIsNotEnoughRoutes(true);
        setTimeout(() => {
          setIsNotEnoughRoutes(false)
        }, ALERT_TIME_MS);
        return prevGuess;
      }

      if (!isValidGuess(prevGuess)) {
        setIsGuessInvalid(true);
        setTimeout(() => {
          setIsGuessInvalid(false)
        }, ALERT_TIME_MS);
        return prevGuess;
      }

      const currentAnswer = flattenedTodaysTrip(practiceMode, effectivePracticeGameIndex);
      const winningGuess = prevGuess.join('-') === currentAnswer;
      const newGuesses = [...guesses, prevGuess];

      updateGuessStatuses(
        [prevGuess],
        setCorrectRoutes,
        setSimilarRoutes,
        setPresentRoutes,
        setAbsentRoutes,
        setSimilarRoutesIndexes,
        correctRoutes,
        similarRoutes,
        presentRoutes,
        absentRoutes,
        similarRoutesIndexes,
        practiceMode,
        effectivePracticeGameIndex,
      );

      setGuesses(newGuesses);

      if (winningGuess) {
        // Only update stats for regular games, not practice mode
        if (!practiceMode) {
          const updatedStats = addStatsForCompletedGame(stats, guessCount);
          setStats(updatedStats);
        }
        setIsGameWon(true);
        setIsSolutionsOpen(true);
        return [];
      }

      if (newGuesses.length === 6) {
        // Only update stats for regular games, not practice mode
        if (!practiceMode) {
          const updatedStats = addStatsForCompletedGame(stats, guessCount + 1);
          setStats(updatedStats);
        }
        setIsGameLost(true);
        setIsSolutionsOpen(true);
        return [];
      }

      return [];
    });
  }, [guesses, isGameWon, isGameLost, stats, correctRoutes, similarRoutes, presentRoutes, absentRoutes, similarRoutesIndexes, practiceMode, effectivePracticeGameIndex, setCurrentGuess, setGuesses, setIsGameWon, setIsGameLost, setIsSolutionsOpen, setIsNotEnoughRoutes, setIsGuessInvalid, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, setStats]);

  return {
    onChar,
    onDelete,
    onEnter,
  };
};

