import PropTypes from 'prop-types';
import { Modal, Header, Grid, Checkbox, Icon, Popup } from 'semantic-ui-react';
import { todayGameIndex, NIGHT_GAMES } from '../../../utils/answerValidations';
import { useSettings, useDarkMode } from '../../../contexts';

import './SettingsModal.scss'

const SettingsModal = (props) => {
  const { open, handleClose } = props;
  const { settings, setSettings } = useSettings();
  const isDarkMode = useDarkMode();

  const showAnswerStatusBadgesToggleChanged = (event, value) => {
    const updatedSettings = {
      ...settings,
      display: {
        ...settings.display,
        showAnswerStatusBadges: value.checked,
      }
    };

    setSettings(updatedSettings);
  }

  const darkModeToggleChanged = (event, value) => {
    const updatedSettings = {
      ...settings,
      display: {
        ...settings.display,
        darkMode: value.checked,
      }
    };

    setSettings(updatedSettings);
  }

  return (
    <Modal closeIcon open={open} onClose={handleClose} size='tiny' className={isDarkMode ? 'settings-modal dark' : 'settings-modal'}>
      <Modal.Header>Settings</Modal.Header>
      <Modal.Content scrolling>
        <Header>Display</Header>
        <Grid centered columns={3}>
          <Grid.Row>
            <Grid.Column className='fourteen wide'>
              Show answer status badges&nbsp;
              <Popup inverted={isDarkMode} content='Having trouble seeing the difference in the colors? Turn on status badges!'
                position="bottom center"
                trigger={
                  <Icon inverted={isDarkMode} name='question circle outline' size='large' link
                    onHover={showAnswerStatusBadgesHoverDetail} />
                }
              />
            </Grid.Column>
            <Grid.Column className='two wide'>
              <Checkbox toggle className='float-right'
                name='showAnswerStatusBadgesToggle'
                onChange={showAnswerStatusBadgesToggleChanged}
                checked={settings.display.showAnswerStatusBadges} />
            </Grid.Column>
          </Grid.Row>
          {
            todayGameIndex() > Math.max(...NIGHT_GAMES) &&
            <Grid.Row>
              <Grid.Column className='fourteen wide'>
                Dark mode
              </Grid.Column>
              <Grid.Column className='two wide'>
                <Checkbox toggle className='float-right'
                  name='darkModeToggle'
                  onChange={darkModeToggleChanged}
                  checked={settings.display.darkMode} />
              </Grid.Column>
            </Grid.Row>
          }
        </Grid>
      </Modal.Content>
    </Modal>
  );
}

const showAnswerStatusBadgesHoverDetail = () => {

}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default SettingsModal;
