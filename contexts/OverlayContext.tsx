import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

interface OverlayContextValue {
  count: number;
  register: () => void;
  unregister: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Provider que contabiliza quantas telas secundárias (overlays full-screen)
 * estão abertas. Deve envolver toda a árvore da aplicação — inclusive a
 * bottom nav e os pontos onde as telas secundárias são renderizadas.
 */
export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);
  const register = useCallback(() => setCount(c => c + 1), []);
  const unregister = useCallback(() => setCount(c => Math.max(0, c - 1)), []);
  const value = useMemo(() => ({ count, register, unregister }), [count, register, unregister]);
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
};

/** True enquanto houver ao menos uma tela secundária aberta (oculta a bottom nav). */
export function useHasSecondaryScreen(): boolean {
  const ctx = useContext(OverlayContext);
  return ctx ? ctx.count > 0 : false;
}

/**
 * Registra o componente como uma tela secundária aberta enquanto montado.
 * Enquanto qualquer tela com este hook estiver montada, a bottom nav some.
 * Funciona mesmo através de React Portals (o contexto atravessa o portal).
 */
export function useSecondaryScreen(): void {
  const ctx = useContext(OverlayContext);
  const register = ctx?.register;
  const unregister = ctx?.unregister;
  useEffect(() => {
    register?.();
    return () => unregister?.();
  }, [register, unregister]);
}
