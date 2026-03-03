/**
 * Component prop types
 */

import type { PracticeMode, RouteCombo } from './game';

export interface KeyboardProps {
  noService: string[];
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  correctRoutes: string[];
  similarRoutes: string[];
  presentRoutes: string[];
  absentRoutes: string[];
}

export interface KeyProps {
  id: string;
  isDarkMode: boolean;
  onClick: (id: string) => void;
  disabled: boolean;
  isCorrect: boolean;
  isSimilar: boolean;
  isPresent: boolean;
  isAbsent: boolean;
}

export interface GameGridProps {
  guesses: RouteCombo[];
  currentGuess: string[];
  isGameWon: boolean;
  isGameLost: boolean;
  practiceMode?: PracticeMode;
  practiceGameIndex?: number;
  attempts?: number;
  inPlay?: boolean;
  shouldShake?: boolean;
}

export interface CompletedRowProps {
  guess: RouteCombo;
  isRevealed?: boolean;
  practiceMode?: PracticeMode;
  practiceGameIndex?: number;
  id?: number;
}

export interface CurrentRowProps {
  guess: string[];
  currentGuess?: string[];
  shouldShake?: boolean;
}

export interface EmptyRowProps {
  count: number;
}

export interface SolutionModalProps {
  open: boolean;
  handleModalClose: () => void;
  isGameWon: boolean;
  guesses: RouteCombo[];
  practiceMode?: PracticeMode | null;
  practiceGameIndex?: number | null;
}

export interface SettingsModalProps {
  open: boolean;
  handleModalClose: () => void;
}

export interface PracticeModalProps {
  open: boolean;
  handleModalClose: () => void;
}

export interface AboutModalProps {
  open: boolean;
  handleModalClose: () => void;
}

export interface TrainBulletProps {
  id: string;
  size?: 'small' | 'medium' | 'large';
}

export interface CountdownProps {}

export interface ToastProps {
  message: string;
  duration?: number;
}

export interface HistogramProps {
  isDarkMode: boolean;
  guesses: RouteCombo[];
}

export interface MapFrameProps {
  practiceMode?: PracticeMode | null;
  practiceGameIndex?: number | null;
}

export interface StatsHistogramProps {
  isDarkMode: boolean;
  stats: {
    distribution: number[];
    played: number;
    win: number;
    streak: number;
    maxStreak: number;
  };
}
