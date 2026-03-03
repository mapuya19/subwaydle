import { useCallback, useRef } from 'react';
import { routesWithNoService, isValidGuess, updateGuessStatuses } from '../utils/answerValidations';
import { flattenedTodaysTrip } from '../utils/answerValidations';
import { addStatsForCompletedGame } from '../utils/stats';
import { ATTEMPTS, ALERT_TIME_MS } from '../utils/constants';
import type { PracticeMode, RouteCombo, RouteId, SimilarRouteIndexes } from '../types/game';
import type { Stats } from '../types/data';
import type { GameStats } from '../utils/stats';

interface Toast {
  id: string;
  message: string;
  type: string;
  visible: boolean;
}

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
  setToastStack,
  correctRoutes,
  setCorrectRoutes,
  similarRoutes,
  setSimilarRoutes,
  presentRoutes,
  setPresentRoutes,
  setAbsentRoutes,
  similarRoutesIndexes,
  setSimilarRoutesIndexes,
  stats,
  setStats,
}: {
  isStatsOpen: boolean;
  isGameWon: boolean;
  isGameLost: boolean;
  guesses: RouteCombo[];
  setGuesses: React.Dispatch<React.SetStateAction<RouteCombo[]>>;
  currentGuess: string[];
  setCurrentGuess: React.Dispatch<React.SetStateAction<string[]>>;
  practiceMode: PracticeMode | null;
  effectivePracticeGameIndex: number | null;
  setIsGameWon: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGameLost: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSolutionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNotEnoughRoutes: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGuessInvalid: React.Dispatch<React.SetStateAction<boolean>>;
  setToastStack: React.Dispatch<React.SetStateAction<Toast[]>>;
  correctRoutes: RouteId[];
  setCorrectRoutes: React.Dispatch<React.SetStateAction<RouteId[]>>;
  similarRoutes: RouteId[];
  setSimilarRoutes: React.Dispatch<React.SetStateAction<RouteId[]>>;
  presentRoutes: RouteId[];
  setPresentRoutes: React.Dispatch<React.SetStateAction<RouteId[]>>;
  absentRoutes: RouteId[];
  setAbsentRoutes: React.Dispatch<React.SetStateAction<RouteId[]>>;
  similarRoutesIndexes: SimilarRouteIndexes;
  setSimilarRoutesIndexes: React.Dispatch<React.SetStateAction<SimilarRouteIndexes>>;
  stats: Stats;
  setStats: React.Dispatch<React.SetStateAction<Stats>>;
}) => {
  const toastIdCounter = useRef(0);
  const lastEnterPressRef = useRef({ time: 0, guess: null as string | null });

  const onChar = useCallback((routeId: string) => {
    setCurrentGuess((prevGuess) => {
      if (!isStatsOpen && !isGameWon && prevGuess.length < 3 && guesses.length < ATTEMPTS) {
        if (!routesWithNoService(practiceMode).includes(routeId)) {
          return [...prevGuess, routeId];
        }
      }
      return prevGuess;
    });
  }, [isStatsOpen, isGameWon, guesses.length, practiceMode, setCurrentGuess, routesWithNoService]);

  const onDelete = useCallback(() => {
    setCurrentGuess((prevGuess) => {
      if (prevGuess.length > 0) {
        return prevGuess.slice(0, prevGuess.length - 1);
      }
      return prevGuess;
    });
  }, [setCurrentGuess]);

  const onEnter = useCallback(() => {
    const now = Date.now();
    const guessKey = JSON.stringify(currentGuess);

    // Prevent duplicate toasts from same Enter press (within 150ms with same guess)
    if (now - lastEnterPressRef.current.time < 150 &&
      lastEnterPressRef.current.guess === guessKey) {
      return;
    }

    lastEnterPressRef.current = { time: now, guess: guessKey };

    setCurrentGuess((prevGuess) => {
      const guessCount = guesses.length;
      if (isGameWon || isGameLost || guessCount === 6) {
        return prevGuess;
      }

      if (prevGuess.length !== 3) {
        // Add new toast to stack with unique ID, checking for duplicates
        const newToastId = `not-enough-${Date.now()}-${++toastIdCounter.current}`;
        setToastStack((prevToasts) => {
          // Additional check: if a toast of this type was added very recently (within 50ms), don't add another
          const veryRecentToast = prevToasts.find((t: Toast) => t.type === 'not-enough' &&
            now - parseInt(t.id.split('-')[2]!) < 50);
          if (veryRecentToast) {
            return prevToasts; // Don't add duplicate
          }
          return [...prevToasts, { id: newToastId, message: 'Not enough trains for a trip', type: 'not-enough', visible: true }];
        });
        setIsNotEnoughRoutes(true);
        // Hide toast after timeout (Toast component will handle fade-out and removal
        setTimeout(() => {
          setToastStack((prevToasts: Toast[]) => {
            return prevToasts.map((toast) =>
              toast.id === newToastId ? { ...toast, visible: false } : toast
            );
          });
        }, ALERT_TIME_MS);
        return prevGuess;
      }

      const isValid = isValidGuess(currentGuess as RouteCombo);

      if (!isValid) {
        const toastId = `invalid-${Date.now()}-${++toastIdCounter.current}`;
        setToastStack((prevToasts) => {
          return [...prevToasts, { id: toastId, message: 'Invalid trip', type: 'invalid', visible: true }];
        });
        setIsGuessInvalid(true);
        setTimeout(() => {
          setToastStack((prevToasts) => {
            return prevToasts.map((toast) =>
              toast.id === toastId ? { ...toast, visible: false } : toast
            );
          });
        }, ALERT_TIME_MS);
        return prevGuess;
      }

      const newGuesses = [...guesses, currentGuess as RouteCombo];
      setGuesses(newGuesses);

      // Update guess statuses (keyboard colors) after adding new guess
      updateGuessStatuses(
        newGuesses,
        setCorrectRoutes,
        setSimilarRoutes,
        setPresentRoutes,
        setAbsentRoutes,
        setSimilarRoutesIndexes,
        null,
        null,
        null,
        null,
        null,
        practiceMode,
        effectivePracticeGameIndex,
      );

      // Check if the guess is a winning guess
      if (guessKey === flattenedTodaysTrip(practiceMode, effectivePracticeGameIndex)) {
        const gameStats: GameStats = {
          winDistribution: stats.winDistribution || stats.distribution || [0, 0, 0, 0, 0, 0],
          gamesFailed: stats.gamesFailed || 0,
          currentStreak: stats.currentStreak || stats.streak || 0,
          bestStreak: stats.bestStreak || stats.maxStreak || 0,
          totalGames: stats.totalGames || stats.played || 0,
          successRate: stats.successRate || 0,
        };
        const newStats = addStatsForCompletedGame(gameStats, newGuesses.length - 1);
        setStats({ ...stats, ...newStats });
        setIsGameWon(true);
        setIsSolutionsOpen(true);
      } else if (newGuesses.length === 6) {
        const gameStats: GameStats = {
          winDistribution: stats.winDistribution || stats.distribution || [0, 0, 0, 0, 0, 0],
          gamesFailed: stats.gamesFailed || 0,
          currentStreak: stats.currentStreak || stats.streak || 0,
          bestStreak: stats.bestStreak || stats.maxStreak || 0,
          totalGames: stats.totalGames || stats.played || 0,
          successRate: stats.successRate || 0,
        };
        const newStats = addStatsForCompletedGame(gameStats, 6);
        setStats({ ...stats, ...newStats });
        setIsGameLost(true);
        setIsSolutionsOpen(true);
      }
      return [];
    });
  }, [
    currentGuess,
    isGameWon,
    isGameLost,
    guesses.length,
    setIsSolutionsOpen,
    setIsGameWon,
    setIsGameLost,
    setIsNotEnoughRoutes,
    setIsGuessInvalid,
    setToastStack,
    setGuesses,
    practiceMode,
    effectivePracticeGameIndex,
    flattenedTodaysTrip,
    isValidGuess,
    updateGuessStatuses,
    setCorrectRoutes,
    setSimilarRoutes,
    setPresentRoutes,
    setAbsentRoutes,
    setSimilarRoutesIndexes,
    stats,
    setStats,
    addStatsForCompletedGame,
    ALERT_TIME_MS,
  ]);

  return {
    onChar,
    onDelete,
    onEnter,
  };
};
