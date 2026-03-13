/** A toast notification in the stack */
export interface ToastItem {
  id: string;
  message: string;
  type?: string;
  visible?: boolean;
}

/** Persisted game state shape for localStorage */
export interface GameState {
  guesses: string[][];
  answer: string;
}
