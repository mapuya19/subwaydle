import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { StatsProvider } from './contexts/StatsContext';
import App from './App';

vi.mock('./components/game', () => ({
  __esModule: true,
  GameGrid: () => <div className="game-grid" />,
  Keyboard: () => <div className="keyboard" />,
}));

vi.mock('./components/modals/AboutModal', () => ({ __esModule: true, default: () => null }));
vi.mock('./components/modals/SolutionModal', () => ({ __esModule: true, default: () => null }));
vi.mock('./components/stats/StatsModal', () => ({ __esModule: true, default: () => null }));
vi.mock('./components/modals/SettingsModal', () => ({ __esModule: true, default: () => null }));
vi.mock('./components/modals/PracticeModal', () => ({ __esModule: true, default: () => null }));

vi.mock('./hooks/usePracticeMode', () => ({
  __esModule: true,
  usePracticeMode: () => ({
    practiceMode: null,
    effectivePracticeGameIndex: 0,
    practiceGameIndex: 0,
    setPracticeGameIndex: vi.fn(),
    urlPracticeGameIndex: null,
    previousPracticeMode: null,
    setPreviousPracticeMode: vi.fn(),
    handlePracticeModeChange: vi.fn(),
  }),
}));

vi.mock('./hooks/useGameState', () => ({
  __esModule: true,
  useGameState: () => ({
    currentGuess: [] as string[],
    setCurrentGuess: vi.fn(),
    isGameWon: false,
    setIsGameWon: vi.fn(),
    isGameLost: false,
    setIsGameLost: vi.fn(),
    guesses: [] as string[][],
    setGuesses: vi.fn(),
    isNotEnoughRoutes: false,
    setIsNotEnoughRoutes: vi.fn(),
    isGuessInvalid: false,
    setIsGuessInvalid: vi.fn(),
    toastStack: [] as any[],
    setToastStack: vi.fn(),
    absentRoutes: [] as string[],
    setAbsentRoutes: vi.fn(),
    presentRoutes: [] as string[],
    setPresentRoutes: vi.fn(),
    similarRoutes: [] as string[],
    setSimilarRoutes: vi.fn(),
    similarRoutesIndexes: {} as Record<string, number[]>,
    setSimilarRoutesIndexes: vi.fn(),
    correctRoutes: [] as string[],
    setCorrectRoutes: vi.fn(),
  }),
}));

vi.mock('./hooks/useGameData', () => ({
  __esModule: true,
  useGameData: () => ({ isDataLoaded: true, isGameDataLoaded: true }),
}));

vi.mock('./hooks/useKeyboard', () => ({
  __esModule: true,
  useKeyboard: () => ({ onChar: vi.fn(), onDelete: vi.fn(), onEnter: vi.fn() }),
}));

vi.mock('./utils/answerValidations', () => ({
  __esModule: true,
  isAccessible: () => false,
  isNight: () => false,
  isWeekend: () => false,
  routesWithNoService: () => [] as string[],
  todaysSolution: () => ({ origin: 'R01', destination: 'R03' }),
  todayGameIndex: () => 0,
  NIGHT_GAMES: [] as number[],
}));

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => ({
      on: vi.fn(),
      resize: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      fitBounds: vi.fn(),
      getCenter: vi.fn(() => ({ lng: { toFixed: () => '-73.98119' }, lat: { toFixed: () => '40.75855' } })),
      getZoom: vi.fn(() => ({ toFixed: () => '12' })),
      dragRotate: { disable: vi.fn() },
      touchZoomRotate: { disableRotation: vi.fn() },
      off: vi.fn(),
    })),
    LngLatBounds: vi.fn(() => ({ extend: vi.fn(function() { return this; }), isEmpty: () => false })),
  },
}));

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
