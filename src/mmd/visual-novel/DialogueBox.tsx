import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DialogueBoxProps, DialogueBoxTheme } from './types';

/** 默认主题配置 */
const defaultTheme: DialogueBoxTheme = {
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  textColor: '#ffffff',
  speakerBgColor: 'rgba(59, 130, 246, 0.9)',
  speakerTextColor: '#ffffff',
  opacity: 0.85,
  blur: '8px',
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
  showControls = true,
  showSkipButton = true,
  showAutoButton = true,
  showHistoryButton = true,
  className,
}) => {
  const theme = { ...defaultTheme, ...userTheme };
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef<string>('');

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
        className="w-full h-full rounded-t-xl border-2 cursor-pointer select-none transition-all hover:border-white/30 flex flex-col"
        onClick={handleClick}
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          backdropFilter: `blur(${theme.blur})`,
          opacity: theme.opacity,
          pointerEvents: 'auto',
          position: 'relative',
          display: 'flex',
        }}
      >
        {/* 控制按钮区域 - 放在对话框内部顶部 */}
        {showControls && (
          <div className="flex justify-end gap-2 px-6 pt-3 pb-2 flex-shrink-0">
            {showHistoryButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHistory?.();
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-sm border border-white/10"
                title="历史记录"
              >
                📜 历史
              </button>
            )}
            {showAutoButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAuto?.();
                }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all backdrop-blur-sm border border-white/10 ${isAutoMode
                    ? 'bg-blue-500/80 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
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
                className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-sm border border-white/10"
                title="快进"
              >
                ⏩ 快进
              </button>
            )}
          </div>
        )}

        {/* 内容区域 - 使用 flex-1 占据剩余空间 */}
        <div className="px-6 pb-4 flex-1 flex flex-col justify-center overflow-y-auto">
          {/* 说话者名称 */}
          {dialogue.speaker && (
            <div
              className="inline-block px-4 py-1.5 rounded-lg mb-3 text-sm font-semibold shadow-lg self-start"
              style={{
                backgroundColor: speakerColor,
                color: theme.speakerTextColor,
              }}
            >
              {dialogue.speaker}
            </div>
          )}

          {/* 对话文本 */}
          <div
            className="text-lg leading-relaxed"
            style={{ color: theme.textColor }}
          >
            {displayedText}
            {/* 打字光标 */}
            {!isComplete && (
              <span className="inline-block w-0.5 h-5 bg-current animate-pulse ml-0.5 align-middle" />
            )}
          </div>

          {/* 点击继续提示 */}
          {isComplete && theme.showContinueHint && (
            <div className="flex justify-end mt-3">
              <span className="text-sm text-white/60 animate-bounce">
                {theme.continueHint}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 使用 Portal 将对话框渲染到 body，避免父容器的 overflow:hidden 影响
  if (typeof document !== 'undefined') {
    // 确保有一个专门的容器用于 Portal 内容
    let portalContainer = document.getElementById('dialogue-portal-root');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'dialogue-portal-root';
      portalContainer.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 999999;';
      document.body.appendChild(portalContainer);
    }
    return createPortal(dialogueContent, portalContainer);
  }

  return dialogueContent;
};

export default DialogueBox;

