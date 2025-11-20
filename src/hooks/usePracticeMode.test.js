import { renderHook, act } from '@testing-library/react';
import { usePracticeMode } from './usePracticeMode';

// Mock the settings utility
jest.mock('../utils/settings', () => ({
  saveSettings: jest.fn(),
}));

describe('usePracticeMode', () => {
  let mockSetSettings;
  let defaultSettings;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetSettings = jest.fn();
    defaultSettings = {
      display: {
        showAnswerStatusBadges: false,
        darkMode: false,
      },
      practice: {
        enabled: false,
        mode: null,
      },
    };

    // Reset window.location
    delete window.location;
    window.location = {
      search: '',
      href: 'http://localhost/',
    };
    window.history = {
      replaceState: jest.fn(),
    };
  });

  afterEach(() => {
    delete window.location;
    delete window.history;
  });

  describe('URL parameter reading on initialization', () => {
    test('reads practice mode and game index from URL synchronously', () => {
      window.location.search = '?practice=weekend&game=2540';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      // Should read URL params immediately on first render
      expect(result.current.practiceMode).toBe('weekend');
      expect(result.current.urlPracticeGameIndex).toBe(2540);
      expect(result.current.effectivePracticeGameIndex).toBe(2540);
    });

    test('handles weekday practice mode', () => {
      window.location.search = '?practice=weekday&game=100';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBe('weekday');
      expect(result.current.urlPracticeGameIndex).toBe(100);
    });

    test('handles night practice mode', () => {
      window.location.search = '?practice=night&game=50';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBe('night');
      expect(result.current.urlPracticeGameIndex).toBe(50);
    });

    test('handles accessible practice mode', () => {
      window.location.search = '?practice=accessible&game=793';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBe('accessible');
      expect(result.current.urlPracticeGameIndex).toBe(793);
    });

    test('returns null when no URL parameters', () => {
      window.location.search = '';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBeNull();
      expect(result.current.urlPracticeGameIndex).toBeNull();
      expect(result.current.effectivePracticeGameIndex).toBeNull();
    });

    test('ignores invalid practice mode', () => {
      window.location.search = '?practice=invalid&game=100';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBeNull();
      expect(result.current.urlPracticeGameIndex).toBeNull();
    });

    test('ignores invalid game index (NaN)', () => {
      window.location.search = '?practice=weekend&game=invalid';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBeNull();
      expect(result.current.urlPracticeGameIndex).toBeNull();
    });

    test('ignores negative game index', () => {
      window.location.search = '?practice=weekend&game=-1';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBeNull();
      expect(result.current.urlPracticeGameIndex).toBeNull();
    });

    test('ignores missing game parameter', () => {
      window.location.search = '?practice=weekend';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBeNull();
      expect(result.current.urlPracticeGameIndex).toBeNull();
    });

    test('handles game index of 0', () => {
      window.location.search = '?practice=weekend&game=0';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBe('weekend');
      expect(result.current.urlPracticeGameIndex).toBe(0);
    });
  });

  describe('settings update', () => {
    test('updates settings when URL params are present', () => {
      window.location.search = '?practice=weekend&game=2540';

      renderHook(() => usePracticeMode(defaultSettings, mockSetSettings));

      // Should call setSettings to enable practice mode
      expect(mockSetSettings).toHaveBeenCalled();
      const updateCall = mockSetSettings.mock.calls[0][0];
      const updatedSettings = updateCall(defaultSettings);

      expect(updatedSettings.practice.enabled).toBe(true);
      expect(updatedSettings.practice.mode).toBe('weekend');
    });

    test('does not update settings if already set correctly', () => {
      window.location.search = '?practice=weekend&game=2540';
      const settingsWithPractice = {
        ...defaultSettings,
        practice: {
          enabled: true,
          mode: 'weekend',
        },
      };

      renderHook(() => usePracticeMode(settingsWithPractice, mockSetSettings));

      // Should still call setSettings, but the function should return prevSettings
      expect(mockSetSettings).toHaveBeenCalled();
      const updateCall = mockSetSettings.mock.calls[0][0];
      const updatedSettings = updateCall(settingsWithPractice);

      // Should return previous settings if already correct
      expect(updatedSettings).toBe(settingsWithPractice);
    });

    test('does not update settings when no URL params', () => {
      window.location.search = '';

      renderHook(() => usePracticeMode(defaultSettings, mockSetSettings));

      // Should not call setSettings when no URL params
      expect(mockSetSettings).not.toHaveBeenCalled();
    });
  });

  describe('effectivePracticeGameIndex computation', () => {
    test('uses practiceGameIndex when set (clamped value)', () => {
      window.location.search = '?practice=weekend&game=2540';

      const { result, rerender } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      // Initially uses urlPracticeGameIndex
      expect(result.current.effectivePracticeGameIndex).toBe(2540);

      // Simulate practiceGameIndex being set (clamped)
      act(() => {
        result.current.setPracticeGameIndex(100);
      });

      rerender();

      // Should prefer practiceGameIndex over urlPracticeGameIndex
      expect(result.current.effectivePracticeGameIndex).toBe(100);
      expect(result.current.practiceGameIndex).toBe(100);
    });

    test('falls back to urlPracticeGameIndex when practiceGameIndex is null', () => {
      window.location.search = '?practice=weekend&game=2540';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceGameIndex).toBeNull();
      expect(result.current.effectivePracticeGameIndex).toBe(2540);
    });

    test('returns null when no game index available', () => {
      window.location.search = '';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.effectivePracticeGameIndex).toBeNull();
    });
  });

  describe('practiceMode computation', () => {
    test('prioritizes URL params over settings', () => {
      window.location.search = '?practice=weekend&game=2540';
      const settingsWithDifferentMode = {
        ...defaultSettings,
        practice: {
          enabled: true,
          mode: 'weekday', // Different from URL
        },
      };

      const { result } = renderHook(() =>
        usePracticeMode(settingsWithDifferentMode, mockSetSettings)
      );

      // Should use URL param, not settings
      expect(result.current.practiceMode).toBe('weekend');
    });

    test('uses settings when no URL params', () => {
      window.location.search = '';
      const settingsWithPractice = {
        ...defaultSettings,
        practice: {
          enabled: true,
          mode: 'weekday',
        },
      };

      const { result } = renderHook(() =>
        usePracticeMode(settingsWithPractice, mockSetSettings)
      );

      expect(result.current.practiceMode).toBe('weekday');
    });

    test('returns null when no practice mode in URL or settings', () => {
      window.location.search = '';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBeNull();
    });
  });

  describe('handlePracticeModeChange', () => {
    test('clears URL params when practice mode is disabled', () => {
      window.location.search = '?practice=weekend&game=2540';
      window.location.href = 'http://localhost/?practice=weekend&game=2540';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      const updatedSettings = {
        ...defaultSettings,
        practice: {
          enabled: false,
          mode: null,
        },
      };

      act(() => {
        result.current.handlePracticeModeChange(updatedSettings);
      });

      expect(window.history.replaceState).toHaveBeenCalled();
      expect(mockSetSettings).toHaveBeenCalledWith(updatedSettings);
    });

    test('does not clear URL params when practice mode is enabled', () => {
      window.location.search = '?practice=weekend&game=2540';
      window.location.href = 'http://localhost/?practice=weekend&game=2540';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      const updatedSettings = {
        ...defaultSettings,
        practice: {
          enabled: true,
          mode: 'weekend',
        },
      };

      act(() => {
        result.current.handlePracticeModeChange(updatedSettings);
      });

      expect(window.history.replaceState).not.toHaveBeenCalled();
      expect(mockSetSettings).toHaveBeenCalledWith(updatedSettings);
    });
  });

  describe('previousPracticeMode tracking', () => {
    test('tracks previous practice mode', () => {
      window.location.search = '?practice=weekend&game=2540';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.previousPracticeMode).toBeNull();

      // Simulate mode change
      act(() => {
        result.current.setPreviousPracticeMode('weekend');
      });

      expect(result.current.previousPracticeMode).toBe('weekend');
    });
  });

  describe('edge cases', () => {
    test('handles multiple URL parameters', () => {
      window.location.search = '?practice=weekend&game=2540&other=value';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.practiceMode).toBe('weekend');
      expect(result.current.urlPracticeGameIndex).toBe(2540);
    });

    test('handles very large game index', () => {
      window.location.search = '?practice=weekend&game=999999';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      expect(result.current.urlPracticeGameIndex).toBe(999999);
    });

    test('handles game index as string that parses to number', () => {
      window.location.search = '?practice=weekend&game=2540';

      const { result } = renderHook(() =>
        usePracticeMode(defaultSettings, mockSetSettings)
      );

      // Should parse string to number
      expect(result.current.urlPracticeGameIndex).toBe(2540);
      expect(typeof result.current.urlPracticeGameIndex).toBe('number');
    });
  });
});

