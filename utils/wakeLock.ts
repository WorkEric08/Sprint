/**
 * Wake Lock API wrapper.
 *
 * Impede que a tela apague durante sessões longas (simulados de 5h+).
 * Re-adquire automaticamente após o usuário retornar ao app.
 *
 * Suporte: Chrome 84+, Edge 84+, Safari 16.4+. Firefox: não suportado.
 * Fallback silencioso em navegadores sem suporte.
 *
 * USO NO COMPONENTE:
 *   useEffect(() => {
 *     const wl = new WakeLockManager();
 *     wl.request();
 *     return () => { wl.release(); wl.destroy(); };
 *   }, []);
 */
export class WakeLockManager {
  private sentinel: WakeLockSentinel | null = null;
  private destroyed = false;

  async request(): Promise<void> {
    if (this.destroyed) return;
    if (!('wakeLock' in navigator)) return;
    try {
      this.sentinel = await (navigator as any).wakeLock.request('screen');
      this.sentinel?.addEventListener('release', () => {
        // Re-request if page becomes visible again and we haven't released intentionally
        if (!this.destroyed) {
          document.addEventListener('visibilitychange', this.onVisibilityChange, { once: true });
        }
      });
    } catch (e) {
      // AbortError = tab not focused; NotAllowedError = permission denied
      // Both are acceptable — just warn, don't break the simulado
      console.warn('Wake Lock request failed:', e);
    }
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !this.destroyed) {
      this.request();
    }
  };

  async release(): Promise<void> {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.sentinel && !this.sentinel.released) {
      try { await this.sentinel.release(); } catch {}
    }
    this.sentinel = null;
  }

  destroy(): void {
    this.destroyed = true;
    this.release();
  }

  get isActive(): boolean {
    return !!this.sentinel && !this.sentinel.released;
  }
}
