import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface GuardConfig {
  /** Required title for the confirmation modal */
  title: string;
  /** Required short message explaining why navigation is blocked */
  message: string;
  /** Label for the "leave" action button (default: "Sair") */
  confirmLabel?: string;
  /** Label for the "stay" action button (default: "Continuar") */
  cancelLabel?: string;
}

interface ContextValue {
  /** Register/replace the active guard. Pass null to clear. */
  setGuard: (config: GuardConfig | null) => void;
  /** Run the given action — if a guard is active, show the confirmation modal first. */
  requestNavigation: (action: () => void) => void;
}

const NavigationGuardContext = createContext<ContextValue | null>(null);

export const useNavigationGuard = (): ContextValue => {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
  return ctx;
};

/**
 * Convenience hook for session views — registers a guard while `active` is true,
 * clears it on unmount or when `active` becomes false.
 */
export const useRegisterNavigationGuard = (active: boolean, config: GuardConfig) => {
  const { setGuard } = useNavigationGuard();
  // keep latest config in a ref so changes don't re-trigger the effect
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!active) return;
    setGuard(configRef.current);
    return () => setGuard(null);
  }, [active, setGuard]);
};

export const NavigationGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guard, setGuardState] = useState<GuardConfig | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const setGuard = useCallback((config: GuardConfig | null) => {
    setGuardState(config);
  }, []);

  const requestNavigation = useCallback((action: () => void) => {
    if (guard) {
      // Wrap action so React doesn't try to call it as an updater
      setPendingAction(() => action);
    } else {
      action();
    }
  }, [guard]);

  const handleConfirm = () => {
    const action = pendingAction;
    setPendingAction(null);
    setGuardState(null);
    action?.();
  };

  const handleCancel = () => setPendingAction(null);

  return (
    <NavigationGuardContext.Provider value={{ setGuard, requestNavigation }}>
      {children}
      {pendingAction && guard && createPortal(
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-7 w-full max-w-sm border border-gray-100 dark:border-gray-800 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-stopwatch text-2xl text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-800 dark:text-white uppercase tracking-tight">
                {guard.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                {guard.message}
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleCancel}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all"
              >
                {guard.cancelLabel ?? 'Continuar'}
              </button>
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-red-500 dark:text-red-400 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all"
              >
                {guard.confirmLabel ?? 'Sair mesmo assim'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </NavigationGuardContext.Provider>
  );
};
