import {
  saveGameStateToLocalStorage,
  loadGameStateFromLocalStorage,
  saveStatsToLocalStorage,
  loadStatsFromLocalStorage,
  saveSettingsToLocalStorage,
  loadSettingsFromLocalStorage,
  isNewToGame,
} from './localStorage';

// LocalStorage mock following best practices from Stack Overflow
// https://stackoverflow.com/questions/32911630/how-do-i-deal-with-localstorage-in-jest-tests
class LocalStorageMock {
  constructor() {
    this.store = {};
    this.shouldThrow = false;
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    if (this.shouldThrow) {
      throw new Error('Storage quota exceeded');
    }
    return this.store[key] || null;
  }

  setItem(key, value) {
    if (this.shouldThrow) {
      throw new Error('Storage quota exceeded');
    }
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

let originalLocalStorage;

beforeAll(() => {
  // Use class-based mock for better compatibility
  originalLocalStorage = global.localStorage;
  const mockInstance = new LocalStorageMock();
  global.localStorage = mockInstance;
  
  // Also set on window for components that access window.localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockInstance,
    writable: true,
    configurable: true,
  });
  
  // Define localStorage globally if it doesn't exist
  if (typeof global.localStorage === 'undefined') {
    global.localStorage = mockInstance;
  }
});

afterAll(() => {
  global.localStorage = originalLocalStorage;
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
    global.localStorage.shouldThrow = false;
    window.localStorage.clear();
    window.localStorage.shouldThrow = false;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset shouldThrow after each test
    global.localStorage.shouldThrow = false;
    window.localStorage.shouldThrow = false;
  });

  describe('saveGameStateToLocalStorage', () => {
    it('saves and loads game state', () => {
      const gameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      const result = saveGameStateToLocalStorage(gameState);
      expect(result).toBe(true);
      const loaded = loadGameStateFromLocalStorage();
      expect(loaded).toEqual(gameState);
    });

    it('returns false for null game state', () => {
      expect(saveGameStateToLocalStorage(null)).toBe(false);
    });

    it('handles practice mode keys correctly', () => {
      const gameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      saveGameStateToLocalStorage(gameState, 'night', 5);
      const loaded = loadGameStateFromLocalStorage('night', 5);
      expect(loaded).toEqual(gameState);
      
      // Regular mode should not have this data
      expect(loadGameStateFromLocalStorage()).toBeNull();
    });

    it('handles storage errors gracefully', () => {
      // Spy on setItem and make it throw
      const setItemSpy = jest.spyOn(global.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const gameState = { guesses: [['1', '2', '3']] };
      const result = saveGameStateToLocalStorage(gameState);
      expect(result).toBe(false);
      expect(setItemSpy).toHaveBeenCalled();
      
      setItemSpy.mockRestore();
    });
  });

  describe('loadGameStateFromLocalStorage', () => {
    it('returns null for empty storage', () => {
      expect(loadGameStateFromLocalStorage()).toBeNull();
    });

    it('returns null for invalid JSON and removes corrupted data', () => {
      global.localStorage.setItem('gameState', 'invalid json{');
      expect(loadGameStateFromLocalStorage()).toBeNull();
      // Corrupted data should be removed
      expect(global.localStorage.getItem('gameState')).toBeNull();
    });

    it('handles whitespace-only values', () => {
      global.localStorage.setItem('gameState', '   ');
      expect(loadGameStateFromLocalStorage()).toBeNull();
    });
  });

  describe('saveStatsToLocalStorage', () => {
    it('saves and loads stats', () => {
      const stats = { gamesPlayed: 5, gamesWon: 3 };
      const result = saveStatsToLocalStorage(stats);
      expect(result).toBe(true);
      const loaded = loadStatsFromLocalStorage();
      expect(loaded).toEqual(stats);
    });

    it('returns false for null stats', () => {
      expect(saveStatsToLocalStorage(null)).toBe(false);
    });

    it('handles storage errors gracefully', () => {
      const setItemSpy = jest.spyOn(global.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const stats = { gamesPlayed: 5 };
      expect(saveStatsToLocalStorage(stats)).toBe(false);
      expect(setItemSpy).toHaveBeenCalled();
      
      setItemSpy.mockRestore();
    });
  });

  describe('loadStatsFromLocalStorage', () => {
    it('returns null for empty storage', () => {
      expect(loadStatsFromLocalStorage()).toBeNull();
    });

    it('returns null for invalid JSON and removes corrupted data', () => {
      global.localStorage.setItem('gameStats', 'not json');
      expect(loadStatsFromLocalStorage()).toBeNull();
      expect(global.localStorage.getItem('gameStats')).toBeNull();
    });
  });

  describe('saveSettingsToLocalStorage', () => {
    it('saves and loads settings', () => {
      const settings = { display: { darkMode: true } };
      const result = saveSettingsToLocalStorage(settings);
      expect(result).toBe(true);
      const loaded = loadSettingsFromLocalStorage();
      expect(loaded).toEqual(settings);
    });

    it('returns false for null settings', () => {
      expect(saveSettingsToLocalStorage(null)).toBe(false);
    });

    it('handles storage errors gracefully', () => {
      const setItemSpy = jest.spyOn(global.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const settings = { display: { darkMode: true } };
      expect(saveSettingsToLocalStorage(settings)).toBe(false);
      expect(setItemSpy).toHaveBeenCalled();
      
      setItemSpy.mockRestore();
    });
  });

  describe('loadSettingsFromLocalStorage', () => {
    it('returns null for empty storage', () => {
      expect(loadSettingsFromLocalStorage()).toBeNull();
    });

    it('returns null for invalid JSON and removes corrupted data', () => {
      global.localStorage.setItem('gameSettings', 'corrupted{');
      expect(loadSettingsFromLocalStorage()).toBeNull();
      expect(global.localStorage.getItem('gameSettings')).toBeNull();
    });
  });

  describe('isNewToGame', () => {
    it('returns true when no game state or stats exist', () => {
      expect(isNewToGame()).toBe(true);
    });

    it('returns false when game state exists', () => {
      global.localStorage.setItem('gameState', JSON.stringify({ guesses: [] }));
      expect(isNewToGame()).toBe(false);
    });

    it('returns false when stats exist', () => {
      global.localStorage.setItem('gameStats', JSON.stringify({ totalGames: 1 }));
      expect(isNewToGame()).toBe(false);
    });

    it('handles practice mode keys correctly', () => {
      expect(isNewToGame('night', 5)).toBe(true);
      global.localStorage.setItem('gameState_night_5', JSON.stringify({ guesses: [] }));
      expect(isNewToGame('night', 5)).toBe(false);
      expect(isNewToGame()).toBe(true); // Regular mode still new
    });
  });

  describe('localStorage unavailable scenarios', () => {
    it('handles missing localStorage gracefully', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      delete window.localStorage;

      const gameState = { guesses: [['1', '2', '3']] };
      expect(saveGameStateToLocalStorage(gameState)).toBe(false);
      expect(loadGameStateFromLocalStorage()).toBeNull();

      // Restore
      global.localStorage = originalLocalStorage;
      window.localStorage = originalLocalStorage;
    });

    it('handles localStorage with missing methods', () => {
      const brokenStorage = {};
      global.localStorage = brokenStorage;
      window.localStorage = brokenStorage;

      const gameState = { guesses: [['1', '2', '3']] };
      expect(saveGameStateToLocalStorage(gameState)).toBe(false);
      expect(loadGameStateFromLocalStorage()).toBeNull();

      // Restore
      global.localStorage = new LocalStorageMock();
      window.localStorage = global.localStorage;
    });
  });
});
