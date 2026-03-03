import { createContext, useContext } from 'react';
import type { GameContextValue } from '../types/contexts';

export const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider = ({ value, children }: { value: GameContextValue; children: React.ReactNode }) => {
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
