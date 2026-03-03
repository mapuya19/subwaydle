import { useEffect, useState, useRef } from 'react';
import { Transition } from 'semantic-ui-react';
import './Toast.scss';

interface ToastProps {
  message: string;
  show: boolean;
  index?: number;
  onComplete?: () => void;
}

const Toast = ({ message, show, index = 0, onComplete }: ToastProps): React.ReactElement => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const hasBeenVisibleRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  // Lock index when we start fading out to prevent position shifts
  const lockedIndexRef = useRef<number | null>(null);
  const isLockedRef = useRef<boolean>(false);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (show) {
      // Show immediately without fade-in animation (like NYT Wordle)
      setIsVisible(true);
      hasBeenVisibleRef.current = true;
      // Unlock position when visible to allow position updates when new toasts are added
      isLockedRef.current = false;
      lockedIndexRef.current = null; // Clear lock so we use current index
    } else {
      // Hide toast - Transition will handle fade out animation
      // Lock position when starting to fade out
      if (hasBeenVisibleRef.current && lockedIndexRef.current === null) {
        isLockedRef.current = true;
        lockedIndexRef.current = index; // Lock at current position
      }
      setIsVisible(false);
    }
  }, [show, index]);

  // Use locked index if fading out, otherwise use current index
  const positionIndex = isLockedRef.current && lockedIndexRef.current !== null
    ? lockedIndexRef.current
    : index;
  const topOffset = 60 + positionIndex * 50;

  const handleComplete = () => {
    // Only call onComplete when we've been visible and are now hiding
    // This ensures we only remove after a fade-out, not after initial mount
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
