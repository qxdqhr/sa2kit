import React from 'react';
import { clsx } from 'clsx';

/**
 * 应援按钮组件
 */
export interface CheerButtonProps {
  /** 点击回调 */
  onClick: () => void;
  /** 按钮文字 */
  text?: string;
  /** 是否显示 */
  show: boolean;
  /** 样式类名 */
  className?: string;
}

export const CheerButton: React.FC<CheerButtonProps> = ({
  onClick,
  text = '应援',
  show,
  className = '',
}) => {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'fixed bottom-32 right-8 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 active:scale-95 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2',
        className
      )}
      style={{
        animation: 'cheer-pulse 2s ease-in-out infinite',
        zIndex: 1000000, // 高于对话框的 z-index (999999)
      }}
    >
      <span className="text-2xl">🎉</span>
      <span>{text}</span>
      <style>{`
        @keyframes cheer-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 20px 10px rgba(236, 72, 153, 0);
          }
        }
      `}</style>
    </button>
  );
};

export default CheerButton;

