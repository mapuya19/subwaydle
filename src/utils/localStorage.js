const getGameStateKey = (practiceMode = null, practiceGameIndex = null) => {
  if (practiceMode && practiceGameIndex !== null) {
    return `gameState_${practiceMode}_${practiceGameIndex}`;
  }
  return 'gameState';
}

export const saveGameStateToLocalStorage = (gameState, practiceMode = null, practiceGameIndex = null) => {
  const key = getGameStateKey(practiceMode, practiceGameIndex);
  localStorage.setItem(key, JSON.stringify(gameState))
}

export const loadGameStateFromLocalStorage = (practiceMode = null, practiceGameIndex = null) => {
  const key = getGameStateKey(practiceMode, practiceGameIndex);
  const state = localStorage.getItem(key)
  return state && state.trim() ? (JSON.parse(state)) : null
}

const gameStatKey = 'gameStats'

export const saveStatsToLocalStorage = (gameStats) => {
  localStorage.setItem(gameStatKey, JSON.stringify(gameStats))
}

export const loadStatsFromLocalStorage = () => {
  const stats = localStorage.getItem(gameStatKey)
  return stats && stats.trim() ? (JSON.parse(stats)) : null
}

export const isNewToGame = (practiceMode = null, practiceGameIndex = null) => {
  const key = getGameStateKey(practiceMode, practiceGameIndex);
  return !(localStorage.getItem(key) || localStorage.getItem(gameStatKey));
}

const gameSettingsKey = 'gameSettings'

export const saveSettingsToLocalStorage = (gameSettings) => {
  localStorage.setItem(gameSettingsKey, JSON.stringify(gameSettings))
}

export const loadSettingsFromLocalStorage = () => {
  const settings = localStorage.getItem(gameSettingsKey)
  return settings && settings.trim() ? (JSON.parse(settings)) : null
}