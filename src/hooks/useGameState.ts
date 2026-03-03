import { useState, useEffect } from 'react';
import { flattenedTodaysTrip } from '../utils/answerValidations';
import { saveGameStateToLocalStorage } from '../utils/localStorage';
import type { RouteCombo, RouteId, PracticeMode, SimilarRouteIndexes } from '../types/game';

interface Toast {
  id: string;
  message: string;
  type: string;
  visible: boolean;
}

/**
 * Hook to manage game state (guesses, game status, etc.)
 */
export const useGameState = (practiceMode: PracticeMode, effectivePracticeGameIndex: number | null) => {
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameLost, setIsGameLost] = useState<boolean>(false);
  const [guesses, setGuesses] = useState<RouteCombo[]>([]);
  const [isNotEnoughRoutes, setIsNotEnoughRoutes] = useState<boolean>(false);
  const [isGuessInvalid, setIsGuessInvalid] = useState<boolean>(false);
  const [toastStack, setToastStack] = useState<Toast[]>([]);
  const [absentRoutes, setAbsentRoutes] = useState<RouteId[]>([]);
  const [presentRoutes, setPresentRoutes] = useState<RouteId[]>([]);
  const [similarRoutes, setSimilarRoutes] = useState<RouteId[]>([]);
  const [similarRoutesIndexes, setSimilarRoutesIndexes] = useState<SimilarRouteIndexes>({});
  const [correctRoutes, setCorrectRoutes] = useState<RouteId[]>([]);

  // Save game state to localStorage
  useEffect(() => {
    if (guesses.length > 0 || isGameWon || isGameLost) {
      saveGameStateToLocalStorage(
        { guesses, answer: flattenedTodaysTrip(practiceMode, effectivePracticeGameIndex) },
        practiceMode,
        effectivePracticeGameIndex
      );
    }
  }, [guesses, practiceMode, effectivePracticeGameIndex, isGameWon, isGameLost]);

  return {
    currentGuess,
    setCurrentGuess,
    isGameWon,
    setIsGameWon,
    isGameLost,
    setIsGameLost,
    guesses,
    setGuesses,
    isNotEnoughRoutes,
    setIsNotEnoughRoutes,
    isGuessInvalid,
    setIsGuessInvalid,
    toastStack,
    setToastStack,
    absentRoutes,
    setAbsentRoutes,
    presentRoutes,
    setPresentRoutes,
    similarRoutes,
    setSimilarRoutes,
    similarRoutesIndexes,
    setSimilarRoutesIndexes,
    correctRoutes,
    setCorrectRoutes,
  };
};
