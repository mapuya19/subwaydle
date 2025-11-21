import { useState, useEffect } from 'react';
import { flattenedTodaysTrip } from '../utils/answerValidations';
import { saveGameStateToLocalStorage } from '../utils/localStorage';

/**
 * Hook to manage game state (guesses, game status, etc.)
 */
export const useGameState = (practiceMode, effectivePracticeGameIndex) => {
  const [currentGuess, setCurrentGuess] = useState([]);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameLost, setIsGameLost] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [isNotEnoughRoutes, setIsNotEnoughRoutes] = useState(false);
  const [isGuessInvalid, setIsGuessInvalid] = useState(false);
  const [toastStack, setToastStack] = useState([]);
  const [absentRoutes, setAbsentRoutes] = useState([]);
  const [presentRoutes, setPresentRoutes] = useState([]);
  const [similarRoutes, setSimilarRoutes] = useState([]);
  const [similarRoutesIndexes, setSimilarRoutesIndexes] = useState({});
  const [correctRoutes, setCorrectRoutes] = useState([]);

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

