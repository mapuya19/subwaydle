import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Header, Button, Icon } from 'semantic-ui-react';

import Stats from '../../stats/Stats/Stats';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';
import MapFrame from '../../ui/MapFrame/MapFrame';
import Countdown from '../../ui/Countdown/Countdown';

import { todaysTrip, todaysSolution, isAccessible } from '../../../utils/answerValidations';
import { shareStatus } from '../../../utils/share';
import { useDarkMode } from '../../../contexts';
import { useStats } from '../../../contexts/StatsContext';

import stations from "../../../data/stations.json";
import { ALERT_TIME_MS } from '../../../utils/constants';
import './SolutionModal.scss';

const SolutionModal = (props) => {
  const { open, handleModalClose, isGameWon, guesses, practiceMode = null, practiceGameIndex = null } = props;
  const { stats } = useStats();
  const isDarkMode = useDarkMode(practiceMode);
  const [isShareButtonShowCopied, setIsShareButtonShowCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalHidden, setIsModalHidden] = useState(false);
  const modal = useRef(null);
  const trip = todaysTrip(practiceMode, practiceGameIndex);
  const solution = todaysSolution(practiceMode, practiceGameIndex);
  const title = isGameWon ? "Yay! You completed today's trip!" : "Aww, looks like you got lost on the subway...";
  const isIos = /iP(ad|od|hone)/i.test(window.navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));

  const handleShareClick = () => {
    shareStatus(guesses, !isGameWon, practiceMode, practiceGameIndex);
    if (!navigator.share || !isIos) {
      setIsShareButtonShowCopied(true);
      setTimeout(() => {
        setIsShareButtonShowCopied(false)
      }, ALERT_TIME_MS);
    }
  }

  const handleClose = () => {
    setIsModalHidden(true);
    handleModalClose();
  }

  useEffect(() => {
    if (isModalHidden) {
      modal.current.ref.current.parentElement.setAttribute("style", "display: none !important");
      modal.current.ref.current.parentElement.parentElement.classList.remove("dimmable");
      modal.current.ref.current.parentElement.parentElement.classList.remove("dimmed");
    } else {
      if (modal.current.ref.current) {
        modal.current.ref.current.parentElement.setAttribute("style", "display: flex !important");
        modal.current.ref.current.parentElement.parentElement.classList.add("dimmable");
        modal.current.ref.current.parentElement.parentElement.classList.add("dimmed");
      }
    }
  }, [isModalHidden]);

  useEffect(() => {
    if (open) {
      setIsModalHidden(false);
      setIsModalOpen(true);
    }
  }, [open]);

  return (
    <Modal closeIcon open={isModalOpen} onClose={handleClose} ref={modal} size='small' className={isDarkMode ? 'solution-modal dark' : 'solution-modal'}>
      <Modal.Header>{ title }</Modal.Header>
      <Modal.Content>
        <Modal.Description>
        { open && <MapFrame practiceMode={practiceMode} practiceGameIndex={practiceGameIndex} /> }
          <Header as='h3'>Today's Journey</Header>
          { !isAccessible(practiceMode) &&
            <>
              <TrainBullet id={trip[0]} size='small' /> from { stations[solution.origin].name } to { stations[solution.first_transfer_arrival].name }<br />
              <TrainBullet id={trip[1]} size='small' /> from { stations[solution.first_transfer_departure].name } to { stations[solution.second_transfer_arrival].name }<br />
              <TrainBullet id={trip[2]} size='small' /> from { stations[solution.second_transfer_departure].name } to { stations[solution.destination].name }
            </>
          }
          { isAccessible(practiceMode) &&
            <>
              <TrainBullet id={trip[0]} size='small' /> from { stations[solution.origin].name } ♿️ to { stations[solution.first_transfer_arrival].name } ♿️<br />
              <TrainBullet id={trip[1]} size='small' /> from { stations[solution.first_transfer_departure].name } ♿️ to { stations[solution.second_transfer_arrival].name } ♿️<br />
              <TrainBullet id={trip[2]} size='small' /> from { stations[solution.second_transfer_departure].name } ♿️ to { stations[solution.destination].name } ♿️
            </>
          }
          { !practiceMode && <Stats isDarkMode={isDarkMode} stats={stats} /> }
          { !practiceMode && <Countdown /> }
          <div className={`share-btn-wrapper ${practiceMode ? 'practice-mode' : ''}`}>
            <Button positive icon labelPosition='right' onClick={handleShareClick} className='share-btn'>
              { isShareButtonShowCopied ? 'Copied' : 'Share' }
              <Icon name={isShareButtonShowCopied ? 'check' : 'share alternate'} />
            </Button>
          </div>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  );
}

SolutionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleModalClose: PropTypes.func.isRequired,
  isGameWon: PropTypes.bool.isRequired,
  guesses: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  practiceMode: PropTypes.string,
  practiceGameIndex: PropTypes.number,
};

export default SolutionModal;
