import { useEffect, useState, useRef } from 'react';
import { Grid, Button } from 'semantic-ui-react';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';
import { useDarkMode } from '../../../contexts';
import type { KeyProps } from '../../../types/components';
import './Key.scss';

const Key = ({
  id,
  disabled = false,
  onClick,
  isCorrect = false,
  isSimilar = false,
  isPresent = false,
  isAbsent = false,
}: KeyProps): React.ReactElement => {
  const isDarkMode = useDarkMode();
  const [shouldBounce, setShouldBounce] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const prevStatus = useRef<string>('');

  useEffect(() => {
    const currentStatus = isCorrect ? 'correct' : isSimilar ? 'similar' : isPresent ? 'present' : isAbsent ? 'absent' : '';
    if (currentStatus && currentStatus !== prevStatus.current) {
      setShouldBounce(true);
      prevStatus.current = currentStatus;
      const timer = setTimeout(() => setShouldBounce(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, isSimilar, isPresent, isAbsent]);

  const handleClick = () => {
    onClick(id);
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  let className = '';

  if (isCorrect) {
    className = 'correct';
  } else if (isSimilar) {
    className = 'similar';
  } else if (isPresent) {
    className = 'present';
  } else if (isAbsent) {
    className = 'absent';
  }

  return (
    <Grid.Column className="key" stretched>
      <Button
        disabled={disabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`${className} ${shouldBounce ? 'bounce' : ''} ${isPressed ? 'pressed' : ''}`}
        inverted={isDarkMode}
      >
        <TrainBullet id={id} size="small" />
      </Button>
    </Grid.Column>
  );
};

export default Key;
