import { useState, useCallback, useRef } from 'react';

/**
 * Wraps an onClose callback with an exit animation delay.
 * Use `closing` to apply the exit animation class, and `handleClose`
 * everywhere you would have called `onClose` directly.
 */
export function useAnimatedClose(onClose: () => void, duration = 220) {
  const [closing, setClosing] = useState(false);
  const firedRef = useRef(false);

  const handleClose = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setClosing(true);
    setTimeout(onClose, duration);
  }, [onClose, duration]);

  return { closing, handleClose };
}
