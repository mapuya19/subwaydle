import { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Header, Grid, Radio, Button } from 'semantic-ui-react';
import { useSettings, useDarkMode } from '../../../contexts';

import './PracticeModal.scss'

const PracticeModal = (props) => {
  const { open, handleClose, onPracticeModeChange } = props;
  const { settings, setSettings } = useSettings();
  const isDarkMode = useDarkMode();
  const [selectedMode, setSelectedMode] = useState(settings.practice?.mode || null);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
  }

  const handleStartPractice = () => {
    const updatedSettings = {
      ...settings,
      practice: {
        ...settings.practice,
        mode: selectedMode,
        enabled: true,
      }
    };

    setSettings(updatedSettings);
    onPracticeModeChange(updatedSettings);
    handleClose();
  }

  const handleExitPractice = () => {
    const updatedSettings = {
      ...settings,
      practice: {
        ...settings.practice,
        enabled: false,
      }
    };

    setSettings(updatedSettings);
    onPracticeModeChange(updatedSettings);
    handleClose();
  }

  return (
    <Modal closeIcon open={open} onClose={handleClose} size='small' className={isDarkMode ? 'practice-modal dark' : 'practice-modal'}>
      <Modal.Header>Practice Mode</Modal.Header>
      <Modal.Content scrolling>
        <Header>Select a practice mode:</Header>
        <p>Choose a mode to practice with different routing patterns. Each mode is exclusive.</p>
        <Grid>
          <Grid.Row>
            <Grid.Column>
              <Radio
                label='Weekday'
                name='practiceMode'
                value='weekday'
                checked={selectedMode === 'weekday'}
                onChange={() => handleModeChange('weekday')}
              />
              <p className='mode-description'>Practice with weekday routing patterns</p>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Radio
                label='Weekend'
                name='practiceMode'
                value='weekend'
                checked={selectedMode === 'weekend'}
                onChange={() => handleModeChange('weekend')}
              />
              <p className='mode-description'>Practice with weekend routing patterns</p>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Radio
                label='Late Night'
                name='practiceMode'
                value='night'
                checked={selectedMode === 'night'}
                onChange={() => handleModeChange('night')}
              />
              <p className='mode-description'>Practice with late night routing patterns</p>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Radio
                label='Accessible Routes ♿️'
                name='practiceMode'
                value='accessible'
                checked={selectedMode === 'accessible'}
                onChange={() => handleModeChange('accessible')}
              />
              <p className='mode-description'>Practice with accessible routing patterns</p>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        {settings.practice?.enabled && (
          <div className='exit-practice-section'>
            <Header as='h4'>Currently in Practice Mode</Header>
            <Button negative onClick={handleExitPractice}>
              Exit Practice Mode
            </Button>
          </div>
        )}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button positive disabled={!selectedMode} onClick={handleStartPractice}>
          Start Practice
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

PracticeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  onPracticeModeChange: PropTypes.func.isRequired,
};

export default PracticeModal;

