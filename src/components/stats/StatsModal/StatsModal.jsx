import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import Stats from '../Stats/Stats';
import { useDarkMode } from '../../../contexts';
import { useStats } from '../../../contexts/StatsContext';

import './StatsModal.scss';

const StatsModal = (props) => {
  const { open, handleClose } = props;
  const { stats } = useStats();
  const isDarkMode = useDarkMode();
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
};

export default StatsModal;
