import { todayGameIndex, checkGuessStatuses, isNight, isWeekend, isAccessible } from './answerValidations';
import { isIosDevice } from './constants';

export const shareStatus = (guesses, lost, practiceMode = null, practiceGameIndex = null) => {
  let title = `Subwaydle Remastered ${todayGameIndex()}`;
  let shareUrl = window.location.origin + window.location.pathname;

  if (practiceMode && practiceGameIndex !== null) {
    // Generate shareable URL for practice mode
    shareUrl += `?practice=${practiceMode}&game=${practiceGameIndex}`;
    
    // Update title for practice mode
    const modeLabels = {
      weekday: 'Weekday',
      weekend: 'Weekend',
      night: 'Late Night',
      accessible: 'Accessible'
    };
    const modeLabel = modeLabels[practiceMode] || practiceMode;
    title = `Subwaydle Remastered Practice (${modeLabel} #${practiceGameIndex})`;
    
    if (practiceMode === 'accessible') {
      title += ' ♿️';
    }
  } else {
    // Regular daily puzzle
    if (isNight()) {
      title = `Subwaydle Remastered ${todayGameIndex()} (Late Night Edition)`;
    } else if (isWeekend()) {
      title = `Subwaydle Remastered ${todayGameIndex()} (Weekend Edition)`;
    } else if (isAccessible()) {
      title = `Subwaydle Remastered ${todayGameIndex()} ♿️`
    }
  }
  
  const text = `${title} ${lost ? 'X' : guesses.length}/6\n\n` +
    generateEmojiGrid(guesses, practiceMode, practiceGameIndex);
  
  // Add URL to share text if in practice mode
  const shareText = practiceMode && practiceGameIndex !== null 
    ? `${text}\n\nPlay this puzzle: ${shareUrl}`
    : text;
  
  const isIos = isIosDevice();
  if (navigator.share && isIos) {
    navigator.share({text: shareText});
  } else {
    navigator.clipboard.writeText(shareText);
  }
}

const generateEmojiGrid = (guesses, practiceMode = null, practiceGameIndex = null) => {
  return guesses
    .map((guess) => {
      const status = checkGuessStatuses(guess, practiceMode, practiceGameIndex);
      return status.map((s) => {
          switch (s) {
            case 'correct':
              return '🟢';
            case 'similar':
              return '🔵';
            case 'sameColor':
              return '🟠'; // Orange emoji for same-color hint
            case 'present':
              return '🟡';
            default:
              return '⚪';
          }
        })
        .join('');
    })
    .join('\n');
}
