import { useState, useEffect } from 'react';
import { saveSettings } from '../utils/settings';

/**
 * Hook to manage practice mode state and URL parameters
 */
export const usePracticeMode = (settings, setSettings) => {
  const [urlPracticeMode, setUrlPracticeMode] = useState(null);
  const [urlPracticeGameIndex, setUrlPracticeGameIndex] = useState(null);
  const [practiceGameIndex, setPracticeGameIndex] = useState(null);
  const [previousPracticeMode, setPreviousPracticeMode] = useState(null);

  // Read URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const practiceParam = urlParams.get('practice');
    const gameParam = urlParams.get('game');
    
    if (practiceParam && gameParam !== null) {
      const validModes = ['weekday', 'weekend', 'night', 'accessible'];
      if (validModes.includes(practiceParam)) {
        const gameIndex = parseInt(gameParam, 10);
        if (!isNaN(gameIndex) && gameIndex >= 0) {
          setUrlPracticeMode(practiceParam);
          setUrlPracticeGameIndex(gameIndex);
          
          // Update settings to enable practice mode from URL
          setSettings((prevSettings) => {
            const updatedSettings = {
              ...prevSettings,
              practice: {
                ...prevSettings.practice,
                mode: practiceParam,
                enabled: true,
              }
            };
            saveSettings(updatedSettings);
            return updatedSettings;
          });
        }
      }
    }
  }, [setSettings]);

  // Use URL params if available and practice is enabled, otherwise use settings
  const practiceMode = (settings.practice?.enabled && urlPracticeMode) 
    ? urlPracticeMode 
    : (settings.practice?.enabled ? settings.practice?.mode : null);
  
  // Prefer practiceGameIndex (which is clamped) over urlPracticeGameIndex (which may be unclamped)
  const effectivePracticeGameIndex = (settings.practice?.enabled && practiceGameIndex !== null)
    ? practiceGameIndex
    : (settings.practice?.enabled && urlPracticeGameIndex !== null)
    ? urlPracticeGameIndex
    : null;

  const handlePracticeModeChange = (updatedSettings) => {
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

