import React from 'react';
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
  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col bg-black/90 backdrop-blur-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">📜 对话历史</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          aria-label="关闭"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="text-center text-white/50 py-8">
            暂无对话历史
          </div>
        ) : (
          history.map((item, index) => (
            <div
              key={`${item.nodeIndex}-${item.dialogueIndex}-${index}`}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {/* 说话者 */}
              {item.speaker && (
                <div
                  className="inline-block px-3 py-1 rounded-md mb-2 text-sm font-medium"
                  style={{
                    backgroundColor: theme?.speakerBgColor || 'rgba(59, 130, 246, 0.9)',
                    color: theme?.speakerTextColor || '#ffffff',
                  }}
                >
                  {item.speaker}
                </div>
              )}
              {/* 对话内容 */}
              <p
                className="text-base leading-relaxed"
                style={{ color: theme?.textColor || '#ffffff' }}
              >
                {item.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-3 border-t border-white/10 text-center">
        <span className="text-sm text-white/50">
          点击任意位置关闭
        </span>
      </div>
    </div>
  );
};

export default HistoryPanel;

