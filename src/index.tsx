import React from 'react';
import { createRoot } from 'react-dom/client';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsProvider, StatsProvider } from './contexts';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <StatsProvider>
          <App />
        </StatsProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
