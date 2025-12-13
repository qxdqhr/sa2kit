import React from 'react';
import { LoadingScreen } from './LoadingScreen';
import { StartScreen } from './StartScreen';

// 注入全局样式（如果还没有）
if (typeof document !== 'undefined' && !document.getElementById('loading-overlay-animations')) {
  const style = document.createElement('style');
  style.id = 'loading-overlay-animations';
  style.textContent = `
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);
}

export interface LoadingOverlayProps {
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 是否显示开始界面 */
  showStartScreen?: boolean;
  /** 脚本名称（用于开始界面） */
  scriptName?: string;
  /** 加载文本 */
  loadingText?: string;
  /** 开始按钮文本 */
  startText?: string;
  /** 点击开始回调 */
  onStart?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * LoadingOverlay - 加载遮罩和开始界面组件容器
 * 
 * 用于 MMD Visual Novel 的加载状态和开始界面显示
 * 组合了 LoadingScreen 和 StartScreen 两个独立组件
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = true,
  showStartScreen = false,
  scriptName = '',
  loadingText = '正在准备场景中...',
  startText = '点击开始',
  onStart,
  className = '',
}) => {
  return (
    <>
      <LoadingScreen
        isLoading={isLoading}
        loadingText={loadingText}
        className={className}
      />
      <StartScreen
        showStartScreen={showStartScreen}
        scriptName={scriptName}
        startText={startText}
        onStart={onStart}
        className={className}
      />
    </>
  );
};

LoadingOverlay.displayName = 'LoadingOverlay';

export default LoadingOverlay;

