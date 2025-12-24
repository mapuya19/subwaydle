import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('./components/game', () => ({
  __esModule: true,
  GameGrid: () => <div className="game-grid" />,
  Keyboard: () => <div className="keyboard" />,
}));

jest.mock('./components/modals/AboutModal', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/modals/SolutionModal', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/stats/StatsModal', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/modals/SettingsModal', () => ({ __esModule: true, default: () => null }));
jest.mock('./components/modals/PracticeModal', () => ({ __esModule: true, default: () => null }));

jest.mock('./hooks/usePracticeMode', () => ({
  __esModule: true,
  usePracticeMode: () => ({
    practiceMode: null,
    effectivePracticeGameIndex: 0,
    practiceGameIndex: 0,
    setPracticeGameIndex: jest.fn(),
    urlPracticeGameIndex: null,
    previousPracticeMode: null,
    setPreviousPracticeMode: jest.fn(),
    handlePracticeModeChange: jest.fn(),
  }),
}));

jest.mock('./hooks/useGameState', () => ({
  __esModule: true,
  useGameState: () => ({
    currentGuess: [],
    setCurrentGuess: jest.fn(),
    isGameWon: false,
    setIsGameWon: jest.fn(),
    isGameLost: false,
    setIsGameLost: jest.fn(),
    guesses: [],
    setGuesses: jest.fn(),
    isNotEnoughRoutes: false,
    setIsNotEnoughRoutes: jest.fn(),
    isGuessInvalid: false,
    setIsGuessInvalid: jest.fn(),
    toastStack: [],
    setToastStack: jest.fn(),
    absentRoutes: [],
    setAbsentRoutes: jest.fn(),
    presentRoutes: [],
    setPresentRoutes: jest.fn(),
    similarRoutes: [],
    setSimilarRoutes: jest.fn(),
    similarRoutesIndexes: {},
    setSimilarRoutesIndexes: jest.fn(),
    correctRoutes: [],
    setCorrectRoutes: jest.fn(),
  }),
}));

jest.mock('./hooks/useGameData', () => ({
  __esModule: true,
  useGameData: () => ({ isDataLoaded: true, isGameDataLoaded: true }),
}));

jest.mock('./hooks/useKeyboard', () => ({
  __esModule: true,
  useKeyboard: () => ({ onChar: jest.fn(), onDelete: jest.fn(), onEnter: jest.fn() }),
}));

jest.mock('./utils/answerValidations', () => ({
  __esModule: true,
  isAccessible: () => false,
  isNight: () => false,
  isWeekend: () => false,
  routesWithNoService: () => [],
  todaysSolution: () => ({ origin: 'R01', destination: 'R03' }),
  todayGameIndex: () => 0,
  NIGHT_GAMES: [],
}));

const createMapboxMock = () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    resize: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    fitBounds: jest.fn(),
    getCenter: jest.fn(() => ({ lng: { toFixed: () => '-73.98119' }, lat: { toFixed: () => '40.75855' } })),
    getZoom: jest.fn(() => ({ toFixed: () => '12' })),
    dragRotate: { disable: jest.fn() },
    touchZoomRotate: { disableRotation: jest.fn() },
    off: jest.fn(),
  })),
  LngLatBounds: jest.fn(() => ({ extend: jest.fn(function() { return this; }), isEmpty: () => false })),
});

jest.mock('mapbox-gl', () => createMapboxMock());
jest.mock('!mapbox-gl', () => createMapboxMock(), { virtual: true });

const { SettingsProvider } = require('./contexts/SettingsContext');
const { StatsProvider } = require('./contexts/StatsContext');
const App = require('./App').default;

const renderApp = () => render(
  <StatsProvider>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StatsProvider>
);

describe('App', () => {
  it('renders the app', () => {
    renderApp();
    expect(screen.getByText(/Subwaydle Remastered/i)).toBeInTheDocument();
    expect(document.querySelector('.keyboard')).toBeInTheDocument();
  });
});
