import React from 'react';

interface MMDPlayerEnhancedDebugInfoProps {
  isPlaying: boolean;
  isLooping: boolean;
  isFullscreen: boolean;
  showAxes: boolean;
  isLoading: boolean;
  currentResourceId?: string;
  currentResourceName?: string;
  mode: 'single' | 'list' | 'options';
  totalResources: number;
}

export const MMDPlayerEnhancedDebugInfo: React.FC<MMDPlayerEnhancedDebugInfoProps> = ({
  isPlaying,
  isLooping,
  isFullscreen,
  showAxes,
  isLoading,
  currentResourceId,
  currentResourceName,
  mode,
  totalResources,
}) => {
  return (
    <div className="text-white text-xs font-mono">
      <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-700">
        🎮 MMDPlayerEnhanced Debug
      </h3>

      {/* 播放状态 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">播放状态</h4>
        <div className="space-y-1 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">播放中:</span>
            <StatusBadge active={isPlaying} label={isPlaying ? 'Playing' : 'Paused'} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">循环:</span>
            <StatusBadge active={isLooping} label={isLooping ? 'On' : 'Off'} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">加载中:</span>
            <StatusBadge active={isLoading} label={isLoading ? 'Loading' : 'Ready'} />
          </div>
        </div>
      </div>

      {/* 视图状态 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">视图状态</h4>
        <div className="space-y-1 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">全屏:</span>
            <StatusBadge active={isFullscreen} label={isFullscreen ? 'Yes' : 'No'} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">坐标轴:</span>
            <StatusBadge active={showAxes} label={showAxes ? 'Show' : 'Hide'} />
          </div>
        </div>
      </div>

      {/* 资源信息 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">资源信息</h4>
        <div className="space-y-1 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">模式:</span>
            <span className="text-blue-400 uppercase">{mode}</span>
          </div>
          {mode === 'list' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">总数:</span>
                <span className="text-green-400">{totalResources}</span>
              </div>
              {currentResourceId && (
                <div className="mt-2 p-2 bg-gray-800 rounded">
                  <div className="text-gray-400 text-[10px]">当前资源</div>
                  <div className="text-white truncate">{currentResourceName || currentResourceId}</div>
                  <div className="text-gray-500 text-[10px] mt-1 truncate">ID: {currentResourceId}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 时间戳 */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="text-gray-500 text-[10px]">
          Last Update: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// 辅助组件：状态徽章
const StatusBadge: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <span
    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
      active
        ? 'bg-green-600 text-white'
        : 'bg-gray-700 text-gray-400'
    }`}
  >
    {label}
  </span>
);



