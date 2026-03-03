/**
 * Core game types
 */

export type PracticeMode = 'weekday' | 'weekend' | 'night' | 'accessible' | null;

export type GuessStatus = 'correct' | 'similar' | 'present' | 'absent' | 'sameColor';

export interface Route {
  id: string;
  name: string;
  color: string;
  text_color: string | null;
  alternate_name: string | null;
}

export interface Station {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface Solution {
  origin: string;
  destination: string;
  first_transfer_arrival?: string;
  first_transfer_departure?: string;
  second_transfer_arrival?: string;
  second_transfer_departure?: string;
}

export type RouteCombo = [string, string, string];
export type RouteComboKey = string;
export type RouteId = string;

export interface GameData {
  answers: (string[] | string)[] | null;
  solutions: Record<RouteComboKey, Solution> | null;
  routings: Record<RouteId, string[]> | null;
  loading: boolean;
  loadPromise: Promise<GameData> | null;
  currentMode: PracticeMode;
}

export interface TransferStation {
  [stopId: string]: string | string[];
}

export interface GameModeFlags {
  isNight: boolean;
  isAccessible: boolean;
  isWeekend: boolean;
}

export interface SimilarRouteIndexes {
  [routeId: string]: number[];
}

export interface GameState {
  guesses: RouteCombo[];
  currentGuess: string[];
  isGameWon: boolean;
  isGameLost: boolean;
  correctRoutes: RouteId[];
  similarRoutes: RouteId[];
  presentRoutes: RouteId[];
  absentRoutes: RouteId[];
  similarRoutesIndexes: SimilarRouteIndexes;
}
