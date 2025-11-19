import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Header, Segment, Icon, Message, Popup, Loader, Dimmer } from 'semantic-ui-react';

import GameGrid from './components/GameGrid';
import Keyboard from './components/Keyboard';

import { loadGameData, isGameDataLoadedForMode } from './utils/gameDataLoader';
import {
  isAccessible,
  isNight,
  routesWithNoService,
  isValidGuess,
  updateGuessStatuses,
  flattenedTodaysTrip,
  todaysSolution,
  todayGameIndex,
  NIGHT_GAMES,
} from './utils/answerValidations';

import {
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  isNewToGame
} from './utils/localStorage';

import { addStatsForCompletedGame, loadStats } from './utils/stats';

import { loadSettings, saveSettings } from './utils/settings';

import stations from './data/stations.json';

import { ATTEMPTS, ALERT_TIME_MS } from './utils/constants';

import './App.scss';

// Lazy load modals for better performance
const AboutModal = lazy(() => import('./components/AboutModal'));
const SolutionModal = lazy(() => import('./components/SolutionModal'));
const StatsModal = lazy(() => import('./components/StatsModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const PracticeModal = lazy(() => import('./components/PracticeModal'));

const App = () => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameLost, setIsGameLost] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotEnoughRoutes, setIsNotEnoughRoutes] = useState(false);
  const [isGuessInvalid, setIsGuessInvalid] = useState(false);
  const [absentRoutes, setAbsentRoutes] = useState([]);
  const [presentRoutes, setPresentRoutes] = useState([]);
  const [similarRoutes, setSimilarRoutes] = useState([]);
  const [similarRoutesIndexes, setSimilarRoutesIndexes] = useState({});
  const [correctRoutes, setCorrectRoutes] = useState([]);
  const [guesses, setGuesses] = useState([]);
  const [stats, setStats] = useState(() => loadStats());
  const [settings, setSettings] = useState(() => loadSettings());
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceGameIndex, setPracticeGameIndex] = useState(null);
  const [urlPracticeMode, setUrlPracticeMode] = useState(null);
  const [urlPracticeGameIndex, setUrlPracticeGameIndex] = useState(null);
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
  }, []); // Only run on mount

  // Use URL params if available and practice is enabled, otherwise use settings
  // If practice is disabled in settings, ignore URL params
  const practiceMode = (settings.practice?.enabled && urlPracticeMode) 
    ? urlPracticeMode 
    : (settings.practice?.enabled ? settings.practice?.mode : null);
  // Prefer practiceGameIndex (which is clamped) over urlPracticeGameIndex (which may be unclamped)
  // This ensures we use the correct game index after data is loaded and clamped
  const effectivePracticeGameIndex = (settings.practice?.enabled && practiceGameIndex !== null)
    ? practiceGameIndex
    : (settings.practice?.enabled && urlPracticeGameIndex !== null)
    ? urlPracticeGameIndex
    : null;

  // Reset practice game index and clear state when switching modes
  useEffect(() => {
    // If practice mode changed (including switching to/from normal mode), reset everything
    if (previousPracticeMode !== practiceMode) {
      // Reset practice game index first
      setPracticeGameIndex(null);
      // Immediately clear all game state when switching modes
      setGuesses([]);
      setCurrentGuess([]);
      setIsGameWon(false);
      setIsGameLost(false);
      setCorrectRoutes([]);
      setSimilarRoutes([]);
      setPresentRoutes([]);
      setAbsentRoutes([]);
      setSimilarRoutesIndexes({});
      // Update previous mode after clearing state
      setPreviousPracticeMode(practiceMode);
    }
  }, [practiceMode, previousPracticeMode]);

  // Preload game data on mount and when practice mode changes
  useEffect(() => {
    setIsDataLoaded(false);

    loadGameData(practiceMode).then((data) => {
      // If in practice mode, use URL game index if available, otherwise select random
      let gameIndex = null;
      if (practiceMode && data.answers) {
        if (urlPracticeGameIndex !== null) {
          // Use game index from URL, ensure it's within bounds
          gameIndex = Math.max(0, Math.min(urlPracticeGameIndex, data.answers.length - 1));
          setPracticeGameIndex(gameIndex);
        } else {
          // Always generate a new random game index when entering practice mode
          // This ensures a fresh game when switching from normal to practice
          gameIndex = Math.floor(Math.random() * data.answers.length);
          setPracticeGameIndex(gameIndex);
        }
      } else {
        setPracticeGameIndex(null);
      }

      setIsDataLoaded(true);
      // Initialize guesses after data is loaded
      const currentAnswer = flattenedTodaysTrip(practiceMode, gameIndex);
      const loaded = loadGameStateFromLocalStorage(practiceMode, gameIndex);
      
      // Reset keyboard state and current guess when switching modes or starting a new game
      setCorrectRoutes([]);
      setSimilarRoutes([]);
      setPresentRoutes([]);
      setAbsentRoutes([]);
      setSimilarRoutesIndexes({});
      setCurrentGuess([]);
      
      if (loaded?.answer !== currentAnswer) {
        if (isNewToGame(practiceMode, gameIndex) && window.location === window.parent.location && !practiceMode) {
          setIsAboutOpen(true);
        }
        setGuesses([]);
        setIsGameWon(false);
        setIsGameLost(false);
      } else {
        const gameWasWon = loaded.guesses.map((g) => g.join('-')).includes(currentAnswer);
        if (gameWasWon) {
          setIsGameWon(true);
          setIsSolutionsOpen(true);
        }
        if (loaded.guesses.length === 6 && !gameWasWon) {
          setIsGameLost(true);
          setIsSolutionsOpen(true);
        }
        updateGuessStatuses(loaded.guesses, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes, null, null, null, null, null, practiceMode, gameIndex);
        setGuesses(loaded.guesses);
      }
    }).catch((error) => {
      console.error('Failed to load game data:', error);
      // Still set loaded to true to show error state
      setIsDataLoaded(true);
    });
  }, [practiceMode, urlPracticeGameIndex]);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveGameStateToLocalStorage(
      { guesses, answer: flattenedTodaysTrip(practiceMode, effectivePracticeGameIndex) },
      practiceMode,
      effectivePracticeGameIndex
    )
  }, [guesses, isDataLoaded, practiceMode, effectivePracticeGameIndex])

  const onChar = useCallback((routeId) => {
    setCurrentGuess((prevGuess) => {
      if (!isStatsOpen && !isGameWon && prevGuess.length < 3 && guesses.length < ATTEMPTS) {
        if (!routesWithNoService(practiceMode).includes(routeId)) {
          return [...prevGuess, routeId];
        }
      }
      return prevGuess;
    });
  }, [isStatsOpen, isGameWon, guesses.length, practiceMode]);

  const onDelete = useCallback(() => {
    setCurrentGuess((prevGuess) => {
      if (prevGuess.length > 0) {
        return prevGuess.slice(0, prevGuess.length - 1);
      }
      return prevGuess;
    });
  }, []);

  const onEnter = useCallback(() => {
    setCurrentGuess((prevGuess) => {
      const guessCount = guesses.length;
      if (isGameWon || isGameLost || guessCount === 6) {
        return prevGuess;
      }

      if (prevGuess.length !== 3) {
        setIsNotEnoughRoutes(true);
        setTimeout(() => {
          setIsNotEnoughRoutes(false)
        }, ALERT_TIME_MS);
        return prevGuess;
      }

      if (!isValidGuess(prevGuess)) {
        setIsGuessInvalid(true);
        setTimeout(() => {
          setIsGuessInvalid(false)
        }, ALERT_TIME_MS);
        return prevGuess;
      }

      const currentAnswer = flattenedTodaysTrip(practiceMode, effectivePracticeGameIndex);
      const winningGuess = prevGuess.join('-') === currentAnswer;
      const newGuesses = [...guesses, prevGuess];

      updateGuessStatuses(
        [prevGuess],
        setCorrectRoutes,
        setSimilarRoutes,
        setPresentRoutes,
        setAbsentRoutes,
        setSimilarRoutesIndexes,
        correctRoutes,
        similarRoutes,
        presentRoutes,
        absentRoutes,
        similarRoutesIndexes,
        practiceMode,
        effectivePracticeGameIndex,
      );

      setGuesses(newGuesses);

      if (winningGuess) {
        // Only update stats for regular games, not practice mode
        if (!practiceMode) {
          const updatedStats = addStatsForCompletedGame(stats, guessCount);
          setStats(updatedStats);
        }
        setIsGameWon(true);
        setIsSolutionsOpen(true);
        return [];
      }

      if (newGuesses.length === 6) {
        // Only update stats for regular games, not practice mode
        if (!practiceMode) {
          const updatedStats = addStatsForCompletedGame(stats, guessCount + 1);
          setStats(updatedStats);
        }
        setIsGameLost(true);
        setIsSolutionsOpen(true);
        return [];
      }

      return [];
    });
  }, [guesses, isGameWon, isGameLost, stats, correctRoutes, similarRoutes, presentRoutes, absentRoutes, similarRoutesIndexes, practiceMode, effectivePracticeGameIndex]);

  const onSolutionsClose = () => {
    setIsSolutionsOpen(false);
  }

  const onStatsClose = () => {
    setIsStatsOpen(false);
  }

  const onAboutClose = () => {
    setIsAboutOpen(false);
  }

  const onSettingsClose = () => {
    setIsSettingsOpen(false);
  }

  const handleStatsOpen = () => {
    if (isGameWon || isGameLost) {
      setIsSolutionsOpen(true);
    } else {
      setIsStatsOpen(true);
    }
  }

  const handleSettingsOpen = () => {
    setIsSettingsOpen(true);
  }

  const handleAboutOpen = () => {
    setIsAboutOpen(true);
  }

  const handlePracticeOpen = () => {
    setIsPracticeOpen(true);
  }

  const handlePracticeClose = () => {
    setIsPracticeOpen(false);
  }

  const handlePracticeModeChange = (updatedSettings) => {
    // Set isDataLoaded to false immediately to prevent accessing stale data
    setIsDataLoaded(false);
    
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
  }

  const currentIsNight = isNight(practiceMode);
  const isDarkMode = currentIsNight || (todayGameIndex() > Math.max(...NIGHT_GAMES) && settings.display.darkMode);

  // Don't render game until data is loaded and matches current practice mode
  if (!isDataLoaded || !isGameDataLoadedForMode(practiceMode)) {
    return (
      <Dimmer active inverted>
        <Loader size="large">Loading game data...</Loader>
      </Dimmer>
    );
  }

  const solution = todaysSolution(practiceMode, effectivePracticeGameIndex);
  const currentIsAccessible = isAccessible(practiceMode);
  const currentIsWeekend = practiceMode === 'weekend' || (!practiceMode && [0, 6].includes(new Date().getDay()));

  return (
    <div className={"outer-app-wrapper " + (isDarkMode ? 'dark' : '')}>
      <Segment basic className='app-wrapper' inverted={isDarkMode}>
        <Segment clearing basic className='header-wrapper' inverted={isDarkMode}>
          <Header floated='left'>
            {practiceMode && <span style={{ fontSize: '0.7em', fontWeight: 'normal' }}>Practice: </span>}
            {currentIsNight && "Late Night "}
            {(!currentIsNight && currentIsWeekend) && "Weekend "}Subwaydle
            {currentIsAccessible && " ♿️"}
            {
               currentIsNight &&
               <Popup
               position='bottom center'
                 trigger={
                   <sup>[?]</sup>
                 }
               >
               <Popup.Content>
                 <p>Subwaydle now available in Dark Mode!</p>
                 <p>Try solving this weekend's Subwaydle with late night routing patterns.</p>
               </Popup.Content>
               </Popup>
             }
          </Header>
          <Icon className='float-right' inverted={isDarkMode} name='cog' size='large' link onClick={handleSettingsOpen} />
          <Icon className='float-right' inverted={isDarkMode} name='chart bar' size='large' link onClick={handleStatsOpen} />
          <Icon className='float-right' inverted={isDarkMode} name='graduation cap' size='large' link onClick={handlePracticeOpen} />
          <Icon className='float-right' inverted={isDarkMode} name='question circle outline' size='large' link onClick={handleAboutOpen} />
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
            isDarkMode={isDarkMode}
            currentGuess={currentGuess}
            guesses={guesses}
            attempts={ATTEMPTS}
            inPlay={!isGameWon && !isGameLost && guesses.length < 6}
            practiceMode={practiceMode}
            practiceGameIndex={effectivePracticeGameIndex}
          />
        </Segment>
        <Segment basic>
          <Keyboard
            noService={routesWithNoService(practiceMode)}
            isDarkMode={isDarkMode}
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
          <AboutModal open={isAboutOpen} isDarkMode={isDarkMode} handleClose={onAboutClose} />
          <SolutionModal open={isSolutionsOpen} isDarkMode={isDarkMode} isGameWon={isGameWon}  handleModalClose={onSolutionsClose} stats={stats} guesses={guesses} practiceMode={practiceMode} practiceGameIndex={effectivePracticeGameIndex} />
          <StatsModal open={isStatsOpen} isDarkMode={isDarkMode} stats={stats} handleClose={onStatsClose} />
          <SettingsModal open={isSettingsOpen} isDarkMode={isDarkMode} handleClose={onSettingsClose} onSettingsChange={setSettings} />
          <PracticeModal open={isPracticeOpen} isDarkMode={isDarkMode} handleClose={handlePracticeClose} onPracticeModeChange={handlePracticeModeChange} />
        </Suspense>
      </Segment>
    </div>
  );
}

export default App;
