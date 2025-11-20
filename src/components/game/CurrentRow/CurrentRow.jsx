import { useEffect, useState } from 'react';
import { Grid, Segment } from 'semantic-ui-react';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';

const CurrentRow = (props) => {
  const { currentGuess, shouldShake } = props;
  const emptyGuesses = [...Array(3).keys()];
  const [bouncingIndex, setBouncingIndex] = useState(-1);

  useEffect(() => {
    // Trigger bounce animation on the last tile when a new one is added
    if (currentGuess.length > 0) {
      setBouncingIndex(currentGuess.length - 1);
      const timer = setTimeout(() => setBouncingIndex(-1), 200);
      return () => clearTimeout(timer);
    }
  }, [currentGuess.length]);

  return (
    <Grid.Row className={shouldShake ? 'shake' : ''}>
      {
        currentGuess.map((routeId, index) => {
          emptyGuesses.pop();
          return (
            <Grid.Column key={`guess-${index}`}>
              <Segment placeholder className={bouncingIndex === index ? 'bounce' : ''}>
                <TrainBullet id={routeId} size='medium' />
              </Segment>
            </Grid.Column>
          );
        })
      }
      {
        emptyGuesses.map((i) => {
          return (
            <Grid.Column key={i}>
              <Segment placeholder></Segment>
            </Grid.Column>
          );
        })
      }
    </Grid.Row>
  );
}

export default CurrentRow;
