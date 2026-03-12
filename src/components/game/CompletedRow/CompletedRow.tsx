import { useEffect, useState } from 'react';
import { Grid, Icon, Label, Segment } from 'semantic-ui-react';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';
import { checkGuessStatuses } from '../../../utils/answerValidations';
import { useSettings } from '../../../contexts';
import { PracticeMode } from '../../../utils/constants';

interface CompletedRowProps {
  guess: string[];
  practiceMode?: PracticeMode | null;
  practiceGameIndex?: number | null;
  id?: number;
}

const CompletedRow = ({ guess, practiceMode, practiceGameIndex }: CompletedRowProps) => {
  const classNameArrays = checkGuessStatuses(guess, practiceMode, practiceGameIndex);
  const { settings } = useSettings();
  const [shouldFlip, setShouldFlip] = useState(false);
  const [showAnswer, setShowAnswer] = useState<boolean[]>(Array(guess.length).fill(false));

  // Trigger flip animation when row is first rendered
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const flipTimer = setTimeout(() => {
      setShouldFlip(true);
    }, 50);

    // Delay showing answer colors for each tile until its flip reaches midpoint
    // Flip animation is 0.6s, midpoint is at 0.3s
    // Each tile has animationDelay of index * 0.1s
    const timers = guess.map((_, index) => {
      const animationDelay = index * 0.1; // in seconds
      const revealTime = 50 + animationDelay * 1000 + 300; // 50ms initial + delay + 300ms to midpoint
      return setTimeout(() => {
        setShowAnswer(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, revealTime);
    });

    return () => {
      clearTimeout(flipTimer);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [guess]);

  return (
    <Grid.Row>
      {
        guess.map((routeId, index) => {
          return (
            <Grid.Column key={`guess-${index}`}>
              <Segment
                placeholder
                className={`${showAnswer[index] ? classNameArrays[index] : ''} ${shouldFlip ? 'flip' : ''}`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {settings.display.showAnswerStatusBadges && showAnswer[index] &&
                  <Label as='a' floating circular size='tiny'>
                    {
                      classNameArrays[index] === 'present' ?
                        <Icon name="arrows alternate horizontal" fitted /> :
                        classNameArrays[index] === 'correct' ?
                          <Icon name="check" fitted /> :
                          classNameArrays[index] === 'similar' ?
                            <Icon name="sync alternate" fitted /> :
                          classNameArrays[index] === 'sameColor' ?
                            <Icon name="sitemap" fitted /> :
                            <Icon name="x" fitted />
                    }
                  </Label>
                }
                <TrainBullet id={routeId} size='medium' />
              </Segment>
            </Grid.Column>
          );
        })
      }
    </Grid.Row>
  );
};

export default CompletedRow;
