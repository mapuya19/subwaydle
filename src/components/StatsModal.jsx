import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import Stats from './Stats';

import './StatsModal.scss';

const StatsModal = (props) => {
  const { open, handleClose, isDarkMode, stats } = props;
  return (
    <Modal closeIcon open={open} onClose={handleClose} size='tiny' className={isDarkMode ? 'stats-modal dark' : 'stats-modal'}>
      <Modal.Content>
        <Stats stats={stats} isDarkMode={isDarkMode} />
      </Modal.Content>
    </Modal>
  );
}

StatsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  stats: PropTypes.object.isRequired,
};

export default StatsModal;
