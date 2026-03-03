import { createContext, useContext, useState } from 'react';
import { loadStats } from '../utils/stats';
import type { StatsContextValue } from '../types/contexts';
import type { Stats } from '../types/data';

export const StatsContext = createContext<StatsContextValue | null>(null);

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const [stats, setStats] = useState<Stats>(() => loadStats() as Stats);

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
