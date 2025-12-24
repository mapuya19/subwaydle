import { renderHook, act } from '@testing-library/react';
import { useKeyboard } from './useKeyboard';
import { routesWithNoService, isValidGuess, updateGuessStatuses, flattenedTodaysTrip } from '../utils/answerValidations';
import { addStatsForCompletedGame } from '../utils/stats';
import { ATTEMPTS, ALERT_TIME_MS } from '../utils/constants';

jest.mock('../utils/answerValidations', () => ({
  routesWithNoService: jest.fn(() => []),
  isValidGuess: jest.fn(() => true),
  updateGuessStatuses: jest.fn(),
  flattenedTodaysTrip: jest.fn(() => '1-2-3'),
}));

jest.mock('../utils/stats', () => ({
  addStatsForCompletedGame: jest.fn((stats, count) => ({ ...stats, totalGames: stats.totalGames + 1 })),
}));

describe('useKeyboard', () => {
  let mockCurrentGuess = [];
  let mockGuesses = [];
  let mockToastStack = [];
  let mockStats = { totalGames: 0, gamesFailed: 0, currentStreak: 0, bestStreak: 0 };
  
  const mockSetCurrentGuess = jest.fn((fn) => {
    if (typeof fn === 'function') {
      mockCurrentGuess = fn(mockCurrentGuess);
    }
  });
  const mockSetGuesses = jest.fn((fn) => {
    if (typeof fn === 'function') {
      mockGuesses = fn(mockGuesses);
    } else {
      mockGuesses = fn;
    }
  });
  const mockSetIsGameWon = jest.fn();
  const mockSetIsGameLost = jest.fn();
  const mockSetIsSolutionsOpen = jest.fn();
  const mockSetIsNotEnoughRoutes = jest.fn();
  const mockSetIsGuessInvalid = jest.fn();
  const mockSetToastStack = jest.fn((fn) => {
    if (typeof fn === 'function') {
      mockToastStack = fn(mockToastStack);
    } else {
      mockToastStack = fn;
    }
  });
  const mockSetCorrectRoutes = jest.fn();
  const mockSetSimilarRoutes = jest.fn();
  const mockSetPresentRoutes = jest.fn();
  const mockSetAbsentRoutes = jest.fn();
  const mockSetSimilarRoutesIndexes = jest.fn();
  const mockSetStats = jest.fn();

  const getDefaultProps = () => ({
    isStatsOpen: false,
    isGameWon: false,
    isGameLost: false,
    guesses: mockGuesses,
    setGuesses: mockSetGuesses,
    currentGuess: mockCurrentGuess,
    setCurrentGuess: mockSetCurrentGuess,
    practiceMode: null,
    effectivePracticeGameIndex: null,
    setIsGameWon: mockSetIsGameWon,
    setIsGameLost: mockSetIsGameLost,
    setIsSolutionsOpen: mockSetIsSolutionsOpen,
    setIsNotEnoughRoutes: mockSetIsNotEnoughRoutes,
    setIsGuessInvalid: mockSetIsGuessInvalid,
    toastStack: mockToastStack,
    setToastStack: mockSetToastStack,
    correctRoutes: [],
    setCorrectRoutes: mockSetCorrectRoutes,
    similarRoutes: [],
    setSimilarRoutes: mockSetSimilarRoutes,
    presentRoutes: [],
    setPresentRoutes: mockSetPresentRoutes,
    absentRoutes: [],
    setAbsentRoutes: mockSetAbsentRoutes,
    similarRoutesIndexes: {},
    setSimilarRoutesIndexes: mockSetSimilarRoutesIndexes,
    stats: mockStats,
    setStats: mockSetStats,
  });
  
  const defaultProps = getDefaultProps();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentGuess = [];
    mockGuesses = [];
    mockToastStack = [];
    mockStats = { totalGames: 0, gamesFailed: 0, currentStreak: 0, bestStreak: 0 };
    routesWithNoService.mockReturnValue([]);
    isValidGuess.mockReturnValue(true);
    flattenedTodaysTrip.mockReturnValue('1-2-3');
    // Reset mock implementations
    mockSetCurrentGuess.mockImplementation((fn) => {
      if (typeof fn === 'function') {
        mockCurrentGuess = fn(mockCurrentGuess);
      } else {
        mockCurrentGuess = fn;
      }
    });
    mockSetGuesses.mockImplementation((fn) => {
      if (typeof fn === 'function') {
        mockGuesses = fn(mockGuesses);
      } else {
        mockGuesses = fn;
      }
    });
    mockSetToastStack.mockImplementation((fn) => {
      if (typeof fn === 'function') {
        mockToastStack = fn(mockToastStack);
      } else {
        mockToastStack = fn;
      }
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  beforeAll(() => {
    jest.useFakeTimers();
  });

  describe('onChar', () => {
    it('adds character to current guess', () => {
      const { result } = renderHook(() => useKeyboard(defaultProps));
      
      act(() => {
        result.current.onChar('1');
      });

      expect(mockSetCurrentGuess).toHaveBeenCalled();
    });

    it('does not add character when stats modal is open', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps, isStatsOpen: true }));
      
      act(() => {
        result.current.onChar('1');
      });

      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call([])).toEqual([]);
    });

    it('does not add character when game is won', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps, isGameWon: true }));
      
      act(() => {
        result.current.onChar('1');
      });

      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call(['1'])).toEqual(['1']);
    });

    it('does not add character when guess is full (3 routes)', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps }));
      
      act(() => {
        result.current.onChar('1');
        result.current.onChar('2');
        result.current.onChar('3');
        result.current.onChar('4'); // Should not add
      });

      const lastCall = mockSetCurrentGuess.mock.calls[mockSetCurrentGuess.mock.calls.length - 1][0];
      expect(lastCall(['1', '2', '3'])).toEqual(['1', '2', '3']);
    });

    it('does not add character when max attempts reached', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        guesses: Array(ATTEMPTS).fill(['1', '2', '3']),
      }));
      
      act(() => {
        result.current.onChar('1');
      });

      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call([])).toEqual([]);
    });

    it('does not add routes with no service', () => {
      routesWithNoService.mockReturnValue(['B', 'W']);
      const { result } = renderHook(() => useKeyboard({ ...defaultProps, practiceMode: 'weekend' }));
      
      act(() => {
        result.current.onChar('B');
      });

      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call([])).toEqual([]);
    });
  });

  describe('onDelete', () => {
    it('removes last character from current guess', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps }));
      
      act(() => {
        result.current.onDelete();
      });

      expect(mockSetCurrentGuess).toHaveBeenCalled();
      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call(['1', '2', '3'])).toEqual(['1', '2']);
    });

    it('does nothing when guess is empty', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps }));
      
      act(() => {
        result.current.onDelete();
      });

      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call([])).toEqual([]);
    });
  });

  describe('onEnter', () => {
    it('does nothing when game is won', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        isGameWon: true,
        currentGuess: ['1', '2', '3'],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call(['1', '2', '3'])).toEqual(['1', '2', '3']);
    });

    it('does nothing when game is lost', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        isGameLost: true,
        currentGuess: ['1', '2', '3'],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      const call = mockSetCurrentGuess.mock.calls[0][0];
      expect(call(['1', '2', '3'])).toEqual(['1', '2', '3']);
    });

    it('shows error toast when guess is too short', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        currentGuess: ['1', '2'],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      expect(mockSetIsNotEnoughRoutes).toHaveBeenCalledWith(true);
      expect(mockSetToastStack).toHaveBeenCalled();
    });

    it('shows error toast when guess is invalid', () => {
      isValidGuess.mockReturnValue(false);
      mockCurrentGuess = ['1', '2', '3'];
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['1', '2', '3'],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      expect(mockSetIsGuessInvalid).toHaveBeenCalledWith(true);
      expect(mockSetToastStack).toHaveBeenCalled();
    });

    it('hides toast after timeout', () => {
      jest.useFakeTimers();
      mockCurrentGuess = ['1', '2'];
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['1', '2'],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      act(() => {
        jest.advanceTimersByTime(ALERT_TIME_MS);
      });

      expect(mockSetToastStack).toHaveBeenCalledTimes(2); // Once to add, once to hide
      jest.useRealTimers();
    });

    it('prevents duplicate toasts from rapid Enter presses', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        currentGuess: ['1', '2'],
      }));
      
      act(() => {
        result.current.onEnter();
        result.current.onEnter(); // Rapid second press
      });

      // Should only show one toast
      expect(mockSetIsNotEnoughRoutes).toHaveBeenCalledTimes(1);
    });

    it('submits valid guess and updates game state', () => {
      mockCurrentGuess = ['1', '2', '3'];
      mockGuesses = [];
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['1', '2', '3'],
        guesses: [],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      expect(updateGuessStatuses).toHaveBeenCalled();
      expect(mockSetGuesses).toHaveBeenCalled();
    });

    it('wins game when guess matches solution', () => {
      flattenedTodaysTrip.mockReturnValue('1-2-3');
      mockCurrentGuess = ['1', '2', '3'];
      mockGuesses = [];
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['1', '2', '3'],
        guesses: [],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      expect(mockSetIsGameWon).toHaveBeenCalledWith(true);
      expect(mockSetIsSolutionsOpen).toHaveBeenCalledWith(true);
      expect(mockSetStats).toHaveBeenCalled();
    });

    it('does not update stats in practice mode', () => {
      flattenedTodaysTrip.mockReturnValue('1-2-3');
      mockCurrentGuess = ['1', '2', '3'];
      mockGuesses = [];
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['1', '2', '3'],
        guesses: [],
        practiceMode: 'night',
      }));
      
      act(() => {
        result.current.onEnter();
      });

      expect(mockSetIsGameWon).toHaveBeenCalledWith(true);
      expect(addStatsForCompletedGame).not.toHaveBeenCalled();
    });

    it('loses game when max attempts reached', () => {
      mockCurrentGuess = ['4', '5', '6'];
      mockGuesses = Array(5).fill(['1', '2', '3']);
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['4', '5', '6'],
        guesses: Array(5).fill(['1', '2', '3']),
      }));
      
      act(() => {
        result.current.onEnter();
      });

      expect(mockSetIsGameLost).toHaveBeenCalledWith(true);
      expect(mockSetIsSolutionsOpen).toHaveBeenCalledWith(true);
      expect(mockSetStats).toHaveBeenCalled();
    });

    it('clears current guess after submission', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        currentGuess: ['1', '2', '3'],
        guesses: [],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      const call = mockSetCurrentGuess.mock.calls[mockSetCurrentGuess.mock.calls.length - 1][0];
      expect(call(['1', '2', '3'])).toEqual([]);
    });

    it('handles practice mode and game index', () => {
      mockCurrentGuess = ['1', '2', '3'];
      mockGuesses = [];
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['1', '2', '3'],
        guesses: [],
        practiceMode: 'night',
        effectivePracticeGameIndex: 5,
      }));
      
      act(() => {
        result.current.onEnter();
      });

      expect(updateGuessStatuses).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
        expect.any(Object),
        'night',
        5
      );
    });
  });
});

