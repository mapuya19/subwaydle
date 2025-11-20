import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Header, Grid, Radio, Button } from 'semantic-ui-react';
import { useSettings, useDarkMode } from '../../../contexts';

import './PracticeModal.scss'

const PracticeModal = (props) => {
  const { open, handleClose, onPracticeModeChange } = props;
  const { settings, setSettings } = useSettings();
  const isDarkMode = useDarkMode();
  const [selectedMode, setSelectedMode] = useState(settings.practice?.mode || null);

  // Sync selectedMode with current practice mode when modal opens
  useEffect(() => {
    if (open) {
      setSelectedMode(settings.practice?.mode || null);
    }
  }, [open, settings.practice?.mode]);

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
    // Always force a new game when clicking "Start Practice"
    onPracticeModeChange(updatedSettings, true);
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
        <Header>Try out different routing patterns:</Header>
        <Grid>
          <Grid.Row>
            <Grid.Column>
              <Radio
                label='Weekday 📅'
                name='practiceMode'
                value='weekday'
                checked={selectedMode === 'weekday'}
                onChange={() => handleModeChange('weekday')}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Radio
                label='Weekend 🎉'
                name='practiceMode'
                value='weekend'
                checked={selectedMode === 'weekend'}
                onChange={() => handleModeChange('weekend')}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Radio
                label='Late Night 🌙'
                name='practiceMode'
                value='night'
                checked={selectedMode === 'night'}
                onChange={() => handleModeChange('night')}
              />
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
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Modal.Content>
      <Modal.Actions>
        {settings.practice?.enabled && (
          <Button negative onClick={handleExitPractice}>
            Exit Practice Mode
          </Button>
        )}
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

