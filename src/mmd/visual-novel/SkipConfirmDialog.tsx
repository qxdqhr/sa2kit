import React from 'react';
import { createPortal } from 'react-dom';

export interface SkipConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const SkipConfirmDialog: React.FC<SkipConfirmDialogProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const content = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto"
      style={{ zIndex: 999999 }}
    >
      <div 
        className="p-8 rounded-3xl border border-white/30 shadow-2xl max-w-sm w-full mx-4 overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, 
            rgba(255, 255, 255, 0.2) 0%, 
            rgba(255, 255, 255, 0.1) 100%)`,
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        }}
      >
        <h3 className="text-xl font-bold text-white mb-4 drop-shadow-md">动画尚未播放完成</h3>
        <p className="text-white/90 mb-8 leading-relaxed drop-shadow-sm">
          当前场景的动画还没有完整播放一遍，是否直接跳转到下一个场景？
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-2xl text-white/80 font-medium hover:text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/30"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all border border-white/40 shadow-lg hover:scale-105 active:scale-95"
          >
            直接跳转
          </button>
        </div>
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

export default SkipConfirmDialog;

