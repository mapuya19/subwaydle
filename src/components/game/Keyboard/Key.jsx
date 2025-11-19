import PropTypes from 'prop-types';
import { Grid, Button } from 'semantic-ui-react';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';
import { useDarkMode } from '../../../contexts';

import './Key.scss';

const Key = (props) => {
  const { id, disabled, onClick, isCorrect, isSimilar, isPresent, isAbsent } = props;
  const isDarkMode = useDarkMode();

  const handleClick = () => {
    onClick(id);
  }

  let className = '';

  if (isCorrect) {
    className = 'correct';
  } else if (isSimilar) {
    className = 'similar';
  } else if (isPresent) {
    className = 'present';
  } else if (isAbsent) {
    className = 'absent'
  }

  return (
    <Grid.Column className='key' stretched>
      <Button disabled={disabled} onClick={handleClick} className={className} inverted={isDarkMode}>
        <TrainBullet id={id} size='small' />
      </Button>
    </Grid.Column>
  )
}

Key.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  isCorrect: PropTypes.bool,
  isSimilar: PropTypes.bool,
  isPresent: PropTypes.bool,
  isAbsent: PropTypes.bool,
};

Key.defaultProps = {
  disabled: false,
  isCorrect: false,
  isSimilar: false,
  isPresent: false,
  isAbsent: false,
};

export default Key;