import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface StartScreenProps {
  /** 是否显示开始界面 */
  showStartScreen?: boolean;
  /** 脚本名称 */
  scriptName?: string;
  /** 开始按钮文本 */
  startText?: string;
  /** 点击开始回调 */
  onStart?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * StartScreen - 开始界面组件
 * 
 * 用于 MMD Visual Novel 的开始界面显示
 */
export const StartScreen: React.FC<StartScreenProps> = ({
  showStartScreen = false,
  scriptName = '',
  startText = '点击开始',
  onStart,
  className = '',
}) => {
  // 使用 state 确保 SSR 和客户端初始渲染一致
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 调试日志
  console.log('[StartScreen] Render state:', {
    showStartScreen,
    scriptName,
    isMounted,
  });

  // 只在客户端挂载后才渲染
  if (!isMounted) {
    return null;
  }

  // 如果不显示，返回 null
  if (!showStartScreen) {
    console.log('[StartScreen] Not showing, returning null');
    return null;
  }

  const content = (
    <div
      className={`fixed inset-0 w-screen h-screen flex items-center justify-center cursor-pointer ${className}`}
      style={{
        zIndex: 999999,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        margin: 0,
        padding: 0,
      }}
      onClick={onStart}
    >
      {/* 白色毛玻璃层 */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.15))',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        }}

      >
        {/* 背景装饰层 - 柔和的彩虹渐变 */}
        <div
          className="flex items-center justify-center flex-col inset-0 w-full h-full pointer-events-none"
          style={{
            background: `linear-gradient(45deg, 
            rgba(255, 182, 193, 0.25) 0%, 
            rgba(173, 216, 230, 0.25) 25%,
            rgba(221, 160, 221, 0.25) 50%,
            rgba(255, 218, 185, 0.25) 75%,
            rgba(255, 182, 193, 0.25) 100%)`,
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
          }}
        >
          {/* 内容容器 */}
          <div
            className="relative z-10 text-center px-16 py-14 rounded-3xl max-w-2xl mx-auto transform transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.15))',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
            0 12px 48px rgba(255, 255, 255, 0.15),
            0 4px 16px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.4)
          `,
            }}
          >
            {/* 顶部装饰光效 */}
            <div
              className="absolute top-0 left-0 right-0 h-1 margin-auto"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
              }}
            />

            {/* 标题 */}
            <h1
              className="text-5xl font-bold text-white mb-8 relative"
              style={{
                textShadow: '0 4px 16px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              {scriptName}
              {/* 标题下划线装饰 */}
              <div
                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1 rounded-full"
                style={{
                  width: '60%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
                }}
              />
            </h1>

            {/* 开始按钮 */}
            <div
              className="inline-block px-10 py-4 rounded-2xl font-bold text-xl text-white transition-all hover:scale-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.25))',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: `
              0 8px 32px rgba(255, 255, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.5)
            `,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <span className="relative z-10">{startText}</span>
            </div>

            {/* 底部装饰光效 */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              }}
            />
          </div>
        </div>

      </div>



    </div>
  );

  // 使用 Portal 渲染到 body
  let portalContainer = document.getElementById('start-screen-portal-root');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'start-screen-portal-root';
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
    z-index: 999999;
    pointer-events: none;
  `.replace(/\s+/g, ' ').trim();

  return createPortal(content, portalContainer);
};

StartScreen.displayName = 'StartScreen';

export default StartScreen;




