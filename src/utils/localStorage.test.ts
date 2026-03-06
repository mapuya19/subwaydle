import {
  saveGameStateToLocalStorage,
  loadGameStateFromLocalStorage,
  saveStatsToLocalStorage,
  loadStatsFromLocalStorage,
  saveSettingsToLocalStorage,
  loadSettingsFromLocalStorage,
  isNewToGame,
} from './localStorage';

interface GameState {
  guesses: string[][];
  answer: string;
}

interface Stats {
  gamesPlayed: number;
  gamesWon: number;
}

interface Settings {
  display: {
    darkMode: boolean;
  };
}

interface LocalStorageMock {
  store: Record<string, string>;
  shouldThrow: boolean;
  clear(): void;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class LocalStorageMock implements LocalStorageMock {
  store: Record<string, string>;
  shouldThrow: boolean;

  constructor() {
    this.store = {};
    this.shouldThrow = false;
  }

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    if (this.shouldThrow) {
      throw new Error('Storage quota exceeded');
    }
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrow) {
      throw new Error('Storage quota exceeded');
    }
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

let originalLocalStorage: any;

beforeAll(() => {
  originalLocalStorage = global.localStorage;
  const mockInstance = new LocalStorageMock();
  global.localStorage = mockInstance as unknown as Storage;
  
  Object.defineProperty(window, 'localStorage', {
    value: mockInstance,
    writable: true,
    configurable: true,
  });
  
  if (typeof (global as any).localStorage === 'undefined') {
    (global as any).localStorage = mockInstance;
  }
});

afterAll(() => {
  global.localStorage = originalLocalStorage;
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    ((global.localStorage as unknown) as LocalStorageMock).clear();
    ((global.localStorage as unknown) as LocalStorageMock).shouldThrow = false;
    ((window.localStorage as unknown) as LocalStorageMock).clear();
    ((window.localStorage as unknown) as LocalStorageMock).shouldThrow = false;
    jest.clearAllMocks();
  });

  afterEach(() => {
    ((global.localStorage as unknown) as LocalStorageMock).shouldThrow = false;
    ((window.localStorage as unknown) as LocalStorageMock).shouldThrow = false;
  });

  describe('saveGameStateToLocalStorage', () => {
    it('saves and loads game state', () => {
      const gameState: GameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      const result = saveGameStateToLocalStorage(gameState);
      expect(result).toBe(true);
      const loaded = loadGameStateFromLocalStorage();
      expect(loaded).toEqual(gameState);
    });

    it('returns false for null game state', () => {
      expect(saveGameStateToLocalStorage(null)).toBe(false);
    });

    it('handles practice mode keys correctly', () => {
      const gameState: GameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      saveGameStateToLocalStorage(gameState, 'night', 5);
      const loaded = loadGameStateFromLocalStorage('night', 5);
      expect(loaded).toEqual(gameState);
      
      expect(loadGameStateFromLocalStorage()).toBeNull();
    });

    it('handles storage errors gracefully', () => {
      const setItemSpy = jest.spyOn(global.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const gameState: GameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
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
      expect(global.localStorage.getItem('gameState')).toBeNull();
    });

    it('handles whitespace-only values', () => {
      global.localStorage.setItem('gameState', '   ');
      expect(loadGameStateFromLocalStorage()).toBeNull();
    });
  });

  describe('saveStatsToLocalStorage', () => {
    it('saves and loads stats', () => {
      const stats: Stats = { gamesPlayed: 5, gamesWon: 3 };
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
      
      const stats: Stats = { gamesPlayed: 5, gamesWon: 3 };
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
      const settings: Settings = { display: { darkMode: true } };
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
      
      const settings: Settings = { display: { darkMode: true } };
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
      expect(isNewToGame()).toBe(true);
    });
  });

  describe('localStorage unavailable scenarios', () => {
    it('handles missing localStorage gracefully', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      delete (window as any).localStorage;

      const gameState: GameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      expect(saveGameStateToLocalStorage(gameState)).toBe(false);
      expect(loadGameStateFromLocalStorage()).toBeNull();

      global.localStorage = originalLocalStorage;
      window.localStorage = originalLocalStorage;
    });

    it('handles localStorage with missing methods', () => {
      const brokenStorage: any = {};
      global.localStorage = brokenStorage;
      window.localStorage = brokenStorage;

      const gameState: GameState = { guesses: [['1', '2', '3']], answer: '1-2-3' };
      expect(saveGameStateToLocalStorage(gameState)).toBe(false);
      expect(loadGameStateFromLocalStorage()).toBeNull();

      global.localStorage = new LocalStorageMock() as unknown as Storage;
      window.localStorage = global.localStorage;
    });
  });
});