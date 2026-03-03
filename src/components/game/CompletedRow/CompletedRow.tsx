import { useEffect, useState } from 'react';
import { Grid, Icon, Label, Segment } from 'semantic-ui-react';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';
import { checkGuessStatuses } from '../../../utils/answerValidations';
import { useSettings } from '../../../contexts';
import type { CompletedRowProps } from '../../../types/components';
import type { GuessStatus } from '../../../types/game';

const CompletedRow = ({ guess, practiceMode, practiceGameIndex }: CompletedRowProps): React.ReactElement => {
  const classNameArrays = checkGuessStatuses(guess, practiceMode, practiceGameIndex);
  const { settings } = useSettings();
  const [shouldFlip, setShouldFlip] = useState<boolean>(false);
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
        setShowAnswer((prev) => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, revealTime);
    });

    return () => {
      clearTimeout(flipTimer);
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [guess]);

  const getStatusIcon = (status: GuessStatus): React.ReactElement => {
    if (status === 'present') {
      return <Icon name="arrows alternate horizontal" fitted />;
    }
    if (status === 'correct') {
      return <Icon name="check" fitted />;
    }
    if (status === 'similar') {
      return <Icon name="sync alternate" fitted />;
    }
    if (status === 'sameColor') {
      return <Icon name="sitemap" fitted />;
    }
    return <Icon name="x" fitted />;
  };

  return (
    <Grid.Row>
      {guess.map((routeId, index) => {
        return (
          <Grid.Column key={`guess-${index}`}>
            <Segment
              placeholder
              className={`${showAnswer[index] ? classNameArrays[index] : ''} ${shouldFlip ? 'flip' : ''}`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {settings.display.showAnswerStatusBadges && showAnswer[index] && (
                <Label as="a" floating circular size="tiny">
                  {getStatusIcon(classNameArrays[index] as GuessStatus)}
                </Label>
              )}
              <TrainBullet id={routeId} size="medium" />
            </Segment>
          </Grid.Column>
        );
      })}
    </Grid.Row>
  );
};

export default CompletedRow;
