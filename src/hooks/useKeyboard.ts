import { useCallback, useRef } from 'react';
import { routesWithNoService, isValidGuess, updateGuessStatuses } from '../utils/answerValidations';
import { flattenedTodaysTrip } from '../utils/answerValidations';
import { addStatsForCompletedGame } from '../utils/stats';
import { ATTEMPTS, ALERT_TIME_MS } from '../utils/constants';
import { GameStats } from '../utils/stats';
import { PracticeMode } from '../utils/constants';
import { ToastItem } from '../utils/types';

interface UseKeyboardProps {
  isStatsOpen: boolean;
  isGameWon: boolean;
  isGameLost: boolean;
  guesses: string[][];
  setGuesses: (guesses: string[][]) => void;
  currentGuess: string[];
  setCurrentGuess: (guess: string[] | ((prev: string[]) => string[])) => void;
  practiceMode: PracticeMode | null;
  effectivePracticeGameIndex: number | null;
  setIsGameWon: (won: boolean) => void;
  setIsGameLost: (lost: boolean) => void;
  setIsSolutionsOpen: (open: boolean) => void;
  setIsNotEnoughRoutes: (notEnough: boolean) => void;
  setIsGuessInvalid: (invalid: boolean) => void;
  setToastStack: (toasts: ToastItem[] | ((prev: ToastItem[]) => ToastItem[])) => void;
  correctRoutes: string[];
  setCorrectRoutes: (routes: string[]) => void;
  similarRoutes: string[];
  setSimilarRoutes: (routes: string[]) => void;
  presentRoutes: string[];
  setPresentRoutes: (routes: string[]) => void;
  absentRoutes: string[];
  setAbsentRoutes: (routes: string[]) => void;
  similarRoutesIndexes: Record<string, number[]>;
  setSimilarRoutesIndexes: (indexes: Record<string, number[]>) => void;
  stats: GameStats;
  setStats: (stats: GameStats) => void;
}

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
  absentRoutes,
  setAbsentRoutes,
  similarRoutesIndexes,
  setSimilarRoutesIndexes,
  stats,
  setStats,
}: UseKeyboardProps) => {
  const toastIdCounter = useRef(0);
  const lastEnterPressRef = useRef<{ time: number; guess: string | null }>({ time: 0, guess: null });
  
  const onChar = useCallback((routeId: string) => {
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
    const now = Date.now();
    const guessKey = JSON.stringify(currentGuess);
    
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
        const toastId = `not-enough-${now}-${++toastIdCounter.current}`;
        setToastStack((prev) => {
          const veryRecentToast = prev.find((t) => t.type === 'not-enough' && 
            now - parseInt(t.id.split('-')[2]) < 50);
          if (veryRecentToast) {
            return prev;
          }
          return [...prev, { id: toastId, message: 'Not enough trains for trip', type: 'not-enough', visible: true }];
        });
        setIsNotEnoughRoutes(true);
        setTimeout(() => {
          setToastStack((prev) => {
            return prev.map((toast) => 
              toast.id === toastId ? { ...toast, visible: false } : toast
            );
          });
        }, ALERT_TIME_MS);
        return prevGuess;
      }

      if (!isValidGuess(prevGuess)) {
        const toastId = `invalid-${now}-${++toastIdCounter.current}`;
        setToastStack((prev) => {
          const veryRecentToast = prev.find((t) => t.type === 'invalid' && 
            now - parseInt(t.id.split('-')[1]) < 50);
          if (veryRecentToast) {
            return prev;
          }
          return [...prev, { id: toastId, message: 'Not a valid trip', type: 'invalid', visible: true }];
        });
        setIsGuessInvalid(true);
        setTimeout(() => {
          setToastStack((prev) => {
            return prev.map((toast) => 
              toast.id === toastId ? { ...toast, visible: false } : toast
            );
          });
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
        if (!practiceMode) {
          const updatedStats = addStatsForCompletedGame(stats, guessCount);
          setStats(updatedStats);
        }
        setIsGameWon(true);
        setIsSolutionsOpen(true);
        return [];
      }

      if (newGuesses.length === 6) {
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
  }, [guesses, isGameWon, isGameLost, stats, correctRoutes, similarRoutes, presentRoutes, absentRoutes, similarRoutesIndexes, practiceMode, effectivePracticeGameIndex, currentGuess, setCurrentGuess, setGuesses, setIsGameWon, setIsGameLost, setIsSolutionsOpen, setIsNotEnoughRoutes, setIsGuessInvalid, setToastStack, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, setStats]);

  return {
    onChar,
    onDelete,
    onEnter,
  };
};
