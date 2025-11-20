import { todayGameIndex, checkGuessStatuses, isNight, isWeekend, isAccessible } from './answerValidations';
import { isIosDevice } from './constants';

export const shareStatus = (guesses, lost, practiceMode = null, practiceGameIndex = null) => {
  let baseTitle = 'Subwaydle Remastered';
  let gameIndex = todayGameIndex();
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
    baseTitle = `Subwaydle Remastered Practice (${modeLabel})`;
    gameIndex = practiceGameIndex;
    
    if (practiceMode === 'accessible') {
      baseTitle += ' ♿️';
    }
  } else {
    // Regular daily puzzle
    if (isNight()) {
      baseTitle = `Subwaydle Remastered (Late Night Edition)`;
    } else if (isWeekend()) {
      baseTitle = `Subwaydle Remastered (Weekend Edition)`;
    } else if (isAccessible()) {
      baseTitle = `Subwaydle Remastered ♿️`;
    }
  }
  
  const score = lost ? 'X' : guesses.length;
  const text = `${baseTitle}\n#${gameIndex} ${score}/6\n\n` +
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
