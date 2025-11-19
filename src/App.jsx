import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Header, Segment, Icon, Message, Popup, Loader, Dimmer } from 'semantic-ui-react';

import GameGrid from './components/GameGrid';
import Keyboard from './components/Keyboard';

import { loadGameData } from './utils/gameDataLoader';
import {
  isAccessible,
  isNight,
  isWeekend,
  routesWithNoService,
  isValidGuess,
  isWinningGuess,
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

import { loadSettings } from './utils/settings';

import stations from './data/stations.json';

import { ATTEMPTS, ALERT_TIME_MS } from './utils/constants';

import './App.scss';

// Lazy load modals for better performance
const AboutModal = lazy(() => import('./components/AboutModal'));
const SolutionModal = lazy(() => import('./components/SolutionModal'));
const StatsModal = lazy(() => import('./components/StatsModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));

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

  // Preload game data on mount
  useEffect(() => {
    loadGameData().then(() => {
      setIsDataLoaded(true);
      // Initialize guesses after data is loaded
      const loaded = loadGameStateFromLocalStorage();
      if (loaded?.answer !== flattenedTodaysTrip()) {
        if (isNewToGame() && window.location === window.parent.location) {
          setIsAboutOpen(true);
        }
        setGuesses([]);
      } else {
        const gameWasWon = loaded.guesses.map((g) => g.join('-')).includes(flattenedTodaysTrip());
        if (gameWasWon) {
          setIsGameWon(true);
          setIsSolutionsOpen(true);
        }
        if (loaded.guesses.length === 6 && !gameWasWon) {
          setIsGameLost(true);
          setIsSolutionsOpen(true);
        }
        updateGuessStatuses(loaded.guesses, setCorrectRoutes, setSimilarRoutes, setPresentRoutes, setAbsentRoutes, setSimilarRoutesIndexes);
        setGuesses(loaded.guesses);
      }
    }).catch((error) => {
      console.error('Failed to load game data:', error);
      // Still set loaded to true to show error state
      setIsDataLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveGameStateToLocalStorage({ guesses, answer: flattenedTodaysTrip() })
  }, [guesses, isDataLoaded])

  const onChar = useCallback((routeId) => {
    if (!isStatsOpen && !isGameWon && currentGuess.length < 3 && guesses.length < ATTEMPTS) {
      if (!routesWithNoService().includes(routeId)) {
        setCurrentGuess([...currentGuess, routeId]);
      }
    }
  }, [isStatsOpen, isGameWon, currentGuess, guesses.length]);

  const onDelete = useCallback(() => {
    if (currentGuess.length > 0) {
      setCurrentGuess(currentGuess.slice(0, currentGuess.length - 1));
    }
  }, [currentGuess]);

  const onEnter = useCallback(() => {
    const guessCount = guesses.length;
    if (isGameWon || isGameLost || guessCount === 6) {
      return;
    }

    if (currentGuess.length !== 3) {
      setIsNotEnoughRoutes(true);
      setTimeout(() => {
        setIsNotEnoughRoutes(false)
      }, ALERT_TIME_MS);
      return;
    }

    if (!isValidGuess(currentGuess)) {
      setIsGuessInvalid(true);
      setTimeout(() => {
        setIsGuessInvalid(false)
      }, ALERT_TIME_MS);
      return;
    }

    const winningGuess = isWinningGuess(currentGuess);
    const newGuesses = [...guesses, currentGuess];

    updateGuessStatuses(
      [currentGuess],
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
    );

    setGuesses(newGuesses);
    setCurrentGuess([]);

    if (winningGuess) {
      const updatedStats = addStatsForCompletedGame(stats, guessCount);
      setStats(updatedStats);
      setIsGameWon(true);
      setIsSolutionsOpen(true);
      return;
    }

    if (newGuesses.length === 6) {
      const updatedStats = addStatsForCompletedGame(stats, guessCount + 1);
      setStats(updatedStats);
      setIsGameLost(true);
      setIsSolutionsOpen(true);
    }
  }, [guesses, isGameWon, isGameLost, currentGuess, stats, correctRoutes, similarRoutes, presentRoutes, absentRoutes, similarRoutesIndexes]);

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

  const isDarkMode = (NIGHT_GAMES.includes(todayGameIndex())) || (todayGameIndex() > Math.max(...NIGHT_GAMES) && settings.display.darkMode);

  // Don't render game until data is loaded
  if (!isDataLoaded) {
    return (
      <Dimmer active inverted>
        <Loader size="large">Loading game data...</Loader>
      </Dimmer>
    );
  }

  const solution = todaysSolution();

  return (
    <div className={"outer-app-wrapper " + (isDarkMode ? 'dark' : '')}>
      <Segment basic className='app-wrapper' inverted={isDarkMode}>
        <Segment clearing basic className='header-wrapper' inverted={isDarkMode}>
          <Header floated='left'>
            {isNight && "Late Night "}
            {(!isNight && isWeekend) && "Weekend "}Subwaydle
            {isAccessible && " ♿️"}
            {
               isNight &&
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
          <Icon className='float-right' inverted={isDarkMode} name='question circle outline' size='large' link onClick={handleAboutOpen} />
        </Segment>
        { !isAccessible &&
          <Header as='h5' textAlign='center' className='hint'>Travel from {stations[solution.origin].name} to {stations[solution.destination].name} using 2 transfers.</Header>
        }
        { isAccessible &&
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
          />
        </Segment>
        <Segment basic>
          <Keyboard
            noService={routesWithNoService()}
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
          <SolutionModal open={isSolutionsOpen} isDarkMode={isDarkMode} isGameWon={isGameWon}  handleModalClose={onSolutionsClose} stats={stats} guesses={guesses} />
          <StatsModal open={isStatsOpen} isDarkMode={isDarkMode} stats={stats} handleClose={onStatsClose} />
          <SettingsModal open={isSettingsOpen} isDarkMode={isDarkMode} handleClose={onSettingsClose} onSettingsChange={setSettings} />
        </Suspense>
      </Segment>
    </div>
  );
}

export default App;
