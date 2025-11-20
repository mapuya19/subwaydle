import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Grid, Button } from 'semantic-ui-react';
import Key from './Key';
import routes from '../../../data/routes.json';
import { useDarkMode } from '../../../contexts';

import './Keyboard.scss';

const Keyboard = (props) => {
  const {
    noService,
    onChar, onDelete, onEnter,
    correctRoutes, similarRoutes, presentRoutes, absentRoutes
  } = props;
  const isDarkMode = useDarkMode();

  useEffect(() => {
    const listener = (e) => {
      if (e.code === 'Enter') {
        onEnter();
      } else if (e.code === 'Backspace') {
        onDelete();
      } else {
        const key = e.key.toUpperCase()
        if (key.length === 1 && routes[key]) {
          onChar(key);
        } else if (key === 'S') {
          onChar('GS');
        } else if (key === 'K') {
          onChar('FS');
        } else if (key === 'I') {
          onChar('SI');
        }
      }
    }
    window.addEventListener('keyup', listener)
    return () => {
      window.removeEventListener('keyup', listener)
    }
  }, [onEnter, onDelete, onChar])

  const renderKey = (routeId) => (
    <Key
      id={routeId}
      key={routeId}
      isDarkMode={isDarkMode}
      onClick={onChar}
      disabled={noService.includes(routeId)}
      isCorrect={correctRoutes.includes(routeId)}
      isSimilar={similarRoutes.includes(routeId)}
      isPresent={presentRoutes.includes(routeId)}
      isAbsent={absentRoutes.includes(routeId)}
    />
  );

  return (
    <Grid centered columns={7} className='keyboard'>
      <Grid.Row>
        {["1", "2", "3", "4", "5", "6", "7"].map(renderKey)}
      </Grid.Row>
      <Grid.Row>
        {["A", "B", "C", "D", "E", "F", "G"].map(renderKey)}
      </Grid.Row>
      <Grid.Row>
        {["J", "L", "M", "N", "Q", "R", "W"].map(renderKey)}
      </Grid.Row>
      <Grid.Row columns={6}>
        <Grid.Column className='key' stretched>
          <Button onClick={onEnter} inverted={isDarkMode}>
            Enter
          </Button>
        </Grid.Column>
        {["SI", "GS", "FS", "H"].map(renderKey)}
        <Grid.Column className='key' stretched>
          <Button onClick={onDelete} inverted={isDarkMode}>
            Delete
          </Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
}

Keyboard.propTypes = {
  noService: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChar: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEnter: PropTypes.func.isRequired,
  correctRoutes: PropTypes.arrayOf(PropTypes.string).isRequired,
  similarRoutes: PropTypes.arrayOf(PropTypes.string).isRequired,
  presentRoutes: PropTypes.arrayOf(PropTypes.string).isRequired,
  absentRoutes: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Keyboard;
