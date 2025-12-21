import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MMDPlayerBase } from './MMDPlayerBase';
import { ControlPanel } from './ControlPanel';
import { MMDPlaylistDebugInfo } from './MMDPlaylistDebugInfo';
import {
  MMDPlaylistProps,
  MMDPlaylistNode,
  MMDPlayerBaseRef,
} from '../types';

/**
 * MMDPlaylist - 播放列表管理器
 * 
 * 核心功能：
 * - 管理多个播放节点
 * - 实现无缝切换（通过 key 变化触发组件重新挂载）
 * - 预加载策略 (none / next / all)
 * - 智能内存回收
 * - 播放列表 UI
 */
export const MMDPlaylist: React.FC<MMDPlaylistProps> = ({
  playlist,
  stage,
  mobileOptimization,
  onNodeChange,
  onPlaylistComplete,
  onError,
  showDebugInfo = false,
  className,
  style,
}) => {
  const { nodes, loop = false, preload = 'none', autoPlay = false } = playlist;

  // 状态管理
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [isLooping, setIsLooping] = useState(false); // 单节点循环
  const [isListLooping, setIsListLooping] = useState(loop); // 列表循环
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // 切换过渡状态
  const [isCameraManual, setIsCameraManual] = useState(false);

  // Refs
  const playerRef = useRef<MMDPlayerBaseRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloadedRef = useRef<Set<number>>(new Set()); // 记录已预加载的节点索引

  // 获取当前节点
  const currentNode = nodes[currentIndex];

  // 节点切换 - 两阶段切换，特别关注物理引擎清理
  const goToNode = useCallback(
    (index: number) => {
      if (index < 0 || index >= nodes.length) return;
      if (isTransitioning) return; // 防止在过渡期间重复切换
      
      const node = nodes[index];
      if (!node) return;
      
      console.log(`[MMDPlaylist] Starting transition to node ${index}`);
      
      // 先暂停播放
      const wasPlaying = isPlaying;
      setIsPlaying(false);
      
      // 第一阶段：卸载旧播放器（包括物理引擎）
      setIsTransitioning(true);
      
      // 给物理引擎足够的时间完全清理
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            // 第二阶段：挂载新播放器
            console.log(`[MMDPlaylist] Loading new node ${index}`);
            setCurrentIndex(index);
            setIsLoading(true);
            onNodeChange?.(node, index);
            
            // 给新组件足够时间初始化
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  setIsTransitioning(false);
                  
                  // 切换后如果之前在播放，则自动播放新节点
                  if (wasPlaying) {
                    setIsPlaying(true);
                  }
                  
                  console.log(`[MMDPlaylist] Transition to node ${index} completed`);
                }, 100);
              });
            });
          }, 300); // 给物理引擎更多清理时间（300ms）
        });
      });
    },
    [nodes, isPlaying, isTransitioning, onNodeChange]
  );

  // 上一个节点
  const handlePrevious = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      goToNode(prevIndex);
    } else if (isListLooping) {
      // 如果列表循环，跳到最后一个
      goToNode(nodes.length - 1);
    }
  }, [currentIndex, isListLooping, nodes.length, goToNode]);

  // 下一个节点
  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < nodes.length) {
      goToNode(nextIndex);
    } else if (isListLooping) {
      // 如果列表循环，跳回第一个
      goToNode(0);
    } else {
      // 播放列表完成
      setIsPlaying(false);
      onPlaylistComplete?.();
    }
  }, [currentIndex, isListLooping, nodes.length, goToNode, onPlaylistComplete]);

  // 播放控制
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playerRef.current?.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // 全屏控制
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 当前节点播放结束时的处理
  const handleEnded = useCallback(() => {
    if (isLooping) {
      // 如果单节点循环，重新播放当前节点
      playerRef.current?.play();
    } else {
      // 否则播放下一个节点
      handleNext();
    }
  }, [isLooping, handleNext]);

  // 预加载策略实现
  // 注意：当前架构下通过 key 变化实现资源切换，真正的预加载需要创建隐藏组件实例
  // 这里实现基础的预加载标记和日志，作为未来扩展的基础
  useEffect(() => {
    if (preload === 'none') return;

    if (preload === 'all') {
      // 标记所有节点为"应该预加载"（实际预加载需要后台资源加载器支持）
      nodes.forEach((node, idx) => {
        if (!preloadedRef.current.has(idx)) {
          preloadedRef.current.add(idx);
          console.log(`[MMDPlaylist] Preload strategy: all - marked node ${idx} (${node.name})`);
        }
      });
    } else if (preload === 'next') {
      // 预加载下一个节点
      const nextIndex = (currentIndex + 1) % nodes.length;
      const nextNode = nodes[nextIndex];
      if (nextNode && !preloadedRef.current.has(nextIndex)) {
        preloadedRef.current.add(nextIndex);
        console.log(`[MMDPlaylist] Preload strategy: next - marked node ${nextIndex} (${nextNode.name})`);
      }
    }
  }, [currentIndex, nodes, preload]);

  // 智能内存回收：清理已预加载但距离当前节点较远的资源标记
  useEffect(() => {
    if (preload === 'none' || preload === 'all') return;
    if (nodes.length === 0) return; // 防御性检查

    // 对于 'next' 策略，清理除当前和下一个之外的预加载标记
    const nextIndex = (currentIndex + 1) % nodes.length;
    const keepIndices = new Set([currentIndex, nextIndex]);
    
    const toRemove: number[] = [];
    preloadedRef.current.forEach((idx) => {
      // 确保索引在有效范围内
      if (idx >= nodes.length || !keepIndices.has(idx)) {
        toRemove.push(idx);
      }
    });

    if (toRemove.length > 0) {
      toRemove.forEach((idx) => {
        preloadedRef.current.delete(idx);
        console.log(`[MMDPlaylist] Memory cleanup: removed preload mark for node ${idx}`);
      });
    }
  }, [currentIndex, nodes.length, preload]);

  // 组件卸载时清理所有预加载标记
  useEffect(() => {
    return () => {
      console.log('[MMDPlaylist] Component unmounted, clearing all preload marks');
      preloadedRef.current.clear();
    };
  }, []);

  if (!currentNode) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        播放列表为空
      </div>
    );
  }

  // 是否显示上一个/下一个按钮
  const showPrevNext = nodes.length > 1;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black group flex h-full ${className}`}
      style={style}
    >
      {/* 主播放器区域 */}
      <div className="flex-1 relative">
      {/* 核心播放器 - 通过 key 变化实现资源切换和自动清理 */}
      {!isTransitioning && (
        <MMDPlayerBase
          key={currentNode.id}
          ref={playerRef}
          resources={currentNode.resources}
          stage={{ ...stage, ...currentNode.stage }}
          autoPlay={autoPlay && currentIndex === 0} // 只有第一个节点自动播放
          loop={isLooping} // 单节点循环
          showAxes={showAxes}
          mobileOptimization={mobileOptimization}
          onLoad={() => {
            setIsLoading(false);
            if (isPlaying && currentIndex > 0) {
              // 切换节点后继续播放
              playerRef.current?.play();
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onCameraChange={(isManual) => setIsCameraManual(isManual)}
          onEnded={handleEnded}
          onError={onError}
        />
      )}

      {/* 加载/过渡遮罩 */}
      {(isLoading || isTransitioning) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
            <div className="text-sm text-white/80">
              {isTransitioning ? '切换中...' : `正在加载 ${currentIndex + 1} / ${nodes.length}`}
            </div>
          </div>
        </div>
      )}

      {/* 控制栏 */}
      <div
        className={`transition-opacity duration-300 ${
          isPlaying && !showPlaylist ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`}
      >
        <ControlPanel
          isPlaying={isPlaying}
          isFullscreen={isFullscreen}
          isLooping={isLooping}
          isListLooping={isListLooping}
          isCameraManual={isCameraManual}
          showSettings={true} // 显示播放列表按钮
          showAxes={showAxes}
          showPrevNext={showPrevNext}
          title={currentNode.name}
          subtitle={`${currentIndex + 1} / ${nodes.length}`}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToggleFullscreen={toggleFullscreen}
          onToggleLoop={() => setIsLooping(!isLooping)}
          onToggleListLoop={() => setIsListLooping(!isListLooping)}
          onToggleAxes={() => setShowAxes(!showAxes)}
          onOpenSettings={() => setShowPlaylist(!showPlaylist)}
          onResetCamera={() => {
            playerRef.current?.resetCamera();
            setIsCameraManual(false);
          }}
        />
      </div>

      {/* 播放列表面板 */}
      {showPlaylist && (
        <div className="absolute inset-0 z-20 flex items-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-h-[60vh] overflow-y-auto bg-gray-900/95 rounded-t-xl">
            {/* 标题栏 */}
            <div className="sticky top-0 flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div>
                <h3 className="text-white font-semibold">{playlist.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  共 {nodes.length} 个节点
                </p>
              </div>
              <button
                onClick={() => setShowPlaylist(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="关闭播放列表"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 节点列表 */}
            <div className="p-2">
              {nodes.map((node, index) => (
                <button
                  key={node.id}
                  onClick={() => {
                    goToNode(index);
                    setShowPlaylist(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-all ${
                    index === currentIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {/* 序号 */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index === currentIndex ? 'bg-white/20' : 'bg-gray-700'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* 节点信息 */}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{node.name}</div>
                    {node.duration && (
                      <div className="text-xs opacity-75 mt-0.5">
                        {Math.floor(node.duration / 60)}:{String(Math.floor(node.duration % 60)).padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* 当前播放指示器 */}
                  {index === currentIndex && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 调试信息面板 */}
      {showDebugInfo && (
        <div className="w-96 flex-shrink-0 bg-gray-900/95 border-l border-gray-700 p-4 overflow-y-auto h-full">
          <MMDPlaylistDebugInfo
            playlistName={playlist.name}
            currentIndex={currentIndex}
            currentNode={currentNode}
            totalNodes={nodes.length}
            isPlaying={isPlaying}
            isListLooping={isListLooping}
            isNodeLooping={isLooping}
            preloadStrategy={preload}
            isLoading={isLoading || isTransitioning}
            isFullscreen={isFullscreen}
            showAxes={showAxes}
            preloadedNodes={Array.from(preloadedRef.current)}
          />
        </div>
      )}
    </div>
  );
};

