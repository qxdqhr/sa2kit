import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface LoadingScreenProps {
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 加载文本 */
  loadingText?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * LoadingScreen - 加载界面组件
 * 
 * 用于 MMD Visual Novel 的加载状态显示
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading = true,
  loadingText = '正在准备场景中...',
  className = '',
}) => {
  // 使用 state 确保 SSR 和客户端初始渲染一致
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 调试日志
  console.log('[LoadingScreen] Render state:', {
    isLoading,
    isMounted,
  });

  // 只在客户端挂载后才渲染
  if (!isMounted) {
    return null;
  }

  // 如果不显示，返回 null
  if (!isLoading) {
    console.log('[LoadingScreen] Not showing, returning null');
    return null;
  }

  const content = (
    <div
      className={`fixed inset-0 w-screen h-screen flex items-center justify-center ${className}`}
      style={{
        zIndex: 999998,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        margin: 0,
        padding: 0,
      }}
    >
      {/* 白色毛玻璃层 */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        }}
      >
        {/* 背景装饰层 - 柔和的彩虹渐变 */}
        <div
          className="flex items-center justify-center flex-col inset-0 w-full h-full pointer-events-none"
          style={{
            background: `linear-gradient(45deg, 
            rgba(255, 182, 193, 0.2) 0%, 
            rgba(173, 216, 230, 0.2) 25%,
            rgba(221, 160, 221, 0.2) 50%,
            rgba(255, 218, 185, 0.2) 75%,
            rgba(255, 182, 193, 0.2) 100%)`,
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
          }}
        >
          <div
            className="text-lg font-medium text-white text-center px-6 py-3 rounded-2xl">
            {loadingText}
          </div>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body
  let portalContainer = document.getElementById('loading-screen-portal-root');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'loading-screen-portal-root';
    document.body.appendChild(portalContainer);
  }

  // 更新容器样式
  portalContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    z-index: 999998;
    pointer-events: none;
  `.replace(/\s+/g, ' ').trim();

  return createPortal(content, portalContainer);
};

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;




