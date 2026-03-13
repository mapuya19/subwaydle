import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboard } from './useKeyboard';
import { routesWithNoService, isValidGuess, updateGuessStatuses, flattenedTodaysTrip } from '../utils/answerValidations';
import { addStatsForCompletedGame } from '../utils/stats';
import { ATTEMPTS, ALERT_TIME_MS } from '../utils/constants';
import type { GameStats } from '../utils/stats';
import type { ToastItem } from '../utils/types';
import type { PracticeMode } from '../utils/constants';

vi.mock('../utils/answerValidations', () => ({
  routesWithNoService: vi.fn(() => []),
  isValidGuess: vi.fn(() => true),
  updateGuessStatuses: vi.fn(),
  flattenedTodaysTrip: vi.fn(() => '1-2-3'),
}));

vi.mock('../utils/stats', () => ({
  addStatsForCompletedGame: vi.fn((stats: GameStats, _count: number) => ({ ...stats, totalGames: stats.totalGames + 1 })),
}));

describe('useKeyboard', () => {
  let mockCurrentGuess: string[] = [];
  let mockGuesses: string[][] = [];
  let mockToastStack: ToastItem[] = [];
  let mockStats: GameStats = { winDistribution: [0, 0, 0, 0, 0, 0], totalGames: 0, gamesFailed: 0, currentStreak: 0, bestStreak: 0, successRate: 0 };
  
  const mockSetCurrentGuess = vi.fn((fn: string[] | ((prev: string[]) => string[])) => {
    if (typeof fn === 'function') {
      mockCurrentGuess = fn(mockCurrentGuess);
    }
  });
  const mockSetGuesses = vi.fn((fn: string[][] | ((prev: string[][]) => string[][])) => {
    if (typeof fn === 'function') {
      mockGuesses = fn(mockGuesses);
    } else {
      mockGuesses = fn;
    }
  });
  const mockSetIsGameWon = vi.fn();
  const mockSetIsGameLost = vi.fn();
  const mockSetIsSolutionsOpen = vi.fn();
  const mockSetIsNotEnoughRoutes = vi.fn();
  const mockSetIsGuessInvalid = vi.fn();
  const mockSetToastStack = vi.fn((fn: ToastItem[] | ((prev: ToastItem[]) => ToastItem[])) => {
    if (typeof fn === 'function') {
      mockToastStack = fn(mockToastStack);
    } else {
      mockToastStack = fn;
    }
  });
  const mockSetCorrectRoutes = vi.fn();
  const mockSetSimilarRoutes = vi.fn();
  const mockSetPresentRoutes = vi.fn();
  const mockSetAbsentRoutes = vi.fn();
  const mockSetSimilarRoutesIndexes = vi.fn();
  const mockSetStats = vi.fn();

  const getDefaultProps = () => ({
    isStatsOpen: false,
    isGameWon: false,
    isGameLost: false,
    guesses: mockGuesses,
    setGuesses: mockSetGuesses,
    currentGuess: mockCurrentGuess,
    setCurrentGuess: mockSetCurrentGuess,
    practiceMode: null as PracticeMode | null,
    effectivePracticeGameIndex: null as number | null,
    setIsGameWon: mockSetIsGameWon,
    setIsGameLost: mockSetIsGameLost,
    setIsSolutionsOpen: mockSetIsSolutionsOpen,
    setIsNotEnoughRoutes: mockSetIsNotEnoughRoutes,
    setIsGuessInvalid: mockSetIsGuessInvalid,
    toastStack: mockToastStack,
    setToastStack: mockSetToastStack,
    correctRoutes: [] as string[],
    setCorrectRoutes: mockSetCorrectRoutes,
    similarRoutes: [] as string[],
    setSimilarRoutes: mockSetSimilarRoutes,
    presentRoutes: [] as string[],
    setPresentRoutes: mockSetPresentRoutes,
    absentRoutes: [] as string[],
    setAbsentRoutes: mockSetAbsentRoutes,
    similarRoutesIndexes: {} as Record<string, number[]>,
    setSimilarRoutesIndexes: mockSetSimilarRoutesIndexes,
    stats: mockStats,
    setStats: mockSetStats,
  });
  
  /** Extract the updater function from a mock setState call argument */
  const getUpdater = <T>(arg: T | ((prev: T) => T)): ((prev: T) => T) => {
    if (typeof arg === 'function') return arg as (prev: T) => T;
    throw new Error('Expected an updater function, got a direct value');
  };

  const defaultProps = getDefaultProps();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentGuess = [];
    mockGuesses = [];
    mockToastStack = [];
    mockStats = { winDistribution: [0, 0, 0, 0, 0, 0], totalGames: 0, gamesFailed: 0, currentStreak: 0, bestStreak: 0, successRate: 0 };
    (routesWithNoService as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (isValidGuess as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (flattenedTodaysTrip as ReturnType<typeof vi.fn>).mockReturnValue('1-2-3');
    mockSetCurrentGuess.mockImplementation((fn: string[] | ((prev: string[]) => string[])) => {
      if (typeof fn === 'function') {
        mockCurrentGuess = fn(mockCurrentGuess);
      } else {
        mockCurrentGuess = fn;
      }
    });
    mockSetGuesses.mockImplementation((fn: string[][] | ((prev: string[][]) => string[][])) => {
      if (typeof fn === 'function') {
        mockGuesses = fn(mockGuesses);
      } else {
        mockGuesses = fn;
      }
    });
    mockSetToastStack.mockImplementation((fn: ToastItem[] | ((prev: ToastItem[]) => ToastItem[])) => {
      if (typeof fn === 'function') {
        mockToastStack = fn(mockToastStack);
      } else {
        mockToastStack = fn;
      }
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  beforeAll(() => {
    vi.useFakeTimers();
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

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater([])).toEqual([]);
    });

    it('does not add character when game is won', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps, isGameWon: true }));
      
      act(() => {
        result.current.onChar('1');
      });

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater(['1'])).toEqual(['1']);
    });

    it('does not add character when guess is full (3 routes)', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps }));
      
      act(() => {
        result.current.onChar('1');
        result.current.onChar('2');
        result.current.onChar('3');
        result.current.onChar('4');
      });

      const lastUpdater = getUpdater(mockSetCurrentGuess.mock.calls[mockSetCurrentGuess.mock.calls.length - 1][0]);
      expect(lastUpdater(['1', '2', '3'])).toEqual(['1', '2', '3']);
    });

    it('does not add character when max attempts reached', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        guesses: Array(ATTEMPTS).fill(['1', '2', '3']),
      }));
      
      act(() => {
        result.current.onChar('1');
      });

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater([])).toEqual([]);
    });

    it('does not add routes with no service', () => {
      (routesWithNoService as ReturnType<typeof vi.fn>).mockReturnValue(['B', 'W']);
      const { result } = renderHook(() => useKeyboard({ ...defaultProps, practiceMode: 'weekend' }));
      
      act(() => {
        result.current.onChar('B');
      });

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater([])).toEqual([]);
    });
  });

  describe('onDelete', () => {
    it('removes last character from current guess', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps }));
      
      act(() => {
        result.current.onDelete();
      });

      expect(mockSetCurrentGuess).toHaveBeenCalled();
      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater(['1', '2', '3'])).toEqual(['1', '2']);
    });

    it('does nothing when guess is empty', () => {
      const { result } = renderHook(() => useKeyboard({ ...defaultProps }));
      
      act(() => {
        result.current.onDelete();
      });

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater([])).toEqual([]);
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

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater(['1', '2', '3'])).toEqual(['1', '2', '3']);
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

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[0][0]);
      expect(updater(['1', '2', '3'])).toEqual(['1', '2', '3']);
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
      (isValidGuess as ReturnType<typeof vi.fn>).mockReturnValue(false);
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
      vi.useFakeTimers();
      mockCurrentGuess = ['1', '2'];
      const { result } = renderHook(() => useKeyboard({
        ...getDefaultProps(),
        currentGuess: ['1', '2'],
      }));
      
      act(() => {
        result.current.onEnter();
      });

      act(() => {
        vi.advanceTimersByTime(ALERT_TIME_MS);
      });

      expect(mockSetToastStack).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('prevents duplicate toasts from rapid Enter presses', () => {
      const { result } = renderHook(() => useKeyboard({
        ...defaultProps,
        currentGuess: ['1', '2'],
      }));
      
      act(() => {
        result.current.onEnter();
        result.current.onEnter();
      });

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
      (flattenedTodaysTrip as ReturnType<typeof vi.fn>).mockReturnValue('1-2-3');
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
      (flattenedTodaysTrip as ReturnType<typeof vi.fn>).mockReturnValue('1-2-3');
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

      const updater = getUpdater(mockSetCurrentGuess.mock.calls[mockSetCurrentGuess.mock.calls.length - 1][0]);
      expect(updater(['1', '2', '3'])).toEqual([]);
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