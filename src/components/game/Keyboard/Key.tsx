import { useEffect, useState, useRef } from 'react';
import { Grid, Button } from 'semantic-ui-react';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';
import { useDarkMode } from '../../../contexts';

import './Key.scss';

interface KeyProps {
  id: string;
  disabled?: boolean;
  onClick: (id: string) => void;
  isCorrect?: boolean;
  isSimilar?: boolean;
  isPresent?: boolean;
  isAbsent?: boolean;
}

const Key = ({
  id,
  disabled = false,
  onClick,
  isCorrect = false,
  isSimilar = false,
  isPresent = false,
  isAbsent = false,
}: KeyProps) => {
  const isDarkMode = useDarkMode();
  const [shouldBounce, setShouldBounce] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const prevStatus = useRef('');

  useEffect(() => {
    const currentStatus = isCorrect ? 'correct' : isSimilar ? 'similar' : isPresent ? 'present' : isAbsent ? 'absent' : '';
    if (currentStatus && currentStatus !== prevStatus.current) {
      setShouldBounce(true);
      prevStatus.current = currentStatus;
      const timer = setTimeout(() => setShouldBounce(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, isSimilar, isPresent, isAbsent]);

  const handleClick = (): void => {
    onClick(id);
  };

  const handleMouseDown = (): void => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = (): void => {
    setIsPressed(false);
  };

  const handleMouseLeave = (): void => {
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
    <Grid.Column className='key' stretched>
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
        <TrainBullet id={id} size='small' />
      </Button>
    </Grid.Column>
  );
};

export default Key;
