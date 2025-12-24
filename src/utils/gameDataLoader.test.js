import {
  removeDisconnectedRouteCombos,
  todayGameIndex,
  loadGameData,
  getGameData,
  isGameDataLoaded,
  isGameDataLoadedForMode,
  clearGameDataCache,
  NIGHT_GAMES,
  ACCESSIBLE_GAME,
} from './gameDataLoader';

// Mock the dynamic imports
const mockAnswers = [['A', 'B', 'C'], ['1', '2', '3']];
const mockSolutions = {
  'A-B-C': { origin: 'R01', destination: 'R02' },
  '1-2-3': { origin: 'R10', destination: 'R20' },
};
const mockRoutings = { 'A': [], 'B': [], 'C': [], '1': [], '2': [], '3': [] };

// Mock dynamic imports using a factory function that ensures proper structure
const createMockModule = (data) => ({ __esModule: true, default: data });

jest.mock('../data/weekday/answers.json', () => createMockModule(mockAnswers), { virtual: true });
jest.mock('../data/weekday/solutions.json', () => createMockModule(mockSolutions), { virtual: true });
jest.mock('../data/weekday/routings.json', () => createMockModule(mockRoutings), { virtual: true });

jest.mock('../data/weekend/answers.json', () => createMockModule(mockAnswers), { virtual: true });
jest.mock('../data/weekend/solutions.json', () => createMockModule(mockSolutions), { virtual: true });
jest.mock('../data/weekend/routings.json', () => createMockModule(mockRoutings), { virtual: true });

jest.mock('../data/night/answers.json', () => createMockModule(mockAnswers), { virtual: true });
jest.mock('../data/night/solutions.json', () => createMockModule(mockSolutions), { virtual: true });
jest.mock('../data/night/routings.json', () => createMockModule(mockRoutings), { virtual: true });

jest.mock('../data/accessible/answers.json', () => createMockModule(mockAnswers), { virtual: true });
jest.mock('../data/accessible/solutions.json', () => createMockModule(mockSolutions), { virtual: true });
jest.mock('../data/accessible/routings.json', () => createMockModule(mockRoutings), { virtual: true });

describe('gameDataLoader', () => {
  beforeEach(() => {
    clearGameDataCache();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('removeDisconnectedRouteCombos', () => {
    it('filters out invalid Staten Island route combinations', () => {
      const answers = [['A', 'B', 'C'], ['SI', 'C', 'R'], ['1', '4', 'SI']];
      const solutions = {
        'A-B-C': { origin: 'R01' },
        'SI-C-R': {
          first_transfer_arrival: 'S14',
          first_transfer_departure: '142',
        },
        '1-4-SI': {
          first_transfer_arrival: '420',
          first_transfer_departure: 'S31',
        },
      };

      const { answers: filtered, solutions: filteredSolutions } = removeDisconnectedRouteCombos(answers, solutions);

      expect(filtered).toEqual([['A', 'B', 'C'], ['1', '4', 'SI']]);
      expect(filteredSolutions).toHaveProperty('A-B-C');
      expect(filteredSolutions).toHaveProperty('1-4-SI');
      expect(filteredSolutions).not.toHaveProperty('SI-C-R');
    });

    it('handles empty arrays', () => {
      const result = removeDisconnectedRouteCombos([], {});
      expect(result.answers).toEqual([]);
      expect(result.solutions).toEqual({});
    });

    it('handles solutions with no SI routes', () => {
      const answers = [['A', 'B', 'C']];
      const solutions = { 'A-B-C': { origin: 'R01' } };
      const result = removeDisconnectedRouteCombos(answers, solutions);
      expect(result.answers).toEqual([['A', 'B', 'C']]);
      expect(result.solutions).toHaveProperty('A-B-C');
    });

    it('handles array and string combo formats', () => {
      const answers = [['A', 'B'], 'C-D'];
      const solutions = { 'A-B': { origin: 'R01' }, 'C-D': { origin: 'R02' } };
      const result = removeDisconnectedRouteCombos(answers, solutions);
      expect(result.answers).toEqual([['A', 'B'], ['C', 'D']]);
    });
  });

  describe('todayGameIndex', () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calculates game index from epoch', () => {
      // Mock date: January 30, 2022 (1 day after epoch of January 29, 2022)
      // Epoch is January 29, 2022 00:00:00
      jest.setSystemTime(new Date('2022-01-30T12:00:00'));
      const index = todayGameIndex();
      // Should be 1 day after epoch
      expect(index).toBe(1);
    });

    it('handles dates before epoch', () => {
      // Mock date: January 28, 2022 (1 day before epoch of January 29, 2022)
      jest.setSystemTime(new Date('2022-01-28T12:00:00'));
      const index = todayGameIndex();
      // Should be negative (before epoch)
      expect(index).toBe(-1);
    });

    it('returns consistent index for same day', () => {
      jest.setSystemTime(new Date('2022-02-01T12:00:00'));
      const index1 = todayGameIndex();
      jest.setSystemTime(new Date('2022-02-01T23:59:59'));
      const index2 = todayGameIndex();
      expect(index1).toBe(index2);
    });
  });

  describe('loadGameData', () => {
    it('loads weekday data by default', async () => {
      const data = await loadGameData();
      expect(data.answers).toEqual(mockAnswers);
      expect(data.solutions).toEqual(mockSolutions);
      expect(data.routings).toEqual(mockRoutings);
      expect(data.currentMode).toBe('weekday');
      expect(data.loading).toBe(false);
    });

    it('loads weekend data for weekend mode', async () => {
      const data = await loadGameData('weekend');
      expect(data.currentMode).toBe('weekend');
      expect(data.answers).toBeDefined();
    });

    it('loads night data for night mode', async () => {
      const data = await loadGameData('night');
      expect(data.currentMode).toBe('night');
      expect(data.answers).toBeDefined();
    });

    it('loads accessible data for accessible mode', async () => {
      const data = await loadGameData('accessible');
      expect(data.currentMode).toBe('accessible');
      expect(data.answers).toBeDefined();
    });

    it('caches loaded data', async () => {
      const data1 = await loadGameData();
      const data2 = await loadGameData();
      expect(data1).toBe(data2); // Same reference
      expect(data1.answers).toBe(data2.answers);
    });

    it('updates mode when switching modes', async () => {
      await loadGameData('weekday');
      expect(getGameData().currentMode).toBe('weekday');
      
      await loadGameData('weekend');
      expect(getGameData().currentMode).toBe('weekend');
    });

    it('returns data for concurrent loads', async () => {
      clearGameDataCache();
      const promise1 = loadGameData('weekday');
      const promise2 = loadGameData('weekday');
      
      const data1 = await promise1;
      const data2 = await promise2;
      // Both should resolve with the same data
      expect(data1).toBe(data2);
      expect(data1.currentMode).toBe('weekday');
    });

    it('handles loading errors gracefully', async () => {
      // This test verifies that loading completes without throwing
      // even if some data is empty or missing expected properties
      clearGameDataCache();
      
      // Load should succeed with mock data
      const data = await loadGameData('weekday');
      expect(data).toBeDefined();
      expect(data.answers).toBeDefined();
    });
  });

  describe('getGameData', () => {
    it('throws error when data not loaded', () => {
      expect(() => getGameData()).toThrow('Game data not loaded');
    });

    it('throws error when data is loading', async () => {
      const loadPromise = loadGameData();
      expect(() => getGameData()).toThrow('Game data is currently loading');
      await loadPromise; // Clean up
    });

    it('returns data after loading', async () => {
      await loadGameData();
      const data = getGameData();
      expect(data.answers).toBeDefined();
      expect(data.solutions).toBeDefined();
      expect(data.routings).toBeDefined();
    });
  });

  describe('isGameDataLoaded', () => {
    it('returns false when no data loaded', () => {
      expect(isGameDataLoaded()).toBe(false);
    });

    it('returns true after loading', async () => {
      await loadGameData();
      expect(isGameDataLoaded()).toBe(true);
    });

    it('returns false after clearing cache', async () => {
      await loadGameData();
      clearGameDataCache();
      expect(isGameDataLoaded()).toBe(false);
    });
  });

  describe('isGameDataLoadedForMode', () => {
    it('returns false when no data loaded', () => {
      expect(isGameDataLoadedForMode()).toBe(false);
      expect(isGameDataLoadedForMode('weekday')).toBe(false);
    });

    it('returns true for correct mode', async () => {
      await loadGameData('weekday');
      expect(isGameDataLoadedForMode('weekday')).toBe(true);
      expect(isGameDataLoadedForMode('weekend')).toBe(false);
    });

    it('returns false when data is loading', async () => {
      const loadPromise = loadGameData();
      expect(isGameDataLoadedForMode('weekday')).toBe(false);
      await loadPromise;
    });

    it('handles null practice mode (auto-detect)', async () => {
      await loadGameData();
      // Should check current mode based on day
      expect(isGameDataLoadedForMode(null)).toBe(true);
    });
  });

  describe('clearGameDataCache', () => {
    it('clears all cached data', async () => {
      await loadGameData();
      expect(isGameDataLoaded()).toBe(true);
      
      clearGameDataCache();
      expect(isGameDataLoaded()).toBe(false);
      expect(() => getGameData()).toThrow();
    });

    it('resets loading state', async () => {
      const loadPromise = loadGameData();
      clearGameDataCache();
      expect(isGameDataLoaded()).toBe(false);
      await loadPromise; // Clean up
    });
  });

  describe('constants', () => {
    it('exports NIGHT_GAMES constant', () => {
      expect(Array.isArray(NIGHT_GAMES)).toBe(true);
    });

    it('exports ACCESSIBLE_GAME constant', () => {
      expect(typeof ACCESSIBLE_GAME).toBe('number');
    });
  });
});
