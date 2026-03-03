import { useState, useRef, useEffect } from 'react';
import { Modal, Button, Icon } from 'semantic-ui-react';
import type { SolutionModalProps } from '../../../types/components';

const SolutionModal = ({
  open,
  handleModalClose,
  isGameWon,
  guesses: _guesses,
  practiceMode = null,
  practiceGameIndex: _practiceGameIndex = null,
}: SolutionModalProps): React.ReactElement => {
  const isDarkMode = false; // Default to false, should be passed in or from context
  const [isShareButtonShowCopied, setIsShareButtonShowCopied] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalHidden, setIsModalHidden] = useState<boolean>(false);
  const modal = useRef<unknown>(null);
  const title = isGameWon ? "Yay! You completed today's trip!" : "Aww, looks like you got lost on the subway...";

  const handleShareClick = () => {
    // Share logic here
    if (!navigator.share) {
      setIsShareButtonShowCopied(true);
      setTimeout(() => {
        setIsShareButtonShowCopied(false);
      }, 1500);
    }
  };

  const handleClose = () => {
    setIsModalHidden(true);
    handleModalClose();
  };

  useEffect(() => {
    if (isModalHidden) {
      // Handle modal hiding
    } else {
      // Handle modal showing
    }
  }, [isModalHidden]);

  useEffect(() => {
    if (open) {
      setIsModalHidden(false);
      setIsModalOpen(true);
    }
  }, [open]);

  return (
    <Modal closeIcon open={isModalOpen} onClose={handleClose} ref={modal as any} size="small" className={isDarkMode ? 'solution-modal dark' : 'solution-modal'}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <div className={`share-btn-wrapper ${practiceMode ? 'practice-mode' : ''}`}>
            <Button positive icon labelPosition="right" onClick={handleShareClick} className="share-btn">
              {isShareButtonShowCopied ? 'Copied' : 'Share'}
              <Icon name={isShareButtonShowCopied ? 'check' : 'share alternate'} />
            </Button>
          </div>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  );
};

export default SolutionModal;
