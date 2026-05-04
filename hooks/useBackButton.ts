import { useEffect, useRef } from 'react';

interface Entry {
  handler: () => void;
  depth: number;
}

const stack: Entry[] = [];
let programmatic = false;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  window.addEventListener('popstate', () => {
    if (programmatic) {
      programmatic = false;
      return;
    }
    const entry = stack[stack.length - 1];
    if (entry) {
      // Browser consumed our entry; adjust depth, call handler, re-push
      entry.depth--;
      entry.handler();
      history.pushState({ __nav: true }, '');
      entry.depth++;
    }
    // If stack is empty, browser navigates normally (exits PWA)
  });
}

/**
 * Intercepts the device/browser back button while `active` is true.
 * Pushes a history entry on activation and cleans it up on deactivation/unmount.
 */
export function useBackButton(onBack: () => void, active = true) {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    init();
    if (!active) return;

    history.pushState({ __nav: true }, '');
    const entry: Entry = { handler: () => ref.current(), depth: 1 };
    stack.push(entry);

    return () => {
      const idx = stack.indexOf(entry);
      if (idx !== -1) stack.splice(idx, 1);
      if (entry.depth > 0) {
        programmatic = true;
        history.go(-entry.depth);
        entry.depth = 0;
      }
    };
  }, [active]);
}
