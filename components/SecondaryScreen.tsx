import React from 'react';
import { createPortal } from 'react-dom';
import { useSecondaryScreen } from '../contexts/OverlayContext';

interface Props {
  children: React.ReactNode;
  /** Classes do container full-screen (cor de fundo, layout interno). */
  className?: string;
  /** z-index do overlay. Default 60 (acima da bottom nav, que é z-40). */
  zIndex?: number;
}

/**
 * Container padrão para qualquer tela secundária (abre ao clicar em um botão).
 *
 * Garante automaticamente:
 *  - render via portal no <body> (escapa do scroll-container, evita o bug do
 *    iOS em que `position: fixed` fica preso a um ancestral com overflow);
 *  - `fixed inset-0` cobrindo 100% do viewport, acima da bottom nav;
 *  - ocultação da bottom nav enquanto a tela estiver aberta;
 *  - transição suave de entrada (fade + slide-up).
 *
 * Use `<SecondaryScreen className="bg-gray-50 dark:bg-gray-950"> ... </SecondaryScreen>`
 * e estruture o conteúdo como header `shrink-0` + corpo `flex-1 overflow-y-auto`.
 */
const SecondaryScreen: React.FC<Props> = ({ children, className = '', zIndex = 60 }) => {
  useSecondaryScreen();

  return createPortal(
    <div
      className={`fixed inset-0 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}
      style={{ zIndex }}
    >
      {children}
    </div>,
    document.body,
  );
};

export default SecondaryScreen;
