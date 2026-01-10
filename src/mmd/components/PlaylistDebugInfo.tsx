import React, { useState, useEffect } from 'react';
import { MMDPlayerBaseRef, MMDPlaylistNode } from '../types';
import { clsx } from 'clsx';

interface PlaylistDebugInfoProps {
  /** 播放器引用 */
  playerRef: React.RefObject<MMDPlayerBaseRef>;
  /** 播放列表节点数组 */
  nodes: MMDPlaylistNode[];
  /** 当前节点索引 */
  currentIndex: number;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否加载中 */
  isLoading: boolean;
  /** 是否循环（单节点） */
  isLooping: boolean;
  /** 播放列表是否循环 */
  playlistLoop: boolean;
  /** 预加载策略 */
  preloadStrategy: 'none' | 'next' | 'all';
  /** 自定义类名 */
  className?: string;
}

/**
 * MMDPlaylist 调试信息组件
 * 用于展示播放列表状态和当前节点信息
 */
export const PlaylistDebugInfo: React.FC<PlaylistDebugInfoProps> = ({
  playerRef,
  nodes,
  currentIndex,
  isPlaying,
  isLoading,
  isLooping,
  playlistLoop,
  preloadStrategy,
  className = '',
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentNode = nodes[currentIndex];

  // 定时更新播放时间
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;

    const timer = setInterval(() => {
      if (playerRef.current) {
        setCurrentTime(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration());
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, playerRef]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return (mins) + ':' + (secs.toString().padStart(2, '0'));
  };

  return (
    <div className={clsx('bg-gray-900/90 text-white p-4 rounded-lg space-y-3', className)}>
      <div className="border-b border-gray-700 pb-2">
        <h3 className="text-lg font-semibold text-purple-400">Playlist 调试信息</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* 播放列表信息 */}
        <div className="col-span-2">
          <div className="text-gray-400">播放列表</div>
          <div className="font-semibold text-white">
            节点 {currentIndex + 1} / {nodes.length}
          </div>
        </div>

        {/* 当前节点名称 */}
        {currentNode && (
          <div className="col-span-2">
            <div className="text-gray-400">当前节点</div>
            <div className="font-mono text-green-400">{currentNode.name}</div>
          </div>
        )}

        {/* 当前节点 ID */}
        {currentNode && (
          <div className="col-span-2">
            <div className="text-gray-400">节点 ID</div>
            <div className="font-mono text-xs text-gray-300">{currentNode.id}</div>
          </div>
        )}

        {/* 播放状态 */}
        <div>
          <div className="text-gray-400">播放状态</div>
          <div className={clsx('font-semibold', isPlaying ? 'text-green-400' : 'text-yellow-400')}>
            {isLoading ? '加载中...' : isPlaying ? '播放中' : '已暂停'}
          </div>
        </div>

        {/* 播放时间 */}
        <div>
          <div className="text-gray-400">播放时间</div>
          <div className="font-mono text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* 节点循环 */}
        <div>
          <div className="text-gray-400">节点循环</div>
          <div className={clsx('font-semibold', isLooping ? 'text-green-400' : 'text-gray-500')}>
            {isLooping ? '开启' : '关闭'}
          </div>
        </div>

        {/* 列表循环 */}
        <div>
          <div className="text-gray-400">列表循环</div>
          <div className={clsx('font-semibold', playlistLoop ? 'text-green-400' : 'text-gray-500')}>
            {playlistLoop ? '开启' : '关闭'}
          </div>
        </div>

        {/* 预加载策略 */}
        <div className="col-span-2">
          <div className="text-gray-400">预加载策略</div>
          <div className="font-mono text-blue-400">{preloadStrategy}</div>
        </div>

        {/* 播放进度 */}
        <div className="col-span-2">
          <div className="text-gray-400 mb-1">播放进度</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-100"
              style={{ width: (duration > 0 ? (currentTime / duration) * 100 : 0) + '%' }}
            />
          </div>
        </div>

        {/* 节点列表预览 */}
        <div className="col-span-2 border-t border-gray-700 pt-2 mt-1">
          <div className="text-gray-400 mb-2">节点列表</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {nodes.map((node, index) => (
              <div
                key={node.id}
                className={clsx('text-xs px-2 py-1 rounded', index === currentIndex
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-gray-800 text-gray-400')}
              >
                {index + 1}. {node.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
