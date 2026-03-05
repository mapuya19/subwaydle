import { useState, useEffect } from 'react';
import { saveSettings } from '../utils/settings';
import { VALID_PRACTICE_MODES } from '../utils/constants';
import { GameSettings } from '../utils/settings';

const readUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const practiceParam = urlParams.get('practice');
  const gameParam = urlParams.get('game');
  
  if (practiceParam && gameParam !== null) {
    if (VALID_PRACTICE_MODES.includes(practiceParam as any)) {
      const gameIndex = parseInt(gameParam, 10);
      if (!isNaN(gameIndex) && gameIndex >= 0) {
        return { mode: practiceParam, gameIndex };
      }
    }
  }
  return { mode: null, gameIndex: null };
};

export const usePracticeMode = (settings: GameSettings, setSettings: (settings: GameSettings | ((prev: GameSettings) => GameSettings)) => void) => {
  const [urlPracticeMode, setUrlPracticeMode] = useState<string | null>(() => readUrlParams().mode);
  const [urlPracticeGameIndex, setUrlPracticeGameIndex] = useState<number | null>(() => readUrlParams().gameIndex);
  const [practiceGameIndex, setPracticeGameIndex] = useState<number | null>(null);
  const [previousPracticeMode, setPreviousPracticeMode] = useState<string | null>(null);

  useEffect(() => {
    if (urlPracticeMode && urlPracticeGameIndex !== null) {
      setSettings((prevSettings) => {
        if (prevSettings.practice?.mode !== urlPracticeMode || !prevSettings.practice?.enabled) {
          const updatedSettings: GameSettings = {
            ...prevSettings,
            practice: {
              ...prevSettings.practice,
              mode: urlPracticeMode as any,
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

  const practiceMode = urlPracticeMode 
    ? urlPracticeMode 
    : (settings.practice?.enabled ? settings.practice?.mode : null);
  
  const effectivePracticeGameIndex = (practiceGameIndex !== null)
    ? practiceGameIndex
    : (urlPracticeGameIndex !== null)
    ? urlPracticeGameIndex
    : null;

  const handlePracticeModeChange = (updatedSettings: GameSettings, forceNewGame: boolean = false) => {
    if (!updatedSettings.practice?.enabled) {
      const url = new URL(window.location.href);
      url.searchParams.delete('practice');
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url);
      
      setUrlPracticeMode(null);
      setUrlPracticeGameIndex(null);
      setPracticeGameIndex(null);
    } else if (updatedSettings.practice?.enabled && updatedSettings.practice?.mode) {
      const modeChanged = updatedSettings.practice.mode !== practiceMode;
      if (modeChanged || forceNewGame) {
        const url = new URL(window.location.href);
        url.searchParams.delete('practice');
        url.searchParams.delete('game');
        window.history.replaceState({}, '', url);
        
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
