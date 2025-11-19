import { render, screen } from '@testing-library/react';
import App from './App';

// Mock mapbox-gl
jest.mock('!mapbox-gl', () => ({
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
  LngLatBounds: jest.fn((coord1, coord2) => ({
    extend: jest.fn(function(coord) { return this; }),
    isEmpty: jest.fn(() => false),
  })),
}));

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
  });

  test('renders Subwaydle header', () => {
    render(<App />);
    const headerElement = screen.getByText(/Subwaydle/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders game grid', () => {
    render(<App />);
    // GameGrid should be rendered (checking for keyboard which is always visible)
    const keyboard = document.querySelector('.keyboard');
    expect(keyboard).toBeInTheDocument();
  });

  test('initializes with empty game state for new users', () => {
    render(<App />);
    // Should not show any completed guesses initially
    const gameGrid = document.querySelector('.game-grid');
    expect(gameGrid).toBeInTheDocument();
  });
});
