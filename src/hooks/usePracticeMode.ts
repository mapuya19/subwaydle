import { useState, useEffect } from 'react';
import { saveSettings } from '../utils/settings';
import { VALID_PRACTICE_MODES, PracticeMode } from '../utils/constants';
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

export const usePracticeMode = (settings: GameSettings, setSettings: (settings: GameSettings) => void) => {
  const [urlPracticeMode, setUrlPracticeMode] = useState<PracticeMode | null>(() => {
    const mode = readUrlParams().mode;
    return (mode && VALID_PRACTICE_MODES.includes(mode as PracticeMode)) ? (mode as PracticeMode) : null;
  });
  const [urlPracticeGameIndex, setUrlPracticeGameIndex] = useState<number | null>(() => readUrlParams().gameIndex);
  const [practiceGameIndex, setPracticeGameIndex] = useState<number | null>(null);
  const [previousPracticeMode, setPreviousPracticeMode] = useState<PracticeMode | null>(null);

  useEffect(() => {
    if (urlPracticeMode && urlPracticeGameIndex !== null) {
      if (settings.practice?.mode !== urlPracticeMode || !settings.practice?.enabled) {
        const updatedSettings: GameSettings = {
          ...settings,
          practice: {
            ...settings.practice,
            mode: urlPracticeMode,
            enabled: true,
          }
        };
        saveSettings(updatedSettings);
        setSettings(updatedSettings);
      }
    }
  }, [setSettings, urlPracticeMode, urlPracticeGameIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const practiceMode: PracticeMode | null = urlPracticeMode
    ?? (settings.practice?.enabled ? (settings.practice?.mode ?? null) : null);
  
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
