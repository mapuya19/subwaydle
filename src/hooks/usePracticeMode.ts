import { useState, useEffect } from 'react';
import { saveSettings } from '../utils/settings';
import { VALID_PRACTICE_MODES } from '../utils/constants';
import type { PracticeMode } from '../types/game';
import type { SettingsState } from '../types/contexts';

interface URLParams {
  mode: PracticeMode | null;
  gameIndex: number | null;
}

interface ReadUrlParams {
  mode: PracticeMode | null;
  gameIndex: number | null;
}

/**
 * Read URL parameters synchronously on initialization
 */
const readUrlParams = (): ReadUrlParams => {
  const urlParams = new URLSearchParams(window.location.search);
  const practiceParam = urlParams.get('practice') as PracticeMode | null;
  const gameParam = urlParams.get('game');

  if (practiceParam && gameParam !== null) {
    if (VALID_PRACTICE_MODES.includes(practiceParam)) {
      const gameIndex = parseInt(gameParam, 10);
      if (!isNaN(gameIndex) && gameIndex >= 0) {
        return { mode: practiceParam, gameIndex };
      }
    }
  }
  return { mode: null, gameIndex: null };
};

interface SaveSettings {
  (settings: SettingsState): void;
}

/**
 * Hook to manage practice mode state and URL parameters
 */
export const usePracticeMode = (settings: SettingsState, setSettings: SaveSettings) => {
  // Read URL parameters synchronously during initialization (only runs once per useState)
  const [urlPracticeMode, setUrlPracticeMode] = useState<PracticeMode | null>(() => readUrlParams().mode);
  const [urlPracticeGameIndex, setUrlPracticeGameIndex] = useState<number | null>(() => readUrlParams().gameIndex);
  const [practiceGameIndex, setPracticeGameIndex] = useState<number | null>(null);
  const [previousPracticeMode, setPreviousPracticeMode] = useState<PracticeMode | null>(null);

  // Update settings when URL params are present (runs after first render to avoid blocking)
  useEffect(() => {
    if (urlPracticeMode && urlPracticeGameIndex !== null) {
      // Update settings to enable practice mode from URL
      (setSettings as any)((prevSettings: SettingsState) => {
        // Only update if not already set to avoid unnecessary saves
        const currentPracticeMode = prevSettings.practice?.mode;
        if (currentPracticeMode !== urlPracticeMode || !prevSettings.practice?.enabled) {
          const updatedSettings = {
            ...prevSettings,
            practice: {
              ...(prevSettings.practice || {}),
              mode: urlPracticeMode,
              enabled: true,
            },
          };
          saveSettings(updatedSettings as any);
        }
      });
    }
  }, [setSettings, urlPracticeMode, urlPracticeGameIndex]);

  // Use URL params if available (even if settings haven't been updated yet), otherwise use settings
  const practiceMode: PracticeMode | null = urlPracticeMode
    ? urlPracticeMode
    : (settings.practice?.enabled ? settings.practice.mode : null);

  // Prefer practiceGameIndex (which is clamped) over urlPracticeGameIndex (which may be unclamped)
  // Also use urlPracticeGameIndex if URL params are present, even if settings aren't updated yet
  const effectivePracticeGameIndex: number | null = (practiceGameIndex !== null)
    ? practiceGameIndex
    : (urlPracticeGameIndex !== null)
    ? urlPracticeGameIndex
    : null;

  const handlePracticeModeChange = (updatedSettings: SettingsState, forceNewGame = false) => {
    // If practice mode is being disabled, clear URL params and state
    if (!updatedSettings.practice?.enabled) {
      // Clear URL parameters from browser
      const url = new URL(window.location.href);
      url.searchParams.delete('practice');
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url);

      // Clear URL state
      setUrlPracticeMode(null);
      setUrlPracticeGameIndex(null);
      // Clear practice game index
      setPracticeGameIndex(null);
    } else if (updatedSettings.practice?.enabled && updatedSettings.practice?.mode) {
      // If switching to a different practice mode OR forcing a new game, clear URL params to generate a new random game
      const modeChanged = updatedSettings.practice.mode !== previousPracticeMode;
      if (modeChanged || forceNewGame) {
        // Clear URL parameters from browser to allow new random game index generation
        const url = new URL(window.location.href);
        url.searchParams.delete('practice');
        url.searchParams.delete('game');
        window.history.replaceState({}, '', url);

        // Clear URL state and practice game index so a new random game index will be generated
        setUrlPracticeMode(null);
        setUrlPracticeGameIndex(null);
        setPracticeGameIndex(null);
      }
    }
  };

  return {
    practiceMode,
    effectivePracticeGameIndex,
    practiceGameIndex,
    setPracticeGameIndex,
    urlPracticeGameIndex,
    previousPracticeMode,
    setPreviousPracticeMode,
    handlePracticeModeChange,
  };
};
