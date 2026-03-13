import { vi } from 'vitest';
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

import type { Solution } from './gameDataLoader';

type RouteCombo = string[] | string;

const mockAnswers: RouteCombo[] = [['A', 'B', 'C'], ['1', '2', '3']];
const mockSolutions: Record<string, Solution> = {
  'A-B-C': {
    origin: 'R01',
    first_transfer_arrival: '',
    first_transfer_departure: '',
    second_transfer_arrival: '',
    second_transfer_departure: '',
    destination: 'R02'
  },
  '1-2-3': {
    origin: 'R10',
    first_transfer_arrival: '',
    first_transfer_departure: '',
    second_transfer_arrival: '',
    second_transfer_departure: '',
    destination: 'R20'
  },
};
const mockRoutings: Record<string, string[]> = { 'A': [], 'B': [], 'C': [], '1': [], '2': [], '3': [] };

const createMockModule = (data: unknown) => ({ __esModule: true, default: data });

vi.mock('../data/weekday/answers.json', () => createMockModule(mockAnswers));
vi.mock('../data/weekday/solutions.json', () => createMockModule(mockSolutions));
vi.mock('../data/weekday/routings.json', () => createMockModule(mockRoutings));

vi.mock('../data/weekend/answers.json', () => createMockModule(mockAnswers));
vi.mock('../data/weekend/solutions.json', () => createMockModule(mockSolutions));
vi.mock('../data/weekend/routings.json', () => createMockModule(mockRoutings));

vi.mock('../data/night/answers.json', () => createMockModule(mockAnswers));
vi.mock('../data/night/solutions.json', () => createMockModule(mockSolutions));
vi.mock('../data/night/routings.json', () => createMockModule(mockRoutings));

vi.mock('../data/accessible/answers.json', () => createMockModule(mockAnswers));
vi.mock('../data/accessible/solutions.json', () => createMockModule(mockSolutions));
vi.mock('../data/accessible/routings.json', () => createMockModule(mockRoutings));


describe('gameDataLoader', () => {
  beforeEach(() => {
    clearGameDataCache();
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('removeDisconnectedRouteCombos', () => {
    it('filters out invalid Staten Island route combinations', () => {
      const answers: RouteCombo[] = [['A', 'B', 'C'], ['SI', 'C', 'R'], ['1', '4', 'SI']];
      const solutions: Record<string, Solution> = {
        'A-B-C': {
          origin: 'R01',
          first_transfer_arrival: '',
          first_transfer_departure: '',
          second_transfer_arrival: '',
          second_transfer_departure: '',
          destination: 'R02'
        },
        'SI-C-R': {
          origin: '',
          first_transfer_arrival: 'S14',
          first_transfer_departure: '142',
          second_transfer_arrival: '',
          second_transfer_departure: '',
          destination: ''
        },
        '1-4-SI': {
          origin: '',
          first_transfer_arrival: '420',
          first_transfer_departure: 'S31',
          second_transfer_arrival: '',
          second_transfer_departure: '',
          destination: ''
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
      const answers: RouteCombo[] = [['A', 'B', 'C']];
      const solutions: Record<string, Solution> = {
        'A-B-C': {
          origin: 'R01',
          first_transfer_arrival: '',
          first_transfer_departure: '',
          second_transfer_arrival: '',
          second_transfer_departure: '',
          destination: 'R02'
        }
      };
      const result = removeDisconnectedRouteCombos(answers, solutions);
      expect(result.answers).toEqual([['A', 'B', 'C']]);
      expect(result.solutions).toHaveProperty('A-B-C');
    });

    it('handles array and string combo formats', () => {
      const answers: RouteCombo[] = [['A', 'B'], 'C-D'];
      const solutions: Record<string, Solution> = {
        'A-B': {
          origin: 'R01',
          first_transfer_arrival: '',
          first_transfer_departure: '',
          second_transfer_arrival: '',
          second_transfer_departure: '',
          destination: 'R02'
        },
        'C-D': {
          origin: 'R03',
          first_transfer_arrival: '',
          first_transfer_departure: '',
          second_transfer_arrival: '',
          second_transfer_departure: '',
          destination: 'R04'
        }
      };
      const result = removeDisconnectedRouteCombos(answers, solutions);
      expect(result.answers).toEqual([['A', 'B'], ['C', 'D']]);
    });
  });

  describe('todayGameIndex', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates game index from epoch', () => {
      vi.setSystemTime(new Date('2022-01-30T12:00:00'));
      const index = todayGameIndex();
      expect(index).toBe(1);
    });

    it('handles dates before epoch', () => {
      vi.setSystemTime(new Date('2022-01-28T12:00:00'));
      const index = todayGameIndex();
      expect(index).toBe(-1);
    });

    it('returns consistent index for same day', () => {
      vi.setSystemTime(new Date('2022-02-01T12:00:00'));
      const index1 = todayGameIndex();
      vi.setSystemTime(new Date('2022-02-01T23:59:59'));
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
      expect(data1).toBe(data2);
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
      expect(data1).toBe(data2);
      expect(data1.currentMode).toBe('weekday');
    });

    it('handles loading errors gracefully', async () => {
      clearGameDataCache();
      
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
      await loadPromise;
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
      await loadPromise;
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