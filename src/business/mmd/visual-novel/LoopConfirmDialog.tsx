import React from 'react';

interface LoopConfirmDialogProps {
  onRestart: () => void;
  onBackToStart: () => void;
  onCancel?: () => void;
}

/**
 * 循环确认对话框
 * 在剧本播放到最后一个节点时，询问用户是否继续循环
 */
export const LoopConfirmDialog: React.FC<LoopConfirmDialogProps> = ({
  onRestart,
  onBackToStart,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-2xl border border-slate-700">
        {/* 标题 */}
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            🎬 剧本已播放完毕
          </h3>
          <p className="text-slate-300 text-sm">
            你想要做什么呢？
          </p>
        </div>

        {/* 选项按钮 */}
        <div className="space-y-3">
          {/* 重新开始 */}
          <button
            onClick={onRestart}
            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white font-medium shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🔄</span>
              <div className="text-left">
                <div className="font-bold">重新开始</div>
                <div className="text-xs text-blue-100 opacity-90">从第一个节点继续播放</div>
              </div>
            </div>
          </button>

          {/* 回到开始页面 */}
          <button
            onClick={onBackToStart}
            className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white font-medium shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🏠</span>
              <div className="text-left">
                <div className="font-bold">回到开始页面</div>
                <div className="text-xs text-purple-100 opacity-90">返回标题界面</div>
              </div>
            </div>
          </button>

          {/* 取消按钮（可选） */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full rounded-lg bg-slate-700 px-6 py-3 text-slate-300 font-medium hover:bg-slate-600 transition-all duration-200"
            >
              取消
            </button>
          )}
        </div>

        {/* 提示信息 */}
        <div className="mt-4 text-center text-xs text-slate-400">
          💡 提示：你也可以使用快进按钮跳过已看过的内容
        </div>
      </div>
    </div>
  );
};

