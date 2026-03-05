import { useState, useEffect } from 'react';
import { loadGameData, isGameDataLoadedForMode } from '../utils/gameDataLoader';
import {
  flattenedTodaysTrip,
  updateGuessStatuses,
} from '../utils/answerValidations';
import {
  loadGameStateFromLocalStorage,
  isNewToGame,
} from '../utils/localStorage';
import { PracticeMode } from '../utils/constants';

export const useGameData = (
  practiceMode: PracticeMode | null,
  _effectivePracticeGameIndex: number | null,
  urlPracticeGameIndex: number | null,
  _practiceGameIndex: number | null,
  setPracticeGameIndex: (index: number | null) => void,
  previousPracticeMode: PracticeMode | null,
  setPreviousPracticeMode: (mode: PracticeMode | null) => void,
  setGuesses: (guesses: string[][]) => void,
  setCurrentGuess: (guess: string[]) => void,
  setIsGameWon: (won: boolean) => void,
  setIsGameLost: (lost: boolean) => void,
  setIsAboutOpen: (open: boolean) => void,
  setIsSolutionsOpen: (open: boolean) => void,
  setCorrectRoutes: (routes: string[]) => void,
  setSimilarRoutes: (routes: string[]) => void,
  setPresentRoutes: (routes: string[]) => void,
  setAbsentRoutes: (routes: string[]) => void,
  setSimilarRoutesIndexes: (indexes: Record<string, number[]>) => void,
) => {
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (previousPracticeMode !== practiceMode) {
      setPracticeGameIndex(null);
      setGuesses([]);
      setCurrentGuess([]);
      setIsGameWon(false);
      setIsGameLost(false);
      setCorrectRoutes([]);
      setSimilarRoutes([]);
      setPresentRoutes([]);
      setAbsentRoutes([]);
      setSimilarRoutesIndexes({});
      setPreviousPracticeMode(practiceMode);
    }
  }, [practiceMode, previousPracticeMode, setPracticeGameIndex, setGuesses, setCurrentGuess, setIsGameWon, setIsGameLost, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, setPreviousPracticeMode]);

  useEffect(() => {
    setIsDataLoaded(false);

    loadGameData(practiceMode).then((data) => {
      let gameIndex = null;
      if (practiceMode && data.answers) {
        if (urlPracticeGameIndex !== null) {
          gameIndex = Math.max(0, Math.min(urlPracticeGameIndex, data.answers.length - 1));
          setPracticeGameIndex(gameIndex);
        } else {
          gameIndex = Math.floor(Math.random() * data.answers.length);
          setPracticeGameIndex(gameIndex);
        }
      } else {
        setPracticeGameIndex(null);
      }

      setIsDataLoaded(true);
      const currentAnswer = flattenedTodaysTrip(practiceMode, gameIndex);
      const loaded = loadGameStateFromLocalStorage(practiceMode, gameIndex);
      
      setCorrectRoutes([]);
      setSimilarRoutes([]);
      setPresentRoutes([]);
      setAbsentRoutes([]);
      setSimilarRoutesIndexes({});
      setCurrentGuess([]);
      
      if (loaded?.answer !== currentAnswer) {
        if (isNewToGame(practiceMode, gameIndex) && window.location === window.parent.location && !practiceMode) {
          setIsAboutOpen(true);
        }
        setGuesses([]);
        setIsGameWon(false);
        setIsGameLost(false);
      } else {
        const gameWasWon = loaded.guesses.map((g: string[]) => g.join('-')).includes(currentAnswer);
        if (gameWasWon) {
          setIsGameWon(true);
          setIsSolutionsOpen(true);
        }
        if (loaded.guesses.length === 6 && !gameWasWon) {
          setIsGameLost(true);
          setIsSolutionsOpen(true);
        }
        updateGuessStatuses(loaded.guesses, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, undefined, undefined, undefined, undefined, undefined, practiceMode, gameIndex);
        setGuesses(loaded.guesses);
      }
    }).catch((error) => {
      console.error('Failed to load game data:', error);
      setIsDataLoaded(true);
    });
  }, [practiceMode, urlPracticeGameIndex, setPracticeGameIndex, setGuesses, setCurrentGuess, setIsGameWon, setIsGameLost, setIsAboutOpen, setIsSolutionsOpen, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, previousPracticeMode, setPreviousPracticeMode]);

  return {
    isDataLoaded,
    isGameDataLoaded: isGameDataLoadedForMode(practiceMode),
  };
};
