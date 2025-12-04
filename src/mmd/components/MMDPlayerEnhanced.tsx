import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MMDPlayerBase } from './MMDPlayerBase';
import { ControlPanel } from './ControlPanel';
import { SettingsPanel } from './SettingsPanel';
import { MMDPlayerBaseProps, MMDResources, MMDResourceItem, MMDResourceOptions, MMDPlayerBaseRef } from '../types';

// 扩展 Props 以支持高级模式
export type MMDPlayerEnhancedProps = Omit<MMDPlayerBaseProps, 'resources'> & {
  /** 单一资源模式 */
  resources?: MMDResources;
  /** 列表模式资源 */
  resourcesList?: MMDResourceItem[];
  /** 自由组合模式选项 */
  resourceOptions?: MMDResourceOptions;
  
  /** 列表模式下的默认 ID */
  defaultResourceId?: string;
  /** 自由组合模式下的默认选择 */
  defaultSelection?: {
    modelId?: string;
    motionId?: string;
    cameraId?: string;
    audioId?: string;
    stageId?: string;
  };
};

export const MMDPlayerEnhanced: React.FC<MMDPlayerEnhancedProps> = ({
  resources: propResources,
  resourcesList,
  resourceOptions,
  defaultResourceId,
  defaultSelection,
  stage,
  autoPlay = false,
  loop = true,
  volume: initialVolume = 1.0,
  muted: initialMuted = false,
  mobileOptimization,
  className,
  style,
  onLoad,
  onPlay,
  onPause,
  onEnded,
  ...rest
}) => {
  // 模式判断
  const mode = resourcesList ? 'list' : (resourceOptions ? 'options' : 'single');
  
  // 内部状态
  const [currentResources, setCurrentResources] = useState<MMDResources | undefined>(propResources);
  const [currentId, setCurrentId] = useState<string | undefined>(defaultResourceId);
  const [selection, setSelection] = useState(defaultSelection || {});
  
  // 播放器状态
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const playerRef = useRef<MMDPlayerBaseRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化资源逻辑
  useEffect(() => {
    if (mode === 'list' && resourcesList) {
       const targetId = currentId || resourcesList[0]?.id;
       const item = resourcesList.find(i => i.id === targetId);
       if (item) {
         setCurrentResources(item.resources);
         setCurrentId(item.id);
       }
    } else if (mode === 'options' && resourceOptions) {
       // 构建 Resources 对象
       const res: MMDResources = { modelPath: '' };
       
       if (selection.modelId) {
         const m = resourceOptions.models.find(o => o.id === selection.modelId);
         if (m) res.modelPath = m.path;
      } else if (resourceOptions.models.length > 0) {
        // 默认选第一个模型
        const firstModel = resourceOptions.models[0];
        if (firstModel) {
          res.modelPath = firstModel.path;
          setSelection(s => ({ ...s, modelId: firstModel.id }));
        }
      }
       
       if (selection.motionId) {
         const m = resourceOptions.motions.find(o => o.id === selection.motionId);
         if (m) res.motionPath = m.path;
       }
       
       // ... 其他选项映射
       if (selection.cameraId) {
         const c = resourceOptions.cameras?.find(o => o.id === selection.cameraId);
         if (c) res.cameraPath = c.path;
       }

       if (selection.audioId) {
         const a = resourceOptions.audios?.find(o => o.id === selection.audioId);
         if (a) res.audioPath = a.path;
       }
       
       if (selection.stageId) {
         const s = resourceOptions.stages?.find(o => o.id === selection.stageId);
         if (s) res.stageModelPath = s.path;
       }

       setCurrentResources(res);
    } else {
       setCurrentResources(propResources);
    }
  }, [mode, resourcesList, resourceOptions, currentId, selection, propResources]);

  // 处理全屏
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 监听全屏变化 (Esc 退出)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 回调处理
  const handlePlayPause = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    playerRef.current?.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    // 同步 duration
    if (playerRef.current) {
       const d = playerRef.current.getDuration();
       if (d > 0 && d !== duration) setDuration(d);
    }
  };
  
  const handleListSelect = (id: string) => {
    setCurrentId(id);
    setIsPlaying(true); // 切换后自动播放
    setShowSettings(false); // 手机端可能需要关闭
  };
  
  const handleOptionSelect = (type: string, id: string) => {
    setSelection(prev => {
      const next = { ...prev };
      if (type === 'models') next.modelId = id;
      if (type === 'motions') next.motionId = id;
      if (type === 'cameras') next.cameraId = id;
      if (type === 'audios') next.audioId = id;
      if (type === 'stages') next.stageId = id;
      return next;
    });
  };

  if (!currentResources) {
    return <div className="flex h-full w-full items-center justify-center bg-black text-white">No Resources Configured</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-black group ${className}`}
      style={style}
    >
      {/* 核心播放器 */}
      {/* Key 很重要：当资源变化时，通过改变 key 强制重置 BasePlayer，实现最彻底的清理和重新加载 */}
      <MMDPlayerBase
        key={mode === 'list' ? currentId : JSON.stringify(currentResources)}
        ref={playerRef}
        resources={currentResources}
        stage={stage}
        autoPlay={autoPlay} // 注意：这里 autoPlay 只在 mount 时生效
        loop={loop}
        volume={volume}
        muted={isMuted}
        mobileOptimization={mobileOptimization}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
          if (isPlaying) playerRef.current?.play();
        }}
        onPlay={() => {
          setIsPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setIsPlaying(false);
          onPause?.();
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onTimeUpdate={handleTimeUpdate}
        {...rest}
      />

      {/* 加载遮罩 */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
        </div>
      )}

      {/* 控制栏 - 鼠标悬停或暂停时显示 */}
      <div className={`transition-opacity duration-300 ${isPlaying && !showSettings ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <ControlPanel
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          showSettings={mode !== 'single'}
          title={mode === 'list' ? resourcesList?.find(i => i.id === currentId)?.name : undefined}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onSeek={(t) => playerRef.current?.seek(t)}
          onVolumeChange={setVolume}
          onToggleMute={() => setIsMuted(!isMuted)}
          onToggleFullscreen={toggleFullscreen}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {/* 设置面板 */}
      {showSettings && (mode === 'list' || mode === 'options') && (
        <SettingsPanel
          mode={mode}
          items={resourcesList}
          currentId={currentId}
          onSelectId={handleListSelect}
          options={resourceOptions}
          currentSelection={selection}
          onSelectOption={handleOptionSelect}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

