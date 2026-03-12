import { Modal } from 'semantic-ui-react';
import Stats from '../Stats/Stats';
import { useDarkMode } from '../../../contexts';
import { useStats } from '../../../contexts/StatsContext';

import './StatsModal.scss';

interface StatsModalProps {
  open: boolean;
  handleClose: () => void;
}

const StatsModal = ({ open, handleClose }: StatsModalProps) => {
  const { stats } = useStats();
  const isDarkMode = useDarkMode();
  return (
    <Modal closeIcon open={open} onClose={handleClose} size='tiny' className={isDarkMode ? 'stats-modal dark' : 'stats-modal'}>
      <Modal.Content>
        <Stats stats={stats} isDarkMode={isDarkMode} />
      </Modal.Content>
    </Modal>
  );
};

export default StatsModal;
