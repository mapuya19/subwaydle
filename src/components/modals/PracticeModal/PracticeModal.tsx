import { useState, useEffect } from 'react';
import { Modal, Header, Grid, Radio, Button } from 'semantic-ui-react';
import { useSettings, useDarkMode } from '../../../contexts';
import { GameSettings } from '../../../utils/settings';
import { PracticeMode } from '../../../utils/constants';

import './PracticeModal.scss';

interface PracticeModalProps {
  open: boolean;
  handleClose: () => void;
  onPracticeModeChange: (settings: GameSettings, forceNewGame?: boolean) => void;
}

const PracticeModal = ({ open, handleClose, onPracticeModeChange }: PracticeModalProps) => {
  const { settings, setSettings } = useSettings();
  const isDarkMode = useDarkMode();
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(settings.practice?.mode || null);

  // Sync selectedMode with current practice mode when modal opens
  useEffect(() => {
    if (open) {
      setSelectedMode(settings.practice?.mode || null);
    }
  }, [open, settings.practice?.mode]);

  const handleModeChange = (mode: PracticeMode): void => {
    setSelectedMode(mode);
  };

  const handleStartPractice = (): void => {
    const updatedSettings: GameSettings = {
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
  };

  const handleExitPractice = (): void => {
    const updatedSettings: GameSettings = {
      ...settings,
      practice: {
        ...settings.practice,
        enabled: false,
      }
    };

    setSettings(updatedSettings);
    onPracticeModeChange(updatedSettings);
    handleClose();
  };

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
};

export default PracticeModal;
