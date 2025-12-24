import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameData } from './useGameData';
import * as gameDataLoader from '../utils/gameDataLoader';
import { loadGameStateFromLocalStorage, isNewToGame } from '../utils/localStorage';
import { flattenedTodaysTrip, updateGuessStatuses } from '../utils/answerValidations';

jest.mock('../utils/gameDataLoader', () => ({
  loadGameData: jest.fn(() => Promise.resolve({
    answers: [['1', '2', '3']],
    solutions: {},
    routings: {},
    loading: false,
    currentMode: 'weekday',
  })),
  isGameDataLoadedForMode: jest.fn(() => false),
}));

jest.mock('../utils/localStorage', () => ({
  loadGameStateFromLocalStorage: jest.fn(() => null),
  isNewToGame: jest.fn(() => true),
}));

jest.mock('../utils/answerValidations', () => ({
  flattenedTodaysTrip: jest.fn(() => '1-2-3'),
  updateGuessStatuses: jest.fn(),
}));

describe('useGameData', () => {
  const mockSetGuesses = jest.fn();
  const mockSetCurrentGuess = jest.fn();
  const mockSetIsGameWon = jest.fn();
  const mockSetIsGameLost = jest.fn();
  const mockSetIsAboutOpen = jest.fn();
  const mockSetIsSolutionsOpen = jest.fn();
  const mockSetCorrectRoutes = jest.fn();
  const mockSetSimilarRoutes = jest.fn();
  const mockSetPresentRoutes = jest.fn();
  const mockSetAbsentRoutes = jest.fn();
  const mockSetSimilarRoutesIndexes = jest.fn();
  const mockSetPracticeGameIndex = jest.fn();
  const mockSetPreviousPracticeMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    gameDataLoader.loadGameData.mockImplementation(() => Promise.resolve({
      answers: [['1', '2', '3']],
      solutions: {},
      routings: {},
      loading: false,
      currentMode: 'weekday',
    }));
    gameDataLoader.isGameDataLoadedForMode.mockReturnValue(false);
  });

  const renderUseGameData = (practiceMode = null, effectivePracticeGameIndex = null) => {
    return renderHook(() =>
      useGameData(
        practiceMode,
        effectivePracticeGameIndex,
        null, // urlPracticeGameIndex
        null, // practiceGameIndex
        mockSetPracticeGameIndex,
        null, // previousPracticeMode
        mockSetPreviousPracticeMode,
        mockSetGuesses,
        mockSetCurrentGuess,
        mockSetIsGameWon,
        mockSetIsGameLost,
        mockSetIsAboutOpen,
        mockSetIsSolutionsOpen,
        mockSetCorrectRoutes,
        mockSetSimilarRoutes,
        mockSetPresentRoutes,
        mockSetAbsentRoutes,
        mockSetSimilarRoutesIndexes,
      )
    );
  };

  it('initializes with data not loaded', () => {
    const { result } = renderUseGameData();
    expect(result.current.isDataLoaded).toBe(false);
    expect(result.current.isGameDataLoaded).toBe(false);
  });

  it('loads game data on mount', async () => {
    renderUseGameData();
    
    await waitFor(() => {
      expect(gameDataLoader.loadGameData).toHaveBeenCalled();
    });
  });

  it('loads game data when practice mode changes', async () => {
    const { rerender } = renderHook(
      ({ practiceMode }) =>
        useGameData(
          practiceMode,
          null,
          null,
          null,
          mockSetPracticeGameIndex,
          null,
          mockSetPreviousPracticeMode,
          mockSetGuesses,
          mockSetCurrentGuess,
          mockSetIsGameWon,
          mockSetIsGameLost,
          mockSetIsAboutOpen,
          mockSetIsSolutionsOpen,
          mockSetCorrectRoutes,
          mockSetSimilarRoutes,
          mockSetPresentRoutes,
          mockSetAbsentRoutes,
          mockSetSimilarRoutesIndexes,
        ),
      { initialProps: { practiceMode: null } }
    );

    await waitFor(() => {
      expect(gameDataLoader.loadGameData).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    rerender({ practiceMode: 'night' });

    await waitFor(() => {
      expect(gameDataLoader.loadGameData).toHaveBeenCalledWith('night');
    });
  });

  it('resets state when practice mode changes', async () => {
    const { rerender } = renderHook(
      ({ practiceMode, previousPracticeMode }) =>
        useGameData(
          practiceMode,
          null,
          null,
          null,
          mockSetPracticeGameIndex,
          previousPracticeMode,
          mockSetPreviousPracticeMode,
          mockSetGuesses,
          mockSetCurrentGuess,
          mockSetIsGameWon,
          mockSetIsGameLost,
          mockSetIsAboutOpen,
          mockSetIsSolutionsOpen,
          mockSetCorrectRoutes,
          mockSetSimilarRoutes,
          mockSetPresentRoutes,
          mockSetAbsentRoutes,
          mockSetSimilarRoutesIndexes,
        ),
      { initialProps: { practiceMode: null, previousPracticeMode: null } }
    );

    await waitFor(() => {
      expect(gameDataLoader.loadGameData).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    rerender({ practiceMode: 'night', previousPracticeMode: null });

    await waitFor(() => {
      expect(mockSetPracticeGameIndex).toHaveBeenCalledWith(null);
      expect(mockSetGuesses).toHaveBeenCalledWith([]);
      expect(mockSetCurrentGuess).toHaveBeenCalledWith([]);
      expect(mockSetIsGameWon).toHaveBeenCalledWith(false);
      expect(mockSetIsGameLost).toHaveBeenCalledWith(false);
      expect(mockSetPreviousPracticeMode).toHaveBeenCalledWith('night');
    });
  });

  it('loads saved game state from localStorage', async () => {
    const savedState = {
      guesses: [['1', '2', '3']],
      answer: '1-2-3', // Must match flattenedTodaysTrip mock
    };
    loadGameStateFromLocalStorage.mockReturnValue(savedState);
    isNewToGame.mockReturnValue(false);
    flattenedTodaysTrip.mockReturnValue('1-2-3'); // Match saved answer

    renderUseGameData();

    await waitFor(() => {
      expect(loadGameStateFromLocalStorage).toHaveBeenCalled();
      expect(mockSetGuesses).toHaveBeenCalledWith(savedState.guesses);
    });
  });

  it('does not load state for new users', async () => {
    isNewToGame.mockReturnValue(true);
    loadGameStateFromLocalStorage.mockReturnValue(null);

    renderUseGameData();

    await waitFor(() => {
      expect(loadGameStateFromLocalStorage).not.toHaveBeenCalled();
    });
  });

  it('handles practice mode in localStorage loading', async () => {
    const savedState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
    loadGameStateFromLocalStorage.mockReturnValue(savedState);
    isNewToGame.mockReturnValue(false);
    flattenedTodaysTrip.mockReturnValue('1-2-3');

    renderUseGameData('night', 5);

    await waitFor(() => {
      expect(loadGameStateFromLocalStorage).toHaveBeenCalledWith('night', expect.any(Number));
    }, { timeout: 3000 });
  });

  it('updates guess statuses when loading saved state', async () => {
    const savedState = {
      guesses: [['1', '2', '3'], ['4', '5', '6']],
      answer: '1-2-3',
    };
    loadGameStateFromLocalStorage.mockReturnValue(savedState);
    isNewToGame.mockReturnValue(false);
    flattenedTodaysTrip.mockReturnValue('1-2-3'); // Match the saved answer

    renderUseGameData();

    await waitFor(() => {
      expect(updateGuessStatuses).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('shows about modal for new users', async () => {
    isNewToGame.mockReturnValue(true);
    loadGameStateFromLocalStorage.mockReturnValue(null);
    flattenedTodaysTrip.mockReturnValue('1-2-3');
    
    const { result } = renderUseGameData();

    // Wait for data to load first
    await waitFor(() => {
      expect(result.current.isDataLoaded).toBe(true);
    });

    // Then check if about modal was opened
    expect(mockSetIsAboutOpen).toHaveBeenCalledWith(true);
  });

  it('does not show about modal for returning users', async () => {
    isNewToGame.mockReturnValue(false);
    loadGameStateFromLocalStorage.mockReturnValue({ guesses: [] });

    renderUseGameData();

    await waitFor(() => {
      expect(mockSetIsAboutOpen).not.toHaveBeenCalled();
    });
  });

  it('handles game data loading errors gracefully', async () => {
    gameDataLoader.loadGameData.mockRejectedValueOnce(new Error('Failed to load'));

    const { result } = renderUseGameData();

    await waitFor(() => {
      // Should still complete without crashing
      expect(result.current).toBeDefined();
    });
  });

  it('checks if game data is loaded for current mode', async () => {
    gameDataLoader.isGameDataLoadedForMode.mockReturnValue(true);

    renderUseGameData('night');

    await waitFor(() => {
      expect(gameDataLoader.isGameDataLoadedForMode).toHaveBeenCalledWith('night');
    });
  });
});

