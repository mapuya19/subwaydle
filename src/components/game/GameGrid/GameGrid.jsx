import PropTypes from 'prop-types';
import { Grid } from 'semantic-ui-react';
import CompletedRow from '../CompletedRow/CompletedRow';
import CurrentRow from '../CurrentRow/CurrentRow';
import EmptyRow from '../EmptyRow/EmptyRow';
import { useDarkMode } from '../../../contexts';

import './GameGrid.scss';

const GameGrid = (props) => {
  const { currentGuess, guesses, attempts, inPlay, practiceMode, practiceGameIndex } = props;
  const isDarkMode = useDarkMode(practiceMode);
  const emptyRows = [...Array(inPlay ? (attempts - 1) : attempts).keys()];
  return (
    <Grid centered columns={4} className={isDarkMode ? 'game-grid dark' : 'game-grid'}>
      {
        guesses.slice().map((g, i) => {
          emptyRows.pop();
          return (
            <CompletedRow id={i} guess={g} key={i} practiceMode={practiceMode} practiceGameIndex={practiceGameIndex} />
          )
        })
      }
      {
        inPlay &&
        <CurrentRow currentGuess={currentGuess} />
      }
      {
        emptyRows.map((r, i) => {
          return (
            <EmptyRow key={i} />
          );
        })
      }
    </Grid>
  );
}

GameGrid.propTypes = {
  currentGuess: PropTypes.arrayOf(PropTypes.string).isRequired,
  guesses: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  attempts: PropTypes.number.isRequired,
  inPlay: PropTypes.bool.isRequired,
  practiceMode: PropTypes.string,
  practiceGameIndex: PropTypes.number,
};

export default GameGrid;
