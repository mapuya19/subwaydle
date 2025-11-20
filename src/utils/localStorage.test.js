import {
  saveGameStateToLocalStorage,
  loadGameStateFromLocalStorage,
  saveStatsToLocalStorage,
  loadStatsFromLocalStorage,
  saveSettingsToLocalStorage,
  loadSettingsFromLocalStorage,
  isNewToGame,
} from './localStorage';

// Mock localStorage with shared store
let store = {};

const createLocalStorageMock = () => {
  return {
    getItem: jest.fn((key) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
};

let localStorageMock;

beforeAll(() => {
  localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear the store and reset mock call history, but keep implementations
    store = {};
    jest.clearAllMocks();
    // Re-implement mocks to use the cleared store
    localStorageMock.getItem.mockImplementation((key) => store[key] || null);
    localStorageMock.setItem.mockImplementation((key, value) => {
      store[key] = value.toString();
    });
    localStorageMock.removeItem.mockImplementation((key) => {
      delete store[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      store = {};
    });
  });

  describe('saveGameStateToLocalStorage', () => {
    test('saves game state to localStorage', () => {
      const gameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      const result = saveGameStateToLocalStorage(gameState);
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gameState',
        JSON.stringify(gameState)
      );
    });

    test('returns false when gameState is null', () => {
      const result = saveGameStateToLocalStorage(null);
      expect(result).toBe(false);
    });
  });

  describe('loadGameStateFromLocalStorage', () => {
    test('returns null when no game state exists', () => {
      const result = loadGameStateFromLocalStorage();
      expect(result).toBeNull();
    });

    test('returns parsed game state when it exists', () => {
      const gameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      localStorageMock.setItem('gameState', JSON.stringify(gameState));
      const result = loadGameStateFromLocalStorage();
      expect(result).toEqual(gameState);
    });
  });

  describe('saveStatsToLocalStorage', () => {
    test('saves stats to localStorage', () => {
      const stats = { gamesPlayed: 5, gamesWon: 3 };
      const result = saveStatsToLocalStorage(stats);
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gameStats',
        JSON.stringify(stats)
      );
    });

    test('returns false when stats is null', () => {
      const result = saveStatsToLocalStorage(null);
      expect(result).toBe(false);
    });
  });

  describe('loadStatsFromLocalStorage', () => {
    test('returns null when no stats exist', () => {
      const result = loadStatsFromLocalStorage();
      expect(result).toBeNull();
    });

    test('returns parsed stats when they exist', () => {
      const stats = { gamesPlayed: 5, gamesWon: 3 };
      localStorageMock.setItem('gameStats', JSON.stringify(stats));
      const result = loadStatsFromLocalStorage();
      expect(result).toEqual(stats);
    });
  });

  describe('saveSettingsToLocalStorage', () => {
    test('saves settings to localStorage', () => {
      const settings = { display: { darkMode: true } };
      const result = saveSettingsToLocalStorage(settings);
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gameSettings',
        JSON.stringify(settings)
      );
    });

    test('returns false when settings is null', () => {
      const result = saveSettingsToLocalStorage(null);
      expect(result).toBe(false);
    });
  });

  describe('loadSettingsFromLocalStorage', () => {
    test('returns null when no settings exist', () => {
      const result = loadSettingsFromLocalStorage();
      expect(result).toBeNull();
    });

    test('returns parsed settings when they exist', () => {
      const settings = { display: { darkMode: true } };
      localStorageMock.setItem('gameSettings', JSON.stringify(settings));
      const result = loadSettingsFromLocalStorage();
      expect(result).toEqual(settings);
    });
  });

  describe('isNewToGame', () => {
    test('returns true when no game state or stats exist', () => {
      expect(isNewToGame()).toBe(true);
    });

    test('returns false when game state exists', () => {
      localStorageMock.setItem('gameState', JSON.stringify({ guesses: [] }));
      expect(isNewToGame()).toBe(false);
    });

    test('returns false when stats exist', () => {
      localStorageMock.setItem('gameStats', JSON.stringify({ gamesPlayed: 1 }));
      expect(isNewToGame()).toBe(false);
    });
  });
});

