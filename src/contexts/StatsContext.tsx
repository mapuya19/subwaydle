import { createContext, useContext, useState } from 'react';
import { loadStats, GameStats } from '../utils/stats';

interface StatsContextValue {
  stats: GameStats;
  setStats: (stats: GameStats) => void;
}

const StatsContext = createContext<StatsContextValue | null>(null);

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const [stats, setStats] = useState<GameStats>(() => loadStats());

  const value: StatsContextValue = {
    stats,
    setStats,
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = (): StatsContextValue => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
};
