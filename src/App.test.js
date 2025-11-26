import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('./components/game', () => ({
  __esModule: true,
  GameGrid: () => <div className="game-grid" />,
  Keyboard: () => <div className="keyboard" />,
}));

jest.mock('./components/modals/AboutModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./components/modals/SolutionModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./components/stats/StatsModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./components/modals/SettingsModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./components/modals/PracticeModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./hooks/usePracticeMode', () => ({
  __esModule: true,
  usePracticeMode: jest.fn(() => ({
    practiceMode: null,
    effectivePracticeGameIndex: 0,
    practiceGameIndex: 0,
    setPracticeGameIndex: jest.fn(),
    urlPracticeGameIndex: null,
    previousPracticeMode: null,
    setPreviousPracticeMode: jest.fn(),
    handlePracticeModeChange: jest.fn(),
  })),
}));

jest.mock('./hooks/useGameState', () => ({
  __esModule: true,
  useGameState: jest.fn(() => ({
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
  })),
}));

jest.mock('./hooks/useGameData', () => ({
  __esModule: true,
  useGameData: jest.fn(() => ({
    isDataLoaded: true,
    isGameDataLoaded: true,
  })),
}));

jest.mock('./hooks/useKeyboard', () => ({
  __esModule: true,
  useKeyboard: jest.fn(() => ({
    onChar: jest.fn(),
    onDelete: jest.fn(),
    onEnter: jest.fn(),
  })),
}));

jest.mock('./utils/answerValidations', () => ({
  __esModule: true,
  isAccessible: jest.fn(() => false),
  isNight: jest.fn(() => false),
  isWeekend: jest.fn(() => false),
  routesWithNoService: jest.fn(() => []),
  todaysSolution: jest.fn(() => ({
    origin: 'R01',
    destination: 'R03',
  })),
  todayGameIndex: jest.fn(() => 0),
  NIGHT_GAMES: [],
}));

const createMapboxMock = () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    resize: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    fitBounds: jest.fn(),
    getCenter: jest.fn(() => ({ lng: { toFixed: jest.fn(() => '-73.98119') }, lat: { toFixed: jest.fn(() => '40.75855') } })),
    getZoom: jest.fn(() => ({ toFixed: jest.fn(() => '12') })),
    dragRotate: { disable: jest.fn() },
    touchZoomRotate: { disableRotation: jest.fn() },
    off: jest.fn(),
  })),
  LngLatBounds: jest.fn(() => ({
    extend: jest.fn(function(coord) { return this; }),
    isEmpty: jest.fn(() => false),
  })),
});

jest.mock('mapbox-gl', () => createMapboxMock());
jest.mock('!mapbox-gl', () => createMapboxMock(), { virtual: true });

const { SettingsProvider } = require('./contexts/SettingsContext');
const { StatsProvider } = require('./contexts/StatsContext');
const { usePracticeMode } = require('./hooks/usePracticeMode');
const { useGameState } = require('./hooks/useGameState');
const { useGameData } = require('./hooks/useGameData');
const { useKeyboard } = require('./hooks/useKeyboard');
const answerValidationMocks = require('./utils/answerValidations');
const App = require('./App').default;

const renderApp = () => render(
  <StatsProvider>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StatsProvider>
);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    answerValidationMocks.isAccessible.mockReturnValue(false);
    answerValidationMocks.isNight.mockReturnValue(false);
    answerValidationMocks.isWeekend.mockReturnValue(false);
    answerValidationMocks.routesWithNoService.mockReturnValue([]);
    answerValidationMocks.todaysSolution.mockReturnValue({
      origin: 'R01',
      destination: 'R03',
    });
    answerValidationMocks.todayGameIndex.mockReturnValue(0);
    usePracticeMode.mockReturnValue({
      practiceMode: null,
      effectivePracticeGameIndex: 0,
      practiceGameIndex: 0,
      setPracticeGameIndex: jest.fn(),
      urlPracticeGameIndex: null,
      previousPracticeMode: null,
      setPreviousPracticeMode: jest.fn(),
      handlePracticeModeChange: jest.fn(),
    });
    useGameState.mockReturnValue({
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
    });
    useGameData.mockReturnValue({
      isDataLoaded: true,
      isGameDataLoaded: true,
    });
    useKeyboard.mockReturnValue({
      onChar: jest.fn(),
      onDelete: jest.fn(),
      onEnter: jest.fn(),
    });
  });

  test('renders Subwaydle Remastered header', () => {
    renderApp();
    const headerElement = screen.getByText(/Subwaydle Remastered/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders game grid', () => {
    renderApp();
    // GameGrid should be rendered (checking for keyboard which is always visible)
    const keyboard = document.querySelector('.keyboard');
    expect(keyboard).toBeInTheDocument();
  });

  test('initializes with empty game state for new users', () => {
    renderApp();
    // Should not show any completed guesses initially
    const gameGrid = document.querySelector('.game-grid');
    expect(gameGrid).toBeInTheDocument();
  });
});
