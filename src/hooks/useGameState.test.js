import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { saveGameStateToLocalStorage } from '../utils/localStorage';
import * as answerValidations from '../utils/answerValidations';

jest.mock('../utils/localStorage', () => ({
  saveGameStateToLocalStorage: jest.fn(() => true),
}));

jest.mock('../utils/answerValidations', () => ({
  flattenedTodaysTrip: jest.fn(),
}));

describe('useGameState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    answerValidations.flattenedTodaysTrip.mockReturnValue('1-2-3');
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    expect(result.current.currentGuess).toEqual([]);
    expect(result.current.isGameWon).toBe(false);
    expect(result.current.isGameLost).toBe(false);
    expect(result.current.guesses).toEqual([]);
    expect(result.current.isNotEnoughRoutes).toBe(false);
    expect(result.current.isGuessInvalid).toBe(false);
    expect(result.current.toastStack).toEqual([]);
    expect(result.current.absentRoutes).toEqual([]);
    expect(result.current.presentRoutes).toEqual([]);
    expect(result.current.similarRoutes).toEqual([]);
    expect(result.current.similarRoutesIndexes).toEqual({});
    expect(result.current.correctRoutes).toEqual([]);
  });

  it('updates currentGuess', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setCurrentGuess(['1', '2', '3']);
    });
    
    expect(result.current.currentGuess).toEqual(['1', '2', '3']);
  });

  it('updates game won state', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setIsGameWon(true);
    });
    
    expect(result.current.isGameWon).toBe(true);
  });

  it('updates game lost state', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setIsGameLost(true);
    });
    
    expect(result.current.isGameLost).toBe(true);
  });

  it('updates guesses', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setGuesses([['1', '2', '3']]);
    });
    
    expect(result.current.guesses).toEqual([['1', '2', '3']]);
  });

  it('saves game state to localStorage when guesses change', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setGuesses([['1', '2', '3']]);
    });
    
    expect(saveGameStateToLocalStorage).toHaveBeenCalledWith(
      { guesses: [['1', '2', '3']], answer: '1-2-3' },
      null,
      0
    );
  });

  it('saves game state to localStorage when game is won', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setIsGameWon(true);
    });
    
    expect(saveGameStateToLocalStorage).toHaveBeenCalled();
  });

  it('saves game state to localStorage when game is lost', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setIsGameLost(true);
    });
    
    expect(saveGameStateToLocalStorage).toHaveBeenCalled();
  });

  it('handles practice mode and game index', () => {
    const { result } = renderHook(() => useGameState('night', 5));
    
    act(() => {
      result.current.setGuesses([['1', '2', '3']]);
    });
    
    expect(saveGameStateToLocalStorage).toHaveBeenCalledWith(
      expect.objectContaining({ guesses: [['1', '2', '3']] }),
      'night',
      5
    );
  });

  it('updates route status arrays', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setCorrectRoutes(['1', '2']);
      result.current.setPresentRoutes(['3']);
      result.current.setAbsentRoutes(['4', '5']);
      result.current.setSimilarRoutes(['6']);
    });
    
    expect(result.current.correctRoutes).toEqual(['1', '2']);
    expect(result.current.presentRoutes).toEqual(['3']);
    expect(result.current.absentRoutes).toEqual(['4', '5']);
    expect(result.current.similarRoutes).toEqual(['6']);
  });

  it('updates similar routes indexes', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setSimilarRoutesIndexes({ '1': [0, 1] });
    });
    
    expect(result.current.similarRoutesIndexes).toEqual({ '1': [0, 1] });
  });

  it('updates toast stack', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    act(() => {
      result.current.setToastStack([{ id: 1, message: 'Test' }]);
    });
    
    expect(result.current.toastStack).toEqual([{ id: 1, message: 'Test' }]);
  });

  it('does not save to localStorage when state is empty', () => {
    const { result } = renderHook(() => useGameState(null, 0));
    
    // Initial render should not trigger save
    expect(saveGameStateToLocalStorage).not.toHaveBeenCalled();
    
    act(() => {
      result.current.setIsNotEnoughRoutes(true);
    });
    
    // Setting flags without guesses/game end should not save
    expect(saveGameStateToLocalStorage).not.toHaveBeenCalled();
  });
});

