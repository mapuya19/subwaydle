import { useEffect, useState } from 'react';
import { Grid } from 'semantic-ui-react';
import CompletedRow from '../CompletedRow/CompletedRow';
import CurrentRow from '../CurrentRow/CurrentRow';
import EmptyRow from '../EmptyRow/EmptyRow';
import { useDarkMode } from '../../../contexts';
import type { GameGridProps } from '../../../types/components';
import './GameGrid.scss';

const GameGrid = ({
  currentGuess,
  guesses,
  attempts = 6,
  inPlay = false,
  practiceMode,
  practiceGameIndex,
  shouldShake,
}: GameGridProps): React.ReactElement => {
  const isDarkMode = useDarkMode(practiceMode);
  const emptyRows = [...Array(inPlay ? attempts - 1 : attempts).keys()];
  const [shakeRowIndex, setShakeRowIndex] = useState<number>(-1);

  useEffect(() => {
    if (shouldShake) {
      // Shake the current row (which is guesses.length-th row)
      setShakeRowIndex(guesses.length);
      const timer = setTimeout(() => setShakeRowIndex(-1), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShake, guesses.length]);

  return (
    <Grid centered columns={4} className={isDarkMode ? 'game-grid dark' : 'game-grid'}>
      {guesses.slice().map((g, i) => {
        emptyRows.pop();
        return (
          <CompletedRow
            id={i}
            guess={g}
            key={i}
            practiceMode={practiceMode}
            practiceGameIndex={practiceGameIndex}
          />
        );
      })}
      {inPlay && <CurrentRow guess={currentGuess} currentGuess={currentGuess} shouldShake={shakeRowIndex === guesses.length} />}
      {emptyRows.map((_, i) => {
        return <EmptyRow count={3} key={i} />;
      })}
    </Grid>
  );
};

export default GameGrid;
