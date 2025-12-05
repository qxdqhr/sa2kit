import React from 'react';
import { MMDPlaylistNode } from '../types';

interface MMDPlaylistDebugInfoProps {
  playlistName: string;
  currentIndex: number;
  currentNode: MMDPlaylistNode;
  totalNodes: number;
  isPlaying: boolean;
  isListLooping: boolean;
  isNodeLooping: boolean;
  preloadStrategy: 'none' | 'next' | 'all';
  isLoading: boolean;
  isFullscreen: boolean;
  showAxes: boolean;
  preloadedNodes: number[];
}

export const MMDPlaylistDebugInfo: React.FC<MMDPlaylistDebugInfoProps> = ({
  playlistName,
  currentIndex,
  currentNode,
  totalNodes,
  isPlaying,
  isListLooping,
  isNodeLooping,
  preloadStrategy,
  isLoading,
  isFullscreen,
  showAxes,
  preloadedNodes,
}) => {
  return (
    <div className="text-white text-xs font-mono">
      <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-700">
        🎭 MMDPlaylist Debug
      </h3>

      {/* 播放列表信息 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">播放列表</h4>
        <div className="space-y-1 pl-2">
          <div className="text-white truncate">
            {playlistName}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">进度:</span>
            <span className="text-blue-400">
              {currentIndex + 1} / {totalNodes}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">列表循环:</span>
            <StatusBadge active={isListLooping} label={isListLooping ? 'On' : 'Off'} />
          </div>
        </div>
      </div>

      {/* 当前节点 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">当前节点</h4>
        <div className="p-2 bg-gray-800 rounded space-y-1">
          <div className="text-white font-semibold truncate">
            {currentNode.name}
          </div>
          <div className="text-gray-500 text-[10px] truncate">
            ID: {currentNode.id}
          </div>
          {currentNode.duration && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">时长:</span>
              <span className="text-green-400">{currentNode.duration}s</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">节点循环:</span>
            <StatusBadge active={isNodeLooping} label={isNodeLooping ? 'On' : 'Off'} />
          </div>
        </div>
      </div>

      {/* 播放状态 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">播放状态</h4>
        <div className="space-y-1 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">播放中:</span>
            <StatusBadge active={isPlaying} label={isPlaying ? 'Playing' : 'Paused'} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">加载中:</span>
            <StatusBadge active={isLoading} label={isLoading ? 'Loading' : 'Ready'} />
          </div>
        </div>
      </div>

      {/* 预加载策略 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">预加载策略</h4>
        <div className="space-y-1 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">策略:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              preloadStrategy === 'all' ? 'bg-red-600 text-white' :
              preloadStrategy === 'next' ? 'bg-yellow-600 text-white' :
              'bg-gray-700 text-gray-400'
            }`}>
              {preloadStrategy}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">已预加载:</span>
            <span className="text-purple-400">{preloadedNodes.length}</span>
          </div>
          {preloadedNodes.length > 0 && (
            <div className="mt-2 p-2 bg-gray-800 rounded">
              <div className="text-gray-400 text-[10px] mb-1">预加载节点索引</div>
              <div className="flex flex-wrap gap-1">
                {preloadedNodes.map((idx) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      idx === currentIndex
                        ? 'bg-green-600 text-white font-bold'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {idx}
                  </span>
                ))}
              </div>
            </div>
          )}
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

      {/* 节点列表 */}
      <div className="mb-4">
        <h4 className="text-gray-400 mb-2">节点列表</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {Array.from({ length: totalNodes }).map((_, idx) => (
            <div
              key={idx}
              className={`px-2 py-1 rounded text-[10px] flex items-center justify-between ${
                idx === currentIndex
                  ? 'bg-blue-600 text-white font-bold'
                  : preloadedNodes.includes(idx)
                  ? 'bg-yellow-900/50 text-yellow-300'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <span>节点 {idx}</span>
              {idx === currentIndex && <span>▶</span>}
              {preloadedNodes.includes(idx) && idx !== currentIndex && <span>⏳</span>}
            </div>
          ))}
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



