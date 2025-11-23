'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MMDPlayerEnhanced } from './MMDPlayerEnhanced'
import type { MMDPlaylistProps, MMDPlaylistNode } from '../types'

/**
 * MMD 播放列表组件（预加载版本）
 * 
 * 在初始化时预加载所有节点的资源，切换时无需加载页面，实现无缝切换
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
  // 是否显示配置弹窗（不是播放列表弹窗）
  const [showSettings, setShowSettings] = useState(false);
  // 预加载状态
  const [preloadedNodes, setPreloadedNodes] = useState<Set<number>>(new Set());
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // 播放列表节点管理（本地状态）
  const [editableNodes, setEditableNodes] = useState<MMDPlaylistNode[]>(playlist.nodes);
  
  // 使用 ref 保存当前节点索引，避免闭包问题
  const currentNodeIndexRef = useRef<number>(defaultNodeIndex);
  // 标记是否是自动切换（用于控制是否自动播放）
  const isAutoSwitchRef = useRef<boolean>(false);
  // 保存每个播放器的 ref
  const playerRefsMap = useRef<Map<number, any>>(new Map());

  // 同步 currentNodeIndex 到 ref
  useEffect(() => {
    currentNodeIndexRef.current = currentNodeIndex;
  }, [currentNodeIndex]);

  // 获取当前节点（使用可编辑的节点列表）
  const currentNode = editableNodes[currentNodeIndex];

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
    
    // 如果预加载已完成，且是自动切换或 playlist.autoPlay 为 true，则开始播放
    if (!isPreloading && (isAutoSwitchRef.current || playlist.autoPlay)) {
      console.log(`▶️ [MMDPlaylist] 准备播放节点 ${currentNodeIndex}`);
      
      // 确保节点已经预加载完成再触发播放
      if (!preloadedNodes.has(currentNodeIndex)) {
        console.warn(`⚠️ [MMDPlaylist] 节点 ${currentNodeIndex} 尚未预加载完成，等待...`);
        return;
      }
      
      // 延迟一帧，确保 visibility 切换完成
      requestAnimationFrame(() => {
        const playerElement = playerRefsMap.current.get(currentNodeIndex);
        if (playerElement) {
          // 查找播放按钮并点击
          const playButton = playerElement.querySelector('button[title="播放"]');
          if (playButton) {
            console.log(`🎬 [MMDPlaylist] 触发节点 ${currentNodeIndex} 播放`);
            (playButton as HTMLButtonElement).click();
          } else {
            console.warn(`⚠️ [MMDPlaylist] 未找到节点 ${currentNodeIndex} 的播放按钮`);
          }
        } else {
          console.warn(`⚠️ [MMDPlaylist] 未找到节点 ${currentNodeIndex} 的 DOM 元素`);
        }
      });
    }
  }, [currentNodeIndex, currentNode, onNodeChange, isPreloading, playlist.autoPlay, preloadedNodes]);

  // 处理节点预加载完成
  const handleNodePreloaded = (nodeIndex: number) => {
    console.log(`✅ [MMDPlaylist] 节点 ${nodeIndex} 预加载完成`);
    setPreloadedNodes(prev => {
      const newSet = new Set(prev);
      newSet.add(nodeIndex);
      return newSet;
    });
  };

  // 检查所有节点是否都已预加载
  useEffect(() => {
    if (preloadedNodes.size === editableNodes.length) {
      console.log('🎉 [MMDPlaylist] 所有节点预加载完成');
      setIsPreloading(false);
      onLoad?.();
    } else {
      const progress = Math.round((preloadedNodes.size / editableNodes.length) * 100);
      setPreloadProgress(progress);
    }
  }, [preloadedNodes, editableNodes.length, onLoad]);

  // 处理播放结束事件（音频或动画结束时触发）
  // 使用 useCallback 并为每个节点创建独立的回调
  const handlePlaybackEnded = (nodeIndex: number) => {
    console.log(`🎵 [MMDPlaylist] 节点 ${nodeIndex} 播放完成`);
    
    // 只处理当前正在播放的节点
    if (nodeIndex !== currentNodeIndexRef.current) {
      console.log(`⚠️ [MMDPlaylist] 忽略非当前节点 ${nodeIndex} 的播放结束事件（当前: ${currentNodeIndexRef.current}）`);
      return;
    }

    const node = editableNodes[nodeIndex];
    if (!node) return;

    // 如果当前节点设置了循环，则不切换
    if (node.loop) {
      console.log('🔁 [MMDPlaylist] 当前节点循环播放');
      return;
    }

    const isLastNode = nodeIndex === editableNodes.length - 1;

    // 如果不是最后一个节点，切换到下一个
    if (!isLastNode) {
      console.log(`➡️ [MMDPlaylist] 切换到下一个节点: ${nodeIndex + 1}`);
      isAutoSwitchRef.current = true; // 标记为自动切换
      setCurrentNodeIndex(nodeIndex + 1);
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
    const newIndex = currentNodeIndex > 0 ? currentNodeIndex - 1 : editableNodes.length - 1;
    console.log(`⬅️ [MMDPlaylist] 上一个节点: ${newIndex}`);
    isAutoSwitchRef.current = false; // 手动切换
    setCurrentNodeIndex(newIndex);
  };

  const playlistNext = () => {
    const newIndex = currentNodeIndex < editableNodes.length - 1 ? currentNodeIndex + 1 : 0;
    console.log(`➡️ [MMDPlaylist] 下一个节点: ${newIndex}`);
    isAutoSwitchRef.current = false; // 手动切换
    setCurrentNodeIndex(newIndex);
  };

  const playlistJumpTo = (index: number) => {
    if (index < 0 || index >= editableNodes.length) return;
    console.log(`🎯 [MMDPlaylist] 跳转到节点: ${index}`);
    isAutoSwitchRef.current = false; // 手动切换
    setCurrentNodeIndex(index);
  };

  // 节点管理函数
  const handleDeleteNode = (index: number) => {
    if (editableNodes.length <= 1) {
      alert('播放列表至少需要保留一个节点');
      return;
    }

    const newNodes = editableNodes.filter((_, i) => i !== index);
    setEditableNodes(newNodes);
    
    // 如果删除的是当前节点之前的节点，需要调整当前索引
    if (index < currentNodeIndex) {
      setCurrentNodeIndex(currentNodeIndex - 1);
    }
    // 如果删除的是当前节点，跳转到前一个节点（或第一个节点）
    else if (index === currentNodeIndex) {
      const newIndex = Math.max(0, currentNodeIndex - 1);
      setCurrentNodeIndex(newIndex);
    }
    
    console.log(`🗑️ [MMDPlaylist] 删除节点 ${index}`);
  };

  const handleMoveNodeUp = (index: number) => {
    if (index === 0) return;
    
    const newNodes = [...editableNodes];
    const temp = newNodes[index - 1]!;
    newNodes[index - 1] = newNodes[index]!;
    newNodes[index] = temp;
    setEditableNodes(newNodes);
    
    // 更新当前索引
    if (currentNodeIndex === index) {
      setCurrentNodeIndex(index - 1);
    } else if (currentNodeIndex === index - 1) {
      setCurrentNodeIndex(index);
    }
    
    console.log(`⬆️ [MMDPlaylist] 节点 ${index} 上移`);
  };

  const handleMoveNodeDown = (index: number) => {
    if (index === editableNodes.length - 1) return;
    
    const newNodes = [...editableNodes];
    const temp = newNodes[index]!;
    newNodes[index] = newNodes[index + 1]!;
    newNodes[index + 1] = temp;
    setEditableNodes(newNodes);
    
    // 更新当前索引
    if (currentNodeIndex === index) {
      setCurrentNodeIndex(index + 1);
    } else if (currentNodeIndex === index + 1) {
      setCurrentNodeIndex(index);
    }
    
    console.log(`⬇️ [MMDPlaylist] 节点 ${index} 下移`);
  };

  // 计算是否应该自动播放
  // 只在初始加载时，根据 playlist.autoPlay 决定是否自动播放第一个节点
  const shouldAutoPlayInitial = playlist.autoPlay && currentNodeIndex === defaultNodeIndex && !isPreloading;

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {/* 预加载所有节点（隐藏） */}
      {editableNodes.map((node, index) => {
        return (
          <div
            key={`player-${node.id}-${index}`}
            ref={(el) => {
              if (el) {
                playerRefsMap.current.set(index, el);
              }
            }}
            className="absolute inset-0"
            style={{
              visibility: index === currentNodeIndex ? 'visible' : 'hidden',
              zIndex: index === currentNodeIndex ? 1 : 0,
            }}
          >
            <MMDPlayerEnhanced
              resources={node.resources}
              stage={stage}
              autoPlay={index === currentNodeIndex && shouldAutoPlayInitial}
              loop={node.loop || false}
              className="h-full w-full"
              onLoad={() => {
                handleNodePreloaded(index);
              }}
              onError={(error) => {
                console.error(`❌ [MMDPlaylist] 节点 ${index} 加载失败:`, error);
                if (index === currentNodeIndex) {
                  onError?.(error);
                }
              }}
              onAudioEnded={() => handlePlaybackEnded(index)}
              onAnimationEnded={() => handlePlaybackEnded(index)}
            />
          </div>
        );
      })}

      {/* 预加载进度提示 */}
      {isPreloading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold text-white">
              正在预加载播放列表
            </div>
            <div className="mb-2 text-lg text-white/80">
              {preloadedNodes.size} / {editableNodes.length} 节点
            </div>
            <div className="h-2 w-64 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                style={{ width: `${preloadProgress}%` }}
              />
            </div>
            <div className="mt-4 text-sm text-white/60">
              预加载所有资源后，切换节点将无需等待
            </div>
          </div>
        </div>
      )}

      {/* 播放列表控制按钮（位于右下角，不与播放器按钮重叠） */}
      {!isPreloading && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          {/* 上一个按钮 */}
          {editableNodes.length > 1 && (
            <button
              onClick={playlistPrevious}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-blue-600 hover:scale-110"
              title="上一个节点"
            >
              ⏮️
            </button>
          )}

          {/* 设置按钮（原播放列表按钮） */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-purple-600 hover:scale-110"
            title="播放列表设置"
          >
            ⚙️
          </button>

          {/* 下一个按钮 */}
          {editableNodes.length > 1 && (
            <button
              onClick={playlistNext}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-blue-600 hover:scale-110"
              title="下一个节点"
            >
              ⏭️
            </button>
          )}
        </div>
      )}

      {/* 当前节点信息提示（左上角） */}
      {!isPreloading && (
        <div className="absolute left-4 top-4 z-10 rounded-lg bg-black/50 px-4 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white/60">
              {currentNodeIndex + 1}/{editableNodes.length}
            </span>
            <span className="text-sm font-medium text-white">{currentNode.name}</span>
            {currentNode.loop && (
              <span className="rounded bg-white/20 px-2 py-0.5 text-xs text-white">🔁</span>
            )}
          </div>
        </div>
      )}

      {/* 配置弹窗 - 小型右上角弹窗 */}
      {showSettings && (
        <div 
          className="absolute inset-0 z-[100] flex items-start justify-end bg-black/40" 
          onClick={() => setShowSettings(false)}
        >
          {/* 弹窗内容 */}
          <div 
            className="relative m-4 flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-white/20"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 - 固定在顶部 */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-4 py-3 flex-shrink-0">
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                ⚙️ 播放列表配置
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xl text-white/60 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 可滚动内容区域 */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
              {/* 播放列表信息卡片 */}
              <div className="mb-3 rounded-lg bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-3 border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  📋 播放列表
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">名称：</span>
                    <span className="text-white font-medium">{playlist.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">节点数：</span>
                    <span className="text-white font-medium">{editableNodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">循环：</span>
                    <span className="text-white font-medium">{playlist.loop ? '是' : '否'}</span>
                  </div>
                </div>
              </div>

              {/* 当前节点信息卡片 */}
              <div className="mb-3 rounded-lg bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-3 border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  🎯 当前节点
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">名称：</span>
                    <span className="text-white font-medium truncate ml-2">{currentNode.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">位置：</span>
                    <span className="text-white font-medium">{currentNodeIndex + 1} / {editableNodes.length}</span>
                  </div>
                  {currentNode.resources.audioPath && (
                    <div className="text-white/80 mt-1">🎵 有音乐</div>
                  )}
                  {currentNode.resources.cameraPath && (
                    <div className="text-white/80">📷 有相机</div>
                  )}
                </div>
              </div>

              {/* 节点列表 */}
              <div className="rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  📝 节点管理
                </h4>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                  {editableNodes.map((node, index) => (
                    <div
                      key={`${node.id}-${index}`}
                      className={`rounded-md p-2 transition-all text-xs ${
                        currentNodeIndex === index
                          ? 'bg-gradient-to-r from-purple-600/50 to-blue-600/50 border border-purple-400/50'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-bold text-white/40">#{index + 1}</span>
                            <h5 className="font-semibold text-white text-xs truncate">{node.name}</h5>
                            {currentNodeIndex === index && (
                              <span className="rounded bg-green-500/30 px-1 py-0.5 text-[10px] text-green-300 flex-shrink-0">
                                ▶️
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 text-[10px] text-white/60">
                            {node.resources.modelPath && <span>👤</span>}
                            {node.resources.motionPath && <span>💃</span>}
                            {node.resources.audioPath && <span>🎵</span>}
                            {node.resources.cameraPath && <span>📷</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          {index > 0 && (
                            <button
                              onClick={() => handleMoveNodeUp(index)}
                              className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] transition-colors"
                              title="上移"
                            >
                              ⬆️
                            </button>
                          )}
                          {index < editableNodes.length - 1 && (
                            <button
                              onClick={() => handleMoveNodeDown(index)}
                              className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] transition-colors"
                              title="下移"
                            >
                              ⬇️
                            </button>
                          )}
                          <button
                            onClick={() => playlistJumpTo(index)}
                            className="p-0.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white text-[10px] transition-colors"
                            title="跳转"
                          >
                            ▶️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定删除 "${node.name}"？`)) {
                                handleDeleteNode(index);
                              }
                            }}
                            className="p-0.5 rounded bg-red-500/30 hover:bg-red-500/50 text-white text-[10px] transition-colors"
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
