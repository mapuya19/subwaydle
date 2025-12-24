// Define mocks before imports (Jest hoists mock calls)
const mockRoutes = {
  '1': { id: '1', name: '1', color: '#db2828' },
  '2': { id: '2', name: '2', color: '#db2828' },
  '3': { id: '3', name: '3', color: '#db2828' },
  '4': { id: '4', name: '4', color: '#21ba45' },
  '5': { id: '5', name: '5', color: '#21ba45' },
  '6': { id: '6', name: '6', color: '#21ba45' },
  'A': { id: 'A', name: 'A', color: '#0039a6' },
  'SI': { id: 'SI', name: 'SI', color: '#6cbe45' },
  'GS': { id: 'GS', name: 'GS', color: '#6cbe45' },
};

const mockTransfers = {
  'R01': ['R10'],
  'R03': ['R15'],
};

const mockGameData = {
  answers: [['1', '2', '3'], ['4', '5', '6']],
  solutions: {
    '1-2-3': {
      origin: 'R01',
      destination: 'R02',
      first_transfer_arrival: 'R03',
      first_transfer_departure: 'R03',
      second_transfer_arrival: 'R04',
      second_transfer_departure: 'R04',
    },
    '4-5-6': {
      origin: 'R10',
      destination: 'R20',
      first_transfer_arrival: 'R15',
      first_transfer_departure: 'R15',
      second_transfer_arrival: 'R18',
      second_transfer_departure: 'R18',
    },
  },
  routings: {
    '1': ['R01', 'R02', 'R03', 'R04'],
    '2': ['R03', 'R05', 'R06'],
    '3': ['R04', 'R07', 'R08'],
    '4': ['R10', 'R11', 'R15'],
    '5': ['R15', 'R16', 'R18'],
    '6': ['R18', 'R19', 'R20'],
  },
};

jest.mock('./gameDataLoader', () => ({
  __esModule: true,
  getGameData: () => mockGameData,
  todayGameIndex: () => 0,
  NIGHT_GAMES: [350, 351],
  ACCESSIBLE_GAME: 793,
}));

jest.mock('./../data/routes.json', () => ({
  '1': { id: '1', name: '1', color: '#db2828' },
  '2': { id: '2', name: '2', color: '#db2828' },
  '3': { id: '3', name: '3', color: '#db2828' },
  '4': { id: '4', name: '4', color: '#21ba45' },
  '5': { id: '5', name: '5', color: '#21ba45' },
  '6': { id: '6', name: '6', color: '#21ba45' },
  'A': { id: 'A', name: 'A', color: '#0039a6' },
  'SI': { id: 'SI', name: 'SI', color: '#6cbe45' },
  'GS': { id: 'GS', name: 'GS', color: '#6cbe45' },
}), { virtual: true });

jest.mock('./../data/transfers.json', () => ({
  'R01': ['R10'],
  'R03': ['R15'],
}), { virtual: true });

import {
  isValidGuess,
  isWinningGuess,
  checkGuessStatuses,
  routesWithNoService,
  isNight,
  isAccessible,
  isWeekend,
  todaysTrip,
  todaysSolution,
  flattenedTodaysTrip,
} from './answerValidations';

describe('answerValidations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidGuess', () => {
    it('validates guess format and existence', () => {
      expect(isValidGuess([])).toBe(false);
      expect(isValidGuess(['1', '2'])).toBe(false);
      expect(isValidGuess(['1', '2', '3', '4'])).toBe(false);
      expect(isValidGuess(['1', '2', '3'])).toBe(true);
      expect(isValidGuess(['X', 'Y', 'Z'])).toBe(false);
    });

    it('returns false for non-existent route combinations', () => {
      expect(isValidGuess(['9', '9', '9'])).toBe(false);
    });
  });

  describe('isWinningGuess', () => {
    it('checks if guess matches solution', () => {
      expect(isWinningGuess(['1', '2', '3'])).toBe(true);
      expect(isWinningGuess(['X', 'Y', 'Z'])).toBe(false);
      expect(isWinningGuess(['4', '5', '6'])).toBe(false); // Different game index
    });
  });

  describe('checkGuessStatuses', () => {
    it('returns correct status for exact match', () => {
      const result = checkGuessStatuses(['1', '2', '3']);
      expect(result).toEqual(['correct', 'correct', 'correct']);
    });

    it('returns absent for routes not in solution', () => {
      // Use routes that exist in mock data but are wrong
      const result = checkGuessStatuses(['4', '5', '6']);
      // These routes exist but don't match the solution '1-2-3'
      expect(result[0]).toBe('absent');
      expect(result[1]).toBe('absent');
      expect(result[2]).toBe('absent');
    });

    it('handles mixed correct and incorrect guesses', () => {
      // First route is correct, others are wrong
      const result = checkGuessStatuses(['1', '4', '5']);
      expect(result[0]).toBe('correct');
      // Routes 4 and 5 exist but are not in the answer
      expect(result[1]).toBe('absent');
      expect(result[2]).toBe('absent');
    });
  });

  describe('routesWithNoService', () => {
    it('returns empty array for weekday mode', () => {
      expect(routesWithNoService(null)).toEqual([]);
      expect(routesWithNoService('weekday')).toEqual([]);
    });

    it('returns weekend routes for weekend mode', () => {
      const result = routesWithNoService('weekend');
      expect(result).toContain('B');
      expect(result).toContain('W');
    });

    it('returns night routes for night mode', () => {
      const result = routesWithNoService('night');
      expect(result).toContain('B');
      expect(result).toContain('C');
      expect(result).toContain('W');
      expect(result).toContain('GS');
    });
  });

  describe('isNight', () => {
    it('returns false for normal game index', () => {
      expect(isNight(null)).toBe(false);
    });

    it('returns true for night practice mode', () => {
      expect(isNight('night')).toBe(true);
    });

    it('returns false for other practice modes', () => {
      expect(isNight('weekday')).toBe(false);
      expect(isNight('weekend')).toBe(false);
      expect(isNight('accessible')).toBe(false);
    });
  });

  describe('isAccessible', () => {
    it('returns false for normal game index', () => {
      expect(isAccessible(null)).toBe(false);
    });

    it('returns true for accessible practice mode', () => {
      expect(isAccessible('accessible')).toBe(true);
    });

    it('returns false for other practice modes', () => {
      expect(isAccessible('weekday')).toBe(false);
      expect(isAccessible('weekend')).toBe(false);
      expect(isAccessible('night')).toBe(false);
    });
  });

  describe('isWeekend', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns true for weekend practice mode', () => {
      expect(isWeekend('weekend')).toBe(true);
    });

    it('returns false for non-weekend practice modes', () => {
      expect(isWeekend('weekday')).toBe(false);
      expect(isWeekend('night')).toBe(false);
      expect(isWeekend('accessible')).toBe(false);
    });

    it('detects weekend based on current day when no practice mode', () => {
      // Mock Saturday (Jan 6, 2024 is a Saturday)
      jest.setSystemTime(new Date('2024-01-06T12:00:00'));
      expect(isWeekend(null)).toBe(true);

      // Mock Sunday (Jan 7, 2024 is a Sunday)
      jest.setSystemTime(new Date('2024-01-07T12:00:00'));
      expect(isWeekend(null)).toBe(true);

      // Mock Monday (Jan 8, 2024 is a Monday)
      jest.setSystemTime(new Date('2024-01-08T12:00:00'));
      expect(isWeekend(null)).toBe(false);
    });
  });

  describe('todaysTrip', () => {
    it('returns current game trip', () => {
      const trip = todaysTrip();
      expect(trip).toEqual(['1', '2', '3']);
    });

    it('handles practice mode and game index', () => {
      const trip = todaysTrip('weekday', 1);
      expect(trip).toEqual(['4', '5', '6']);
    });

    it('wraps around when index exceeds answers length', () => {
      const trip = todaysTrip('weekday', 10);
      expect(trip).toBeDefined();
      expect(Array.isArray(trip)).toBe(true);
      expect(trip.length).toBe(3);
    });
  });

  describe('todaysSolution', () => {
    it('returns solution for current game', () => {
      const solution = todaysSolution();
      expect(solution).toEqual({
        origin: 'R01',
        destination: 'R02',
        first_transfer_arrival: 'R03',
        first_transfer_departure: 'R03',
        second_transfer_arrival: 'R04',
        second_transfer_departure: 'R04',
      });
    });

    it('handles practice mode and game index', () => {
      const solution = todaysSolution('weekday', 1);
      expect(solution.origin).toBe('R10');
      expect(solution.destination).toBe('R20');
    });
  });

  describe('flattenedTodaysTrip', () => {
    it('returns flattened trip string', () => {
      expect(flattenedTodaysTrip()).toBe('1-2-3');
    });

    it('handles practice mode and game index', () => {
      expect(flattenedTodaysTrip('weekday', 1)).toBe('4-5-6');
    });
  });
});
