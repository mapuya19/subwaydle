// Game constants
export const ATTEMPTS = 6;
export const ALERT_TIME_MS = 1500;

// Practice mode constants
export const VALID_PRACTICE_MODES: readonly ['weekday', 'weekend', 'night', 'accessible'] = [
  'weekday',
  'weekend',
  'night',
  'accessible',
] as const;

export type ValidPracticeMode = typeof VALID_PRACTICE_MODES[number];

// Device detection
export const isIosDevice = (): boolean => {
  return (
    /iP(ad|od|hone)/i.test(window.navigator.userAgent) ||
    (navigator.maxTouchPoints !== undefined &&
      navigator.maxTouchPoints > 2 &&
      /MacIntel/.test(navigator.platform))
  );
};

// Map constants
export const MANHATTAN_TILT = 29;
export const DEFAULT_LNG = -73.98119;
export const DEFAULT_LAT = 40.75855;
export const DEFAULT_ZOOM = 12;
