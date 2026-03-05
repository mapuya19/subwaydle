import { useState, useEffect } from 'react';
import { flattenedTodaysTrip } from '../utils/answerValidations';
import { saveGameStateToLocalStorage } from '../utils/localStorage';
import { PracticeMode } from '../utils/constants';

export const useGameState = (practiceMode: PracticeMode | null, effectivePracticeGameIndex: number | null) => {
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameLost, setIsGameLost] = useState<boolean>(false);
  const [guesses, setGuesses] = useState<string[][]>([]);
  const [isNotEnoughRoutes, setIsNotEnoughRoutes] = useState<boolean>(false);
  const [isGuessInvalid, setIsGuessInvalid] = useState<boolean>(false);
  const [toastStack, setToastStack] = useState<any[]>([]);
  const [absentRoutes, setAbsentRoutes] = useState<string[]>([]);
  const [presentRoutes, setPresentRoutes] = useState<string[]>([]);
  const [similarRoutes, setSimilarRoutes] = useState<string[]>([]);
  const [similarRoutesIndexes, setSimilarRoutesIndexes] = useState<Record<string, number[]>>({});
  const [correctRoutes, setCorrectRoutes] = useState<string[]>([]);

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
