import { todayGameIndex, checkGuessStatuses, isNight, isWeekend, isAccessible } from './answerValidations';
import { isIosDevice } from './constants';
import { PracticeMode } from './constants';

type Guess = string[];

export const shareStatus = (guesses: Guess[], lost: boolean, practiceMode: PracticeMode | null = null, practiceGameIndex: number | null = null): void => {
  let baseTitle = 'Subwaydle Remastered';
  let gameIndex = todayGameIndex();
  let shareUrl = window.location.origin + window.location.pathname;

  if (practiceMode && practiceGameIndex !== null) {
    shareUrl += `?practice=${practiceMode}&game=${practiceGameIndex}`;
    
    const modeLabels: Record<string, string> = {
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
  
  const shareText = practiceMode && practiceGameIndex !== null 
    ? `${text}\n\nPlay this puzzle: ${shareUrl}`
    : text;
  
  const isIos = isIosDevice();
  if (navigator.share && isIos) {
    navigator.share({text: shareText});
  } else {
    navigator.clipboard.writeText(shareText);
  }
};

const generateEmojiGrid = (guesses: Guess[], practiceMode: PracticeMode | null = null, practiceGameIndex: number | null = null): string => {
  return guesses
    .map((guess) => {
      const status = checkGuessStatuses(guess, (practiceMode ?? undefined) as null | undefined, (practiceGameIndex ?? undefined) as null | undefined);
      return status.map((s) => {
          switch (s) {
            case 'correct':
              return '🟢';
            case 'similar':
              return '🔵';
            case 'sameColor':
              return '🟠';
            case 'present':
              return '🟡';
            default:
              return '⚪';
          }
        })
        .join('');
    })
    .join('\n');
};
