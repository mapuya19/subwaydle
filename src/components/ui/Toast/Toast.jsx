import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Transition } from 'semantic-ui-react';
import './Toast.scss';

const Toast = ({ message, show, index = 0, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const hasBeenVisibleRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  // Lock the index when we start fading out to prevent position shifts
  const lockedIndexRef = useRef(null);
  const isLockedRef = useRef(false);

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
      // Hide the toast - Transition will handle the fade out animation
      // Lock the position when starting to fade out
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
  const topOffset = 60 + (positionIndex * 50);

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

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  index: PropTypes.number,
  onComplete: PropTypes.func,
};

export default Toast;

