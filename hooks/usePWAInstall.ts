import { useCallback, useEffect, useState } from 'react';
import { pwa, PWAState } from '../services/pwa';

interface UsePWAInstall extends PWAState {
  isInstalling: boolean;
  install: () => void;
}

export function usePWAInstall(): UsePWAInstall {
  const [state, setState] = useState<PWAState>(() => pwa.getState());
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => pwa.subscribe(setState), []);

  // IMPORTANTE: nao usar async aqui. prompt() precisa rodar
  // sincrono no mesmo tick do click para preservar o user gesture.
  const install = useCallback(() => {
    if (!state.canInstall || isInstalling) return;
    setIsInstalling(true);
    pwa.install().finally(() => setIsInstalling(false));
  }, [state.canInstall, isInstalling]);

  return { ...state, isInstalling, install };
}
