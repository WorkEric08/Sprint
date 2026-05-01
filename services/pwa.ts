type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable' | 'already-installed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
}

type Listener = (state: PWAState) => void;

const INSTALLED_KEY = 'sprint_app_installed';

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installed = false;
  private listeners = new Set<Listener>();
  private bootstrapped = false;

  bootstrap() {
    if (this.bootstrapped) return;
    this.bootstrapped = true;

    this.installed = this.detectInstalled();

    const preCaptured = (window as any).__pwaDeferredPrompt as BeforeInstallPromptEvent | null;
    if (preCaptured) {
      this.deferredPrompt = preCaptured;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.emit();
    });

    window.addEventListener('appinstalled', () => {
      this.markInstalled();
    });

    window.addEventListener('__pwa-prompt-captured', () => {
      const evt = (window as any).__pwaDeferredPrompt as BeforeInstallPromptEvent | null;
      if (evt && evt !== this.deferredPrompt) {
        this.deferredPrompt = evt;
        this.emit();
      }
    });
  }

  private detectInstalled(): boolean {
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if ((window.navigator as any).standalone === true) return true;
      if (localStorage.getItem(INSTALLED_KEY) === 'true') return true;
    } catch {}
    return false;
  }

  private markInstalled() {
    this.installed = true;
    this.deferredPrompt = null;
    (window as any).__pwaDeferredPrompt = null;
    try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
    this.emit();
  }

  getState(): PWAState {
    return {
      canInstall: !!this.deferredPrompt && !this.installed,
      isInstalled: this.installed,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => { this.listeners.delete(listener); };
  }

  private emit() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  // Deve ser chamado SINCRONAMENTE no handler de click do usuario.
  // O navegador exige user gesture preservado para mostrar o prompt nativo.
  install(): Promise<InstallOutcome> {
    if (this.installed) return Promise.resolve('already-installed');
    const prompt = this.deferredPrompt;
    if (!prompt) return Promise.resolve('unavailable');

    try {
      prompt.prompt();
    } catch (err) {
      console.error('[PWA] prompt() falhou:', err);
      return Promise.resolve('unavailable');
    }

    return prompt.userChoice
      .then(({ outcome }) => {
        if (outcome === 'accepted') {
          this.markInstalled();
        } else {
          this.deferredPrompt = null;
          (window as any).__pwaDeferredPrompt = null;
          this.emit();
        }
        return outcome as InstallOutcome;
      })
      .catch((err) => {
        console.error('[PWA] userChoice falhou:', err);
        return 'unavailable' as InstallOutcome;
      });
  }

  async forceUpdate(): Promise<void> {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.update()));
    }
  }

  registerServiceWorker(path = '/sw.js') {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(path).catch((err) => {
        console.warn('[PWA] Falha ao registrar SW:', err);
      });
    });
  }
}

export const pwa = new PWAService();
