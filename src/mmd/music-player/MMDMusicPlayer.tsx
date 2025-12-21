import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { MMDPlayerBase } from '../components/MMDPlayerBase';
import { MMDPlayerBaseRef } from '../types';
import {
  MMDMusicPlayerProps,
  MMDMusicPlayerRef,
  MusicTrack,
} from './types';
import { MusicControls } from './components/MusicControls';
import { PlaylistPanel } from './components/PlaylistPanel';
import { TrackInfo } from './components/TrackInfo';

/**
 * MMDMusicPlayer - MMD 音乐播放器组件 (Study with Miku 风格)
 * 
 * 核心功能：
 * - 多曲目无缝切换
 * - 完整的媒体控制 (播放/暂停/进度/音量)
 * - 沉浸式 3D 舞台
 * - 自动清理内存与物理引擎
 */
export const MMDMusicPlayer = forwardRef<MMDMusicPlayerRef, MMDMusicPlayerProps>(
  (
    {
      config,
      stage,
      mobileOptimization,
      initialTrackIndex = 0,
      onTrackChange,
      onPlayPause,
      onProgress,
      onError,
      className,
      style,
    },
    ref
  ) => {
    const { tracks, autoPlay = false, defaultLoopMode = 'list' } = config;

    // 状态管理
    const [currentIndex, setCurrentIndex] = useState(initialTrackIndex);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isLoading, setIsLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loopMode, setLoopMode] = useState<'list' | 'single' | 'shuffle'>(defaultLoopMode);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [isCameraManual, setIsCameraManual] = useState(false);

    // Refs
    const playerRef = useRef<MMDPlayerBaseRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isStartedRef = useRef(autoPlay);
    const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 获取当前曲目
    const currentTrack = tracks[currentIndex];

    // 切换到指定曲目 - 包含物理引擎清理逻辑
    const goToTrack = useCallback(
      (index: number) => {
        if (index < 0 || index >= tracks.length) return;
        if (isTransitioning) return;

        const track = tracks[index];
        if (!track) return;

        console.log(`[MMDMusicPlayer] Transitioning to track ${index}: ${track.title}`);

        // 1. 进入过渡状态并暂停
        setIsTransitioning(true);
        setIsLoading(true);
        const wasPlaying = isPlaying;
        setIsPlaying(false);

        // 2. 给物理引擎和 Three.js 资源清理留出时间 (参照 MMDPlaylist 逻辑)
        setTimeout(() => {
          setCurrentIndex(index);
          setCurrentTime(0);
          setDuration(0);
          onTrackChange?.(track, index);

          // 3. 结束过渡，允许新播放器挂载
          setTimeout(() => {
            setIsTransitioning(false);
            // 如果之前在播放，等待加载完成后恢复
            if (wasPlaying) {
              isStartedRef.current = true;
            }
          }, 100);
        }, 300);
      },
      [tracks, isTransitioning, isPlaying, onTrackChange]
    );

    // 下一曲逻辑
    const next = useCallback(() => {
      let nextIndex = currentIndex + 1;
      if (loopMode === 'shuffle') {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } else if (nextIndex >= tracks.length) {
        nextIndex = 0;
      }
      goToTrack(nextIndex);
    }, [currentIndex, tracks.length, loopMode, goToTrack]);

    // 上一曲逻辑
    const previous = useCallback(() => {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = tracks.length - 1;
      }
      goToTrack(prevIndex);
    }, [currentIndex, tracks.length, goToTrack]);

    // 暴露方法给外部
    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          setIsPlaying(true);
          isStartedRef.current = true;
          playerRef.current?.play();
        },
        pause: () => {
          setIsPlaying(false);
          isStartedRef.current = false;
          playerRef.current?.pause();
        },
        next,
        previous,
        goToTrack,
        setLoopMode,
        getState: () => ({
          currentIndex,
          isPlaying,
          currentTime,
          duration,
          loopMode,
        }),
      }),
      [next, previous, goToTrack, currentIndex, isPlaying, currentTime, duration, loopMode]
    );

    // 处理播放结束
    const handleEnded = useCallback(() => {
      if (loopMode === 'single') {
        playerRef.current?.seek(0);
        playerRef.current?.play();
      } else {
        next();
      }
    }, [loopMode, next]);

    // 处理时间更新
    const handleTimeUpdate = useCallback((time: number) => {
      setCurrentTime(time);
      if (playerRef.current) {
        const total = playerRef.current.getDuration();
        setDuration(total);
        onProgress?.(time, total);
      }
    }, [onProgress]);

    // UI 自动隐藏逻辑
    const resetUITimeout = useCallback(() => {
      setIsUIVisible(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      if (isPlaying) {
        uiTimeoutRef.current = setTimeout(() => {
          if (!showPlaylist) setIsUIVisible(false);
        }, 5000);
      }
    }, [isPlaying, showPlaylist]);

    useEffect(() => {
      resetUITimeout();
      return () => {
        if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      };
    }, [resetUITimeout]);

    if (!currentTrack) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-black text-white">
          播放列表为空
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`relative bg-black group ${className}`}
        style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
        onMouseMove={resetUITimeout}
        onClick={resetUITimeout}
      >
        {/* 3D 舞台层 */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            zIndex: 0,
            opacity: (isLoading || isTransitioning) ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          {!isTransitioning && (
            <MMDPlayerBase
              key={currentTrack.id}
              ref={playerRef}
              resources={currentTrack.resources}
              stage={{ ...stage, ...currentTrack.stage }}
              autoPlay={isStartedRef.current}
              loop={loopMode === 'single'}
              mobileOptimization={mobileOptimization}
              onLoad={() => {
                console.log('[MMDMusicPlayer] Track loaded');
                setIsLoading(false);
                if (isStartedRef.current) {
                  playerRef.current?.play();
                  setIsPlaying(true);
                }
              }}
              onPlay={() => {
                setIsPlaying(true);
                onPlayPause?.(true);
              }}
              onPause={() => {
                setIsPlaying(false);
                onPlayPause?.(false);
              }}
              onCameraChange={(isManual) => {
                setIsCameraManual(isManual);
              }}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={onError}
            />
          )}
        </div>

        {/* 加载遮罩 */}
        {(isLoading || isTransitioning) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
              <div className="text-white font-medium">
                {isTransitioning ? '准备下一首...' : '正在加载舞台...'}
              </div>
            </div>
          </div>
        )}

        {/* UI 交互层 */}
        <div 
          className={`absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-700 pointer-events-none ${isUIVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* 顶部信息 */}
          <div className="pt-12 px-8 flex justify-center">
            <TrackInfo track={currentTrack} />
          </div>

          {/* 底部控制 */}
          <div className="pb-12 px-8">
            <MusicControls 
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              loopMode={loopMode}
              isCameraManual={isCameraManual}
              onPlayPause={() => isPlaying ? playerRef.current?.pause() : playerRef.current?.play()}
              onNext={next}
              onPrevious={previous}
              onSeek={(time) => playerRef.current?.seek(time)}
              onResetCamera={() => {
                playerRef.current?.resetCamera();
                setIsCameraManual(false);
              }}
              onToggleLoop={() => {
                const modes: ('list' | 'single' | 'shuffle')[] = ['list', 'single', 'shuffle'];
                const nextMode = modes[(modes.indexOf(loopMode) + 1) % modes.length]!;
                setLoopMode(nextMode);
              }}
              onTogglePlaylist={() => setShowPlaylist(!showPlaylist)}
            />
          </div>
        </div>

        {/* 侧边播放列表 */}
        <PlaylistPanel 
          tracks={tracks}
          currentIndex={currentIndex}
          isOpen={showPlaylist}
          onClose={() => setShowPlaylist(false)}
          onSelectTrack={(index) => {
            goToTrack(index);
            setShowPlaylist(false);
          }}
        />
      </div>
    );
  }
);

MMDMusicPlayer.displayName = 'MMDMusicPlayer';

export default MMDMusicPlayer;

