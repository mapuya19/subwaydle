/**
 * Copyright (c) 2022 Sunny Ng
 * 
 * This software is licensed under the MIT License.
 * See LICENSE file for full license text.
 */

import { useState, lazy, Suspense, useEffect } from 'react';
import { Header, Segment, Icon, Message, Loader, Dimmer } from 'semantic-ui-react';

import { GameGrid, Keyboard } from './components/game';

import {
  isAccessible,
  isNight,
  isWeekend,
  routesWithNoService,
  todaysSolution,
} from './utils/answerValidations';

import stations from './data/stations.json';
import { ATTEMPTS } from './utils/constants';

import { useGameState } from './hooks/useGameState';
import { useGameData } from './hooks/useGameData';
import { usePracticeMode } from './hooks/usePracticeMode';
import { useKeyboard } from './hooks/useKeyboard';
import { useSettings, useDarkMode } from './contexts';
import { useStats } from './contexts/StatsContext';

import './App.scss';

// Lazy load modals for better performance
const AboutModal = lazy(() => import('./components/modals/AboutModal'));
const SolutionModal = lazy(() => import('./components/modals/SolutionModal'));
const StatsModal = lazy(() => import('./components/stats/StatsModal'));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal'));
const PracticeModal = lazy(() => import('./components/modals/PracticeModal'));

const App = () => {
  // Modal state
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);

  // Settings and stats from context
  const { settings, setSettings } = useSettings();
  const { stats, setStats } = useStats();

  // Practice mode hook
  const {
    practiceMode,
    effectivePracticeGameIndex,
    practiceGameIndex,
    setPracticeGameIndex,
    urlPracticeGameIndex,
    previousPracticeMode,
    setPreviousPracticeMode,
    handlePracticeModeChange,
  } = usePracticeMode(settings, setSettings);

  // Game state hook
  const gameState = useGameState(practiceMode, effectivePracticeGameIndex);
  const {
    currentGuess,
    setCurrentGuess,
    isGameWon,
    setIsGameWon,
    isGameLost,
    setIsGameLost,
    guesses,
    setGuesses,
    isNotEnoughRoutes,
    setIsNotEnoughRoutes,
    isGuessInvalid,
    setIsGuessInvalid,
    absentRoutes,
    setAbsentRoutes,
    presentRoutes,
    setPresentRoutes,
    similarRoutes,
    setSimilarRoutes,
    similarRoutesIndexes,
    setSimilarRoutesIndexes,
    correctRoutes,
    setCorrectRoutes,
  } = gameState;

  // Game data loading hook
  const { isDataLoaded, isGameDataLoaded } = useGameData(
    practiceMode,
    effectivePracticeGameIndex,
    urlPracticeGameIndex,
    practiceGameIndex,
    setPracticeGameIndex,
    previousPracticeMode,
    setPreviousPracticeMode,
    setGuesses,
    setCurrentGuess,
    setIsGameWon,
    setIsGameLost,
    setIsAboutOpen,
    setIsSolutionsOpen,
    setCorrectRoutes,
    setSimilarRoutes,
    setPresentRoutes,
    setAbsentRoutes,
    setSimilarRoutesIndexes,
  );

  // Keyboard handlers hook
  const { onChar, onDelete, onEnter } = useKeyboard({
    isStatsOpen,
    isGameWon,
    isGameLost,
    guesses,
    setGuesses,
    currentGuess,
    setCurrentGuess,
    practiceMode,
    effectivePracticeGameIndex,
    setIsGameWon,
    setIsGameLost,
    setIsSolutionsOpen,
    setIsNotEnoughRoutes,
    setIsGuessInvalid,
    correctRoutes,
    setCorrectRoutes,
    similarRoutes,
    setSimilarRoutes,
    presentRoutes,
    setPresentRoutes,
    absentRoutes,
    setAbsentRoutes,
    similarRoutesIndexes,
    setSimilarRoutesIndexes,
    stats,
    setStats,
  });

  // Modal handlers
  const handleModalClose = (modal) => {
    const setters = {
      solutions: setIsSolutionsOpen,
      stats: setIsStatsOpen,
      about: setIsAboutOpen,
      settings: setIsSettingsOpen,
      practice: setIsPracticeOpen,
    };
    setters[modal]?.(false);
  };

  const handleModalOpen = (modal) => {
    const setters = {
      solutions: setIsSolutionsOpen,
      stats: setIsStatsOpen,
      about: setIsAboutOpen,
      settings: setIsSettingsOpen,
      practice: setIsPracticeOpen,
    };
    setters[modal]?.(true);
  };

  const handleStatsOpen = () => {
    if (isGameWon || isGameLost) {
      setIsSolutionsOpen(true);
    } else {
      setIsStatsOpen(true);
    }
  };

  const isDarkMode = useDarkMode(practiceMode);
  const currentIsNight = isNight(practiceMode);

  // Update theme-color meta tag for iOS browser bars
  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDarkMode ? '#1b1c1d' : '#ffffff');
    }
  }, [isDarkMode]);

  // Update body/html background for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Don't render game until data is loaded and matches current practice mode
  if (!isDataLoaded || !isGameDataLoaded) {
    return (
      <Dimmer active inverted>
        <Loader size="large">Loading game data...</Loader>
      </Dimmer>
    );
  }

  const solution = todaysSolution(practiceMode, effectivePracticeGameIndex);
  const currentIsAccessible = isAccessible(practiceMode);
  const currentIsWeekend = isWeekend(practiceMode);

  return (
    <div className={"outer-app-wrapper " + (isDarkMode ? 'dark' : '')}>
      <Segment basic className='app-wrapper' inverted={isDarkMode}>
        <Segment clearing basic className='header-wrapper' inverted={isDarkMode}>
          <Header>
            {practiceMode && <span className="practice-label">Practice:</span>}
            <span className="header-title">
              {currentIsNight && "Late Night "}
              {(!currentIsNight && currentIsWeekend) && "Weekend "}
              Subwaydle Remastered
              {currentIsAccessible && " ♿️"}
            </span>
          </Header>
          <div className='header-icons'>
            <Icon inverted={isDarkMode} name='question circle outline' size='large' link onClick={() => handleModalOpen('about')} />
            <Icon inverted={isDarkMode} name='graduation cap' size='large' link onClick={() => handleModalOpen('practice')} />
            <Icon inverted={isDarkMode} name='chart bar' size='large' link onClick={handleStatsOpen} />
            <Icon inverted={isDarkMode} name='cog' size='large' link onClick={() => handleModalOpen('settings')} />
          </div>
        </Segment>
        { !currentIsAccessible &&
          <Header as='h5' textAlign='center' className='hint'>Travel from {stations[solution.origin].name} to {stations[solution.destination].name} using 2 transfers.</Header>
        }
        { currentIsAccessible &&
          <Header as='h5' textAlign='center' className='hint'>Travel from {stations[solution.origin].name} ♿️ to {stations[solution.destination].name} ♿️ using 2 accessible transfers.</Header>
        }
        <Segment basic className='game-grid-wrapper'>
          {
            isNotEnoughRoutes &&
            <Message negative floating attached='top'>
              <Message.Header>Not enough trains for the trip</Message.Header>
            </Message>
          }
          {
            isGuessInvalid &&
            <Message negative>
              <Message.Header>Not a valid trip</Message.Header>
            </Message>
          }
          <GameGrid
            currentGuess={currentGuess}
            guesses={guesses}
            attempts={ATTEMPTS}
            inPlay={!isGameWon && !isGameLost && guesses.length < 6}
            practiceMode={practiceMode}
            practiceGameIndex={effectivePracticeGameIndex}
            shouldShake={isNotEnoughRoutes || isGuessInvalid}
          />
        </Segment>
        <Segment basic>
          <Keyboard
            noService={routesWithNoService(practiceMode)}
            onChar={onChar}
            onDelete={onDelete}
            onEnter={onEnter}
            correctRoutes={correctRoutes}
            similarRoutes={similarRoutes}
            presentRoutes={presentRoutes}
            absentRoutes={absentRoutes}
          />
        </Segment>
        <Suspense fallback={<div />}>
          <AboutModal open={isAboutOpen} handleClose={() => handleModalClose('about')} />
          <SolutionModal open={isSolutionsOpen} isGameWon={isGameWon} handleModalClose={() => handleModalClose('solutions')} guesses={guesses} practiceMode={practiceMode} practiceGameIndex={effectivePracticeGameIndex} />
          <StatsModal open={isStatsOpen} handleClose={() => handleModalClose('stats')} />
          <SettingsModal open={isSettingsOpen} handleClose={() => handleModalClose('settings')} />
          <PracticeModal open={isPracticeOpen} handleClose={() => handleModalClose('practice')} onPracticeModeChange={handlePracticeModeChange} />
        </Suspense>
      </Segment>
    </div>
  );
}

export default App;
