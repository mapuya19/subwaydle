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

/**
 * Hook to manage game data loading and initialization
 */
export const useGameData = (
  practiceMode,
  effectivePracticeGameIndex,
  urlPracticeGameIndex,
  practiceGameIndex,
  setPracticeGameIndex,
  previousPracticeMode,
  setPreviousPracticeMode,
  setGuesses,
  setCurrentGuess,
  setIsGameWon,
  setIsGameLost,
  setIsAboutOpen,
  setIsSolutionsOpen,
  setCorrectRoutes,
  setSimilarRoutes,
  setPresentRoutes,
  setAbsentRoutes,
  setSimilarRoutesIndexes,
) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Reset practice game index and clear state when switching modes
  useEffect(() => {
    // If practice mode changed (including switching to/from normal mode), reset everything
    if (previousPracticeMode !== practiceMode) {
      // Reset practice game index first
      setPracticeGameIndex(null);
      // Immediately clear all game state when switching modes
      setGuesses([]);
      setCurrentGuess([]);
      setIsGameWon(false);
      setIsGameLost(false);
      setCorrectRoutes([]);
      setSimilarRoutes([]);
      setPresentRoutes([]);
      setAbsentRoutes([]);
      setSimilarRoutesIndexes({});
      // Update previous mode after clearing state
      setPreviousPracticeMode(practiceMode);
    }
  }, [practiceMode, previousPracticeMode, setPracticeGameIndex, setGuesses, setCurrentGuess, setIsGameWon, setIsGameLost, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, setPreviousPracticeMode]);

  // Preload game data on mount and when practice mode changes
  useEffect(() => {
    setIsDataLoaded(false);

    loadGameData(practiceMode).then((data) => {
      // If in practice mode, use URL game index if available, otherwise select random
      let gameIndex = null;
      if (practiceMode && data.answers) {
        if (urlPracticeGameIndex !== null) {
          // Use game index from URL, ensure it's within bounds
          gameIndex = Math.max(0, Math.min(urlPracticeGameIndex, data.answers.length - 1));
          setPracticeGameIndex(gameIndex);
        } else {
          // Always generate a new random game index when entering practice mode
          // This ensures a fresh game when switching from normal to practice
          gameIndex = Math.floor(Math.random() * data.answers.length);
          setPracticeGameIndex(gameIndex);
        }
      } else {
        setPracticeGameIndex(null);
      }

      setIsDataLoaded(true);
      // Initialize guesses after data is loaded
      const currentAnswer = flattenedTodaysTrip(practiceMode, gameIndex);
      const loaded = loadGameStateFromLocalStorage(practiceMode, gameIndex);
      
      // Reset keyboard state and current guess when switching modes or starting a new game
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
        const gameWasWon = loaded.guesses.map((g) => g.join('-')).includes(currentAnswer);
        if (gameWasWon) {
          setIsGameWon(true);
          setIsSolutionsOpen(true);
        }
        if (loaded.guesses.length === 6 && !gameWasWon) {
          setIsGameLost(true);
          setIsSolutionsOpen(true);
        }
        updateGuessStatuses(loaded.guesses, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, null, null, null, null, null, practiceMode, gameIndex);
        setGuesses(loaded.guesses);
      }
    }).catch((error) => {
      console.error('Failed to load game data:', error);
      // Still set loaded to true to show error state
      setIsDataLoaded(true);
    });
  }, [practiceMode, urlPracticeGameIndex, setPracticeGameIndex, setGuesses, setCurrentGuess, setIsGameWon, setIsGameLost, setIsAboutOpen, setIsSolutionsOpen, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, previousPracticeMode, setPreviousPracticeMode]);

  return {
    isDataLoaded,
    isGameDataLoaded: isGameDataLoadedForMode(practiceMode),
  };
};

