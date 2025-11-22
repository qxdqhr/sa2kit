'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MMDPlayerEnhanced } from './MMDPlayerEnhanced'
import type { MMDPlaylistProps, MMDPlaylistNode } from '../types'

/**
 * MMD 播放列表组件
 * 
 * 基于 MMDPlayerEnhanced 封装，支持多个资源配置的连续播放
 * 
 * @example
 * ```tsx
 * const playlist = {
 *   id: 'my-playlist',
 *   name: '我的播放列表',
 *   nodes: [
 *     {
 *       id: 'node1',
 *       name: '第一个节点',
 *       resources: { modelPath: '...', motionPath: '...', audioPath: '...' }
 *     },
 *     {
 *       id: 'node2',
 *       name: '第二个节点',
 *       resources: { modelPath: '...', motionPath: '...', audioPath: '...' }
 *     }
 *   ],
 *   loop: true,
 *   autoPlay: true
 * };
 * 
 * <MMDPlaylist playlist={playlist} />
 * ```
 */
export const MMDPlaylist: React.FC<MMDPlaylistProps> = ({
  playlist,
  stage,
  defaultNodeIndex = 0,
  className,
  style,
  onLoad,
  onError,
  onNodeChange,
  onPlaylistComplete,
}) => {
  console.log('🎬 [MMDPlaylist] 组件初始化');
  console.log('📋 [MMDPlaylist] 播放列表:', playlist.name, '节点数:', playlist.nodes.length);

  // 当前播放的节点索引
  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(defaultNodeIndex);
  // 是否显示播放列表弹窗
  const [showPlaylist, setShowPlaylist] = useState(false);
  // 使用 ref 保存当前节点索引，避免闭包问题
  const currentNodeIndexRef = useRef<number>(defaultNodeIndex);
  // 标记是否是自动切换（用于控制是否自动播放）
  const isAutoSwitchRef = useRef<boolean>(false);

  // 同步 currentNodeIndex 到 ref
  useEffect(() => {
    currentNodeIndexRef.current = currentNodeIndex;
  }, [currentNodeIndex]);

  // 获取当前节点
  const currentNode = playlist.nodes[currentNodeIndex];

  if (!currentNode) {
    console.error('❌ [MMDPlaylist] 无效的节点索引:', currentNodeIndex);
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <p>播放列表节点索引无效</p>
      </div>
    );
  }

  console.log('🎯 [MMDPlaylist] 当前节点:', currentNode.name, '索引:', currentNodeIndex);

  // 节点切换处理
  useEffect(() => {
    console.log(`🔄 [MMDPlaylist] 节点切换: ${currentNodeIndex} - ${currentNode.name}`);
    onNodeChange?.(currentNodeIndex, currentNode);
  }, [currentNodeIndex, currentNode, onNodeChange]);

  // 处理播放结束事件（音频或动画结束时触发）
  const handlePlaybackEnded = () => {
    console.log('🎵 [MMDPlaylist] 当前节点播放完成');

    // 如果当前节点设置了循环，则不切换
    if (currentNode.loop) {
      console.log('🔁 [MMDPlaylist] 当前节点循环播放');
      return;
    }

    const isLastNode = currentNodeIndex === playlist.nodes.length - 1;

    // 如果不是最后一个节点，切换到下一个
    if (!isLastNode) {
      console.log(`➡️ [MMDPlaylist] 切换到下一个节点: ${currentNodeIndex + 1}`);
      isAutoSwitchRef.current = true; // 标记为自动切换
      setCurrentNodeIndex(currentNodeIndex + 1);
      return;
    }

    // 如果是最后一个节点且列表设置了循环，回到第一个
    if (playlist.loop) {
      console.log('🔁 [MMDPlaylist] 播放列表循环，回到第一个节点');
      isAutoSwitchRef.current = true; // 标记为自动切换
      setCurrentNodeIndex(0);
      return;
    }

    // 否则，播放列表结束
    console.log('✅ [MMDPlaylist] 播放列表播放完成');
    onPlaylistComplete?.();
  };

  // 播放列表控制函数
  const playlistPrevious = () => {
    const newIndex = currentNodeIndex > 0 ? currentNodeIndex - 1 : playlist.nodes.length - 1;
    console.log(`⬅️ [MMDPlaylist] 上一个节点: ${newIndex}`);
    isAutoSwitchRef.current = false; // 手动切换
    setCurrentNodeIndex(newIndex);
  };

  const playlistNext = () => {
    const newIndex = currentNodeIndex < playlist.nodes.length - 1 ? currentNodeIndex + 1 : 0;
    console.log(`➡️ [MMDPlaylist] 下一个节点: ${newIndex}`);
    isAutoSwitchRef.current = false; // 手动切换
    setCurrentNodeIndex(newIndex);
  };

  const playlistJumpTo = (index: number) => {
    if (index < 0 || index >= playlist.nodes.length) return;
    console.log(`🎯 [MMDPlaylist] 跳转到节点: ${index}`);
    isAutoSwitchRef.current = false; // 手动切换
    setCurrentNodeIndex(index);
  };

  // 计算是否应该自动播放
  // 1. 如果是第一次加载且 playlist.autoPlay !== false，则自动播放
  // 2. 如果是自动切换（上一个节点播放完成），则自动播放
  const shouldAutoPlay = (playlist.autoPlay !== false && currentNodeIndex === defaultNodeIndex) || isAutoSwitchRef.current;

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {/* MMD 播放器 */}
      <MMDPlayerEnhanced
        key={`node-${currentNodeIndex}`} // 使用 key 强制重新挂载，确保资源完全重新加载
        resources={currentNode.resources}
        stage={stage}
        autoPlay={shouldAutoPlay}
        loop={currentNode.loop || false}
        className="h-full w-full"
        onLoad={onLoad}
        onError={onError}
        onAudioEnded={handlePlaybackEnded}
        onAnimationEnded={handlePlaybackEnded}
      />

      {/* 播放列表控制按钮（位于右下角，不与播放器按钮重叠） */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {/* 上一个按钮 */}
        {playlist.nodes.length > 1 && (
          <button
            onClick={playlistPrevious}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-blue-600 hover:scale-110"
            title="上一个节点"
          >
            ⏮️
          </button>
        )}

        {/* 播放列表按钮 */}
        <button
          onClick={() => setShowPlaylist(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-indigo-600 hover:scale-110"
          title="播放列表"
        >
          📋
        </button>

        {/* 下一个按钮 */}
        {playlist.nodes.length > 1 && (
          <button
            onClick={playlistNext}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-blue-600 hover:scale-110"
            title="下一个节点"
          >
            ⏭️
          </button>
        )}
      </div>

      {/* 当前节点信息提示（左上角） */}
      <div className="absolute left-4 top-4 rounded-lg bg-black/50 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white/60">
            {currentNodeIndex + 1}/{playlist.nodes.length}
          </span>
          <span className="text-sm font-medium text-white">{currentNode.name}</span>
          {currentNode.loop && (
            <span className="rounded bg-white/20 px-2 py-0.5 text-xs text-white">🔁</span>
          )}
        </div>
      </div>

      {/* 播放列表弹窗 */}
      {showPlaylist && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black shadow-2xl">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-white">{playlist.name}</h3>
                <p className="mt-1 text-sm text-white/60">
                  {currentNodeIndex + 1} / {playlist.nodes.length}
                  {playlist.loop && ' • 循环播放'}
                </p>
                {playlist.description && (
                  <p className="mt-1 text-sm text-white/50">{playlist.description}</p>
                )}
              </div>
              <button
                onClick={() => setShowPlaylist(false)}
                className="text-2xl text-white/60 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 播放列表 */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {playlist.nodes.map((node, index) => (
                <button
                  key={node.id}
                  onClick={() => {
                    playlistJumpTo(index);
                    setShowPlaylist(false);
                  }}
                  className={`mb-3 w-full rounded-xl p-4 text-left transition-all ${
                    currentNodeIndex === index
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white/40">#{index + 1}</span>
                        <h4 className="font-semibold text-white">{node.name}</h4>
                        {node.loop && (
                          <span className="rounded bg-white/20 px-2 py-0.5 text-xs text-white">
                            🔁 循环
                          </span>
                        )}
                      </div>
                      {node.description && (
                        <p className="mt-1 text-sm text-white/60">{node.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
                        {node.resources.modelPath && (
                          <span className="rounded bg-white/10 px-2 py-1">
                            👤 模型
                          </span>
                        )}
                        {node.resources.motionPath && (
                          <span className="rounded bg-white/10 px-2 py-1">
                            💃 动作
                          </span>
                        )}
                        {node.resources.audioPath && (
                          <span className="rounded bg-white/10 px-2 py-1">
                            🎵 音乐
                          </span>
                        )}
                        {node.resources.cameraPath && (
                          <span className="rounded bg-white/10 px-2 py-1">
                            📷 相机
                          </span>
                        )}
                        {node.resources.stageModelPath && (
                          <span className="rounded bg-white/10 px-2 py-1">
                            🏛️ 场景
                          </span>
                        )}
                        {node.resources.backgroundPath && (
                          <span className="rounded bg-white/10 px-2 py-1">
                            🖼️ 背景
                          </span>
                        )}
                      </div>
                    </div>
                    {currentNodeIndex === index && (
                      <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                        <span className="text-lg">▶️</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

