import { useState, useEffect } from 'react';
import { saveSettings } from '../utils/settings';
import { VALID_PRACTICE_MODES } from '../utils/constants';

/**
 * Read URL parameters synchronously on initialization
 */
const readUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const practiceParam = urlParams.get('practice');
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

/**
 * Hook to manage practice mode state and URL parameters
 */
export const usePracticeMode = (settings, setSettings) => {
  // Read URL parameters synchronously during initialization (only runs once per useState)
  const [urlPracticeMode, setUrlPracticeMode] = useState(() => readUrlParams().mode);
  const [urlPracticeGameIndex, setUrlPracticeGameIndex] = useState(() => readUrlParams().gameIndex);
  const [practiceGameIndex, setPracticeGameIndex] = useState(null);
  const [previousPracticeMode, setPreviousPracticeMode] = useState(null);

  // Update settings when URL params are present (runs after first render to avoid blocking)
  useEffect(() => {
    if (urlPracticeMode && urlPracticeGameIndex !== null) {
      // Update settings to enable practice mode from URL
      setSettings((prevSettings) => {
        // Only update if not already set to avoid unnecessary saves
        if (prevSettings.practice?.mode !== urlPracticeMode || !prevSettings.practice?.enabled) {
          const updatedSettings = {
            ...prevSettings,
            practice: {
              ...prevSettings.practice,
              mode: urlPracticeMode,
              enabled: true,
            }
          };
          saveSettings(updatedSettings);
          return updatedSettings;
        }
        return prevSettings;
      });
    }
  }, [setSettings, urlPracticeMode, urlPracticeGameIndex]);

  // Use URL params if available (even if settings haven't been updated yet), otherwise use settings
  const practiceMode = urlPracticeMode 
    ? urlPracticeMode 
    : (settings.practice?.enabled ? settings.practice?.mode : null);
  
  // Prefer practiceGameIndex (which is clamped) over urlPracticeGameIndex (which may be unclamped)
  // Also use urlPracticeGameIndex if URL params are present, even if settings aren't updated yet
  const effectivePracticeGameIndex = (practiceGameIndex !== null)
    ? practiceGameIndex
    : (urlPracticeGameIndex !== null)
    ? urlPracticeGameIndex
    : null;

  const handlePracticeModeChange = (updatedSettings, forceNewGame = false) => {
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
      const modeChanged = updatedSettings.practice.mode !== practiceMode;
      if (modeChanged || forceNewGame) {
        // Clear URL parameters from browser to allow new random game generation
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
    
    setSettings(updatedSettings);
  };

  return {
    practiceMode,
    effectivePracticeGameIndex,
    practiceGameIndex,
    setPracticeGameIndex,
    urlPracticeGameIndex,
    setUrlPracticeGameIndex,
    previousPracticeMode,
    setPreviousPracticeMode,
    handlePracticeModeChange,
  };
};

