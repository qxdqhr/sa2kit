import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DialogueHistoryItem, DialogueBoxTheme } from './types';

interface HistoryPanelProps {
  /** 历史记录列表 */
  history: DialogueHistoryItem[];
  /** 主题配置 */
  theme?: DialogueBoxTheme;
  /** 关闭面板 */
  onClose: () => void;
  /** 样式 */
  className?: string;
}

/**
 * HistoryPanel - 对话历史记录面板
 * 
 * 显示玩家已经阅读过的所有对话
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  theme,
  onClose,
  className,
}) => {
  // 避免 SSR hydration 错误
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 历史面板内容
  const historyContent = (
    <div
      className={`fixed inset-0 flex flex-col ${className}`}
      style={{
        zIndex: 1,
        pointerEvents: 'auto',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
      }}
      onClick={onClose}
    >
      {/* 背景装饰层 - 柔和的彩虹渐变 */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background: `linear-gradient(45deg, 
            rgba(255, 182, 193, 0.15) 0%, 
            rgba(173, 216, 230, 0.15) 25%,
            rgba(221, 160, 221, 0.15) 50%,
            rgba(255, 218, 185, 0.15) 75%,
            rgba(255, 182, 193, 0.15) 100%)`,
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
        }}
      />

      {/* 毛玻璃效果 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        }}
      />

      {/* 内容容器 */}
      <div className="relative z-10 flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div 
          className="flex items-center justify-between px-8 py-6 border-b relative"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.25)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.15))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 24px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <span style={{ textShadow: '0 2px 12px rgba(255, 255, 255, 0.3)' }}>对话历史</span>
          </h2>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/20 rounded-2xl transition-all text-white hover:text-white hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.15))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 历史记录列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-white/70 py-20 text-lg font-medium" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
              暂无对话历史
            </div>
          ) : (
            history.map((item, index) => (
              <div
                key={`${item.nodeIndex}-${item.dialogueIndex}-${index}`}
                className="p-6 rounded-2xl transition-all hover:scale-[1.01] relative overflow-hidden cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 24px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                }}
              >
                {/* 装饰光效 */}
                <div 
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
                  }}
                />
                
                {/* 说话者 */}
                {item.speaker && (
                  <div
                    className="inline-block px-5 py-2 rounded-xl mb-3 text-sm font-bold shadow-lg relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2))',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    {/* 装饰光效 */}
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.4) 50%, transparent 70%)',
                        backgroundSize: '200% 200%',
                        animation: 'shimmer 3s infinite',
                      }}
                    />
                    <span className="relative z-10 drop-shadow-lg">{item.speaker}</span>
                  </div>
                )}
                
                {/* 对话内容 */}
                <p
                  className="text-base leading-relaxed"
                  style={{ 
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div 
          className="px-8 py-4 border-t text-center"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <span 
            className="text-sm px-5 py-2.5 rounded-full inline-block font-medium"
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.15))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            点击背景关闭
          </span>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 将历史面板渲染到 body，确保显示在最上层
  // 仅在客户端挂载后使用 Portal，避免 SSR hydration 错误
  if (!isMounted) {
    return null;
  }

  // 确保有一个专门的容器用于 Portal 内容
  let portalContainer = document.getElementById('history-portal-root');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'history-portal-root';
    portalContainer.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 999999;';
    document.body.appendChild(portalContainer);
  }
  return createPortal(historyContent, portalContainer);
};

export default HistoryPanel;






