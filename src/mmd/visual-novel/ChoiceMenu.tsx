import React from 'react';
import { createPortal } from 'react-dom';
import { DialogueChoice, DialogueBoxTheme } from './types';

export interface ChoiceMenuProps {
  choices: DialogueChoice[];
  onSelect: (choice: DialogueChoice) => void;
  theme?: DialogueBoxTheme;
}

export const ChoiceMenu: React.FC<ChoiceMenuProps> = ({
  choices,
  onSelect,
  theme,
}) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const content = (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto transition-all animate-in fade-in duration-500"
      style={{ zIndex: 1000000 }}
    >
      <div className="flex flex-col gap-4 w-full max-w-md px-6">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => onSelect(choice)}
            className="w-full py-4 px-8 rounded-2xl text-white font-bold text-lg transition-all border border-white/20 shadow-xl hover:scale-105 active:scale-95 group relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.2) 0%, 
                rgba(255, 255, 255, 0.1) 100%)`,
              backdropFilter: 'blur(32px) saturate(200%)',
              WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            }}
          >
            {/* 悬停光效 */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            
            <span className="relative z-10 drop-shadow-md">{choice.text}</span>
          </button>
        ))}
      </div>
    </div>
  );

  let portalContainer = document.getElementById('dialogue-portal-root');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'dialogue-portal-root';
    portalContainer.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 999999;';
    document.body.appendChild(portalContainer);
  }

  return createPortal(content, portalContainer);
};

export default ChoiceMenu;

