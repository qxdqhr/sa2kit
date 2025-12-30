import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DialogueBoxProps, DialogueBoxTheme } from './types';

// 注入全局样式
if (typeof document !== 'undefined' && !document.getElementById('dialogue-box-animations')) {
  const style = document.createElement('style');
  style.id = 'dialogue-box-animations';
  style.textContent = `
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    @keyframes cursorBlink {
      0%, 100% { opacity: 1; transform: scaleY(1); }
      50% { opacity: 0.3; transform: scaleY(0.8); }
    }
    
    @keyframes textFadeIn {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
  `;
  document.head.appendChild(style);
}

/** 默认主题配置 - 灰白色主色调 + 亮绿色文字 */
const defaultTheme: DialogueBoxTheme = {
  backgroundColor: 'rgba(248, 250, 252, 0.95)',
  borderColor: 'rgba(203, 213, 225, 0.8)',
  textColor: '#22c55e',
  speakerBgColor: 'rgba(148, 163, 184, 0.9)',
  speakerTextColor: '#22c55e',
  opacity: 1.0,
  blur: '16px',
  continueHint: '点击继续 ▼',
  showContinueHint: true,
};

/**
 * DialogueBox - Galgame 风格对话框组件
 * 
 * 功能：
 * - 打字机效果显示文本
 * - 说话者名称栏
 * - 点击继续提示
 * - 控制按钮（自动、快进、历史）
 */
export const DialogueBox: React.FC<DialogueBoxProps> = ({
  dialogue,
  theme: userTheme,
  isTyping = false,
  isAutoMode = false,
  onClick,
  onSkipTyping,
  onToggleAuto,
  onOpenHistory,
  onSkip,
  onResetCamera,
  isCameraManual = false,
  showControls = true,
  showSkipButton = true,
  showAutoButton = true,
  showHistoryButton = true,
  className,
}) => {
  const theme = { ...defaultTheme, ...userTheme };
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef<string>('');

  // 避免 SSR hydration 错误
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 打字机效果
  useEffect(() => {
    if (!dialogue) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    const text = dialogue.text;
    const speed = dialogue.typeSpeed ?? 50;

    // 清除之前的定时器
    if (typingRef.current) {
      clearTimeout(typingRef.current);
    }

    // 重置状态
    setDisplayedText('');
    setIsComplete(false);
    currentTextRef.current = text;

    let index = 0;

    const typeNext = () => {
      if (index < text.length && currentTextRef.current === text) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        typingRef.current = setTimeout(typeNext, speed);
      } else if (currentTextRef.current === text) {
        setIsComplete(true);
      }
    };

    // 开始打字
    typingRef.current = setTimeout(typeNext, speed);

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [dialogue]);

  // 跳过打字动画
  const handleSkipTyping = useCallback(() => {
    if (typingRef.current) {
      clearTimeout(typingRef.current);
    }
    if (dialogue) {
      setDisplayedText(dialogue.text);
      setIsComplete(true);
    }
    onSkipTyping?.();
  }, [dialogue, onSkipTyping]);

  // 处理点击
  const handleClick = useCallback(() => {
    if (!isComplete) {
      handleSkipTyping();
    } else {
      onClick?.();
    }
  }, [isComplete, handleSkipTyping, onClick]);

  if (!dialogue) {
    return null;
  }

  const speakerColor = dialogue.speakerColor || theme.speakerBgColor;

  console.log('[DialogueBox] Rendering:', { 
    speaker: dialogue.speaker, 
    text: dialogue.text,
    displayedText,
    isComplete 
  });

  console.log('[DialogueBox] Theme colors:', {
    textColor: theme.textColor,
    backgroundColor: theme.backgroundColor,
    speakerBgColor: theme.speakerBgColor,
    speakerTextColor: theme.speakerTextColor,
    fullTheme: theme
  });

  const dialogueContent = (
    <div
      className={`${className || ''}`}
      style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30vh',
        minHeight: '200px',
        maxHeight: '30vh',
        zIndex: 1,
        pointerEvents: 'auto',
      }}
    >
      {/* 对话框主体 - 占满容器宽度和高度 */}
      <div
        className="w-full h-full rounded-t-3xl border cursor-pointer select-none transition-all hover:border-white/50 hover:shadow-2xl flex flex-col relative overflow-hidden"
        onClick={handleClick}
        style={{
          borderColor: theme.borderColor,
          backdropFilter: `blur(${theme.blur}) saturate(200%)`,
          WebkitBackdropFilter: `blur(${theme.blur}) saturate(200%)`,
          opacity: theme.opacity,
          pointerEvents: 'auto',
          position: 'relative',
          display: 'flex',
          background: `linear-gradient(135deg, 
            rgba(248, 250, 252, 0.98) 0%, 
            rgba(241, 245, 249, 0.95) 50%, 
            rgba(226, 232, 240, 0.92) 100%)`,
          boxShadow: `
            0 -8px 40px rgba(148, 163, 184, 0.2),
            0 -4px 16px rgba(100, 116, 139, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1px 0 rgba(203, 213, 225, 0.5)
          `,
        }}
      >
        {/* 装饰性渐变层 - 柔和的灰色渐变 */}
        <div 
          className="absolute inset-0 opacity-8 pointer-events-none"
          style={{
            background: `linear-gradient(45deg, 
              rgba(226, 232, 240, 0.3) 0%, 
              rgba(203, 213, 225, 0.3) 25%,
              rgba(241, 245, 249, 0.3) 50%,
              rgba(226, 232, 240, 0.3) 75%,
              rgba(203, 213, 225, 0.3) 100%)`,
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
          }}
        />
        
        {/* 顶部高光 - 灰白色光泽 */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          }}
        />
        
        {/* 底部柔和边框 */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(203, 213, 225, 0.6), transparent)',
          }}
        />
        {/* 控制按钮区域 - 放在对话框内部顶部 */}
        {showControls && (
          <div className="flex justify-end gap-3 px-6 pt-4 pb-2 shrink-0 relative z-10">
            {showHistoryButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHistory?.();
                }}
                className="px-4 py-2 text-xs rounded-xl text-slate-700 font-medium hover:text-slate-900 transition-all backdrop-blur-lg border border-slate-300 hover:border-slate-400 hover:scale-105 active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(226, 232, 240, 0.9))',
                  boxShadow: '0 4px 16px rgba(100, 116, 139, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                }}
                title="历史记录"
              >
                📜 历史
              </button>
            )}
            {isCameraManual && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResetCamera?.();
                }}
                className="px-4 py-2 text-xs rounded-xl text-white font-medium hover:text-white transition-all backdrop-blur-lg border border-blue-300 hover:border-blue-400 hover:scale-105 active:scale-95 shadow-lg animate-in zoom-in duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(37, 99, 235, 0.75))',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                }}
                title="恢复初始视角"
              >
                🎥 恢复视角
              </button>
            )}
            {showAutoButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAuto?.();
                }}
                className={`px-4 py-2 text-xs rounded-xl font-medium transition-all backdrop-blur-lg border hover:scale-105 active:scale-95 shadow-lg ${isAutoMode
                    ? 'border-slate-400 text-slate-900'
                    : 'border-slate-300 hover:border-slate-400 text-slate-700'
                  }`}
                style={{
                  background: isAutoMode 
                    ? 'linear-gradient(135deg, rgba(203, 213, 225, 0.95), rgba(148, 163, 184, 0.85))'
                    : 'linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(226, 232, 240, 0.9))',
                  boxShadow: isAutoMode 
                    ? '0 4px 20px rgba(100, 116, 139, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    : '0 4px 16px rgba(100, 116, 139, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                }}
                title="自动播放"
              >
                ▶ 自动
              </button>
            )}
            {showSkipButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip?.();
                }}
                className="px-4 py-2 text-xs rounded-xl text-slate-700 font-medium hover:text-slate-900 transition-all backdrop-blur-lg border border-slate-300 hover:border-slate-400 hover:scale-105 active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(226, 232, 240, 0.9))',
                  boxShadow: '0 4px 16px rgba(100, 116, 139, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                }}
                title="快进"
              >
                ⏩ 快进
              </button>
            )}
          </div>
        )}

        {/* 内容区域 - 使用 flex-1 占据剩余空间，固定对齐到顶部避免跳动 */}
        <div className="px-8 pb-6 pt-4 flex-1 flex flex-col justify-start overflow-y-auto relative z-10">
          {/* 说话者名称 */}
          {dialogue.speaker && (
            <div
              className="inline-block px-6 py-2.5 rounded-2xl mb-4 text-sm font-bold shadow-2xl self-start relative overflow-hidden transition-all hover:scale-105"
              style={{
                color: '#ffffff',
                background: `linear-gradient(135deg, 
                  rgba(100, 116, 139, 0.95) 0%, 
                  rgba(71, 85, 105, 0.9) 100%)`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(100, 116, 139, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(148, 163, 184, 0.5)',
              }}
            >
              {/* 装饰光效 */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
                  backgroundSize: '200% 200%',
                  animation: 'shimmer 3s infinite',
                }}
              />
              <span className="relative z-10 drop-shadow-lg">{dialogue.speaker}</span>
            </div>
          )}

          {/* 对话文本 */}
          <div
            className="text-lg leading-relaxed relative"
            style={{ 
              color: theme.textColor,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            <span className="inline-block" style={{
              animation: !isComplete ? 'textFadeIn 0.3s ease-out' : 'none'
            }}>
              {displayedText}
            </span>
            {/* 打字光标 - 亮绿色主题 */}
            {!isComplete && (
              <span 
                className="inline-block w-1 h-6 ml-1 align-middle"
                style={{
                  background: 'linear-gradient(to bottom, #22c55e, #4ade80)',
                  animation: 'cursorBlink 1s ease-in-out infinite',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                }}
              />
            )}
          </div>

          {/* 点击继续提示 - 使用绝对定位避免影响布局 */}
          <div className="flex justify-end mt-4 h-10 relative">
            {isComplete && theme.showContinueHint && (
              <span 
                className="text-sm px-4 py-2 rounded-full backdrop-blur-lg font-medium absolute right-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(203, 213, 225, 0.9), rgba(226, 232, 240, 0.85))',
                  color: 'rgba(71, 85, 105, 0.9)',
                  animation: 'bounce 2s ease-in-out infinite',
                  boxShadow: '0 4px 16px rgba(100, 116, 139, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                }}
              >
                {theme.continueHint}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 将对话框渲染到 body，避免父容器的 overflow:hidden 影响
  // 仅在客户端挂载后使用 Portal，避免 SSR hydration 错误
  if (!isMounted) {
    return null;
  }

  // 确保有一个专门的容器用于 Portal 内容
  let portalContainer = document.getElementById('dialogue-portal-root');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'dialogue-portal-root';
    portalContainer.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 999999;';
    document.body.appendChild(portalContainer);
  }
  return createPortal(dialogueContent, portalContainer);
};

export default DialogueBox;




