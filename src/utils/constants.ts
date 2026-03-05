export const ATTEMPTS = 6;

export const ALERT_TIME_MS = 1500;

export const VALID_PRACTICE_MODES = ['weekday', 'weekend', 'night', 'accessible'] as const;

export type PracticeMode = typeof VALID_PRACTICE_MODES[number];

export const isIosDevice = (): boolean => {
  return /iP(ad|od|hone)/i.test(window.navigator.userAgent) || 
         (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

export const MANHATTAN_TILT = 29;

export const DEFAULT_LNG = -73.98119;

export const DEFAULT_LAT = 40.75855;

export const DEFAULT_ZOOM = 12;
