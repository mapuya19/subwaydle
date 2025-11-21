import { useCallback, useRef } from 'react';
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
  toastStack,
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
}) => {
  const toastIdCounter = useRef(0);
  const lastEnterPressRef = useRef({ time: 0, guess: null });
  
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
    const now = Date.now();
    const guessKey = JSON.stringify(currentGuess);
    
    // Prevent duplicate toasts from the same Enter press (within 150ms with same guess)
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
        const toastId = `not-enough-${now}-${++toastIdCounter.current}`;
        setToastStack((prev) => {
          // Additional check: if a toast of this type was added very recently (within 50ms), don't add another
          const veryRecentToast = prev.find(t => t.type === 'not-enough' && 
            now - parseInt(t.id.split('-')[2]) < 50);
          if (veryRecentToast) {
            return prev; // Don't add duplicate
          }
          return [...prev, { id: toastId, message: 'Not enough trains for the trip', type: 'not-enough', visible: true }];
        });
        setIsNotEnoughRoutes(true);
        // Hide toast after timeout (Toast component will handle fade-out and removal)
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
        // Add new toast to stack with unique ID, checking for duplicates
        const toastId = `invalid-${now}-${++toastIdCounter.current}`;
        setToastStack((prev) => {
          // Additional check: if a toast of this type was added very recently (within 50ms), don't add another
          const veryRecentToast = prev.find(t => t.type === 'invalid' && 
            now - parseInt(t.id.split('-')[1]) < 50);
          if (veryRecentToast) {
            return prev; // Don't add duplicate
          }
          return [...prev, { id: toastId, message: 'Not a valid trip', type: 'invalid', visible: true }];
        });
        setIsGuessInvalid(true);
        // Hide toast after timeout (Toast component will handle fade-out and removal)
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
  }, [guesses, isGameWon, isGameLost, stats, correctRoutes, similarRoutes, presentRoutes, absentRoutes, similarRoutesIndexes, practiceMode, effectivePracticeGameIndex, currentGuess, setCurrentGuess, setGuesses, setIsGameWon, setIsGameLost, setIsSolutionsOpen, setIsNotEnoughRoutes, setIsGuessInvalid, setToastStack, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, setStats]);

  return {
    onChar,
    onDelete,
    onEnter,
  };
};

