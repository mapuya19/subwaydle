import { useEffect, useState, useRef } from 'react';
import { Transition } from 'semantic-ui-react';
import './Toast.scss';

interface ToastProps {
  message: string;
  show: boolean;
  index?: number;
  onComplete?: () => void;
}

const Toast = ({ message, show, index = 0, onComplete }: ToastProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const hasBeenVisibleRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      hasBeenVisibleRef.current = true;
      setLockedIndex(null);
    } else {
      if (hasBeenVisibleRef.current && lockedIndex === null) {
        setLockedIndex(index);
      }
      setIsVisible(false);
    }
  }, [show, index, lockedIndex]);

  const positionIndex = lockedIndex !== null ? lockedIndex : index;
  const topOffset = 60 + (positionIndex * 50);

  const handleComplete = () => {
    if (hasBeenVisibleRef.current && !isVisible && onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

  return (
    <Transition
      visible={isVisible}
      animation="fade"
      duration={{ hide: 500, show: 0 }}
      unmountOnHide={false}
      onComplete={handleComplete}
    >
      <div 
        className="toast"
        style={{ top: `${topOffset}px` }}
      >
        {message}
      </div>
    </Transition>
  );
};

export default Toast;
