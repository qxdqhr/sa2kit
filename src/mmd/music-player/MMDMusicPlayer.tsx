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
import { useMusic } from '../../music';
import { Search } from 'lucide-react';

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
      fixedResources,
      mikuMode,
      onTrackChange,
      onPlayPause,
      onProgress,
      onError,
      className,
      style,
    },
    ref
  ) => {
    const { tracks: initialTracks, autoPlay = false, defaultLoopMode = 'list' } = config;

    // 状态管理
    const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks);
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
    const [searchKeyword, setSearchKeyword] = useState('');

    // Miku 搜索集成
    const { search, searchResult, isSearching, getSongUrl } = useMusic();

    // 初始加载 Miku 歌曲
    useEffect(() => {
      if (mikuMode && tracks.length === 0) {
        search({ keyword: '', miku: true });
      }
    }, [mikuMode]);

    // 当搜索结果返回时，更新播放列表
    useEffect(() => {
      if (searchResult && searchResult.tracks.length > 0) {
        const newTracks: MusicTrack[] = searchResult.tracks.map(t => ({
          id: t.id,
          title: t.name,
          artist: t.artist,
          coverUrl: t.pic,
          resources: {
            modelPath: fixedResources?.modelPath || '', // 将在切换曲目时进一步处理
            motionPath: fixedResources?.motionPath || '',
            audioPath: t.url || '', // 初始可能为空，需要 getSongUrl
            stageModelPath: fixedResources?.stageModelPath,
            cameraPath: fixedResources?.cameraPath
          }
        }));
        setTracks(newTracks);
        setCurrentIndex(0);
        // 如果是 Miku 模式，第一个通常需要去获取播放链接
        fetchAndGoToTrack(0, newTracks);
      }
    }, [searchResult]);

    // 获取播放链接并跳转
    const fetchAndGoToTrack = async (index: number, currentTracksList: MusicTrack[] = tracks) => {
      const track = currentTracksList[index];
      if (!track) return;

      // 如果没有播放链接，先去获取
      if (!track.resources.audioPath) {
        setIsLoading(true);
        const url = await getSongUrl(track.id, (track as any).source || 'kugou');
        if (url) {
          const updatedTracks = [...currentTracksList];
          updatedTracks[index] = {
            ...track,
            resources: { ...track.resources, audioPath: url }
          };
          setTracks(updatedTracks);
          goToTrack(index, updatedTracks);
        } else {
          console.error('[MMDMusicPlayer] Failed to get song URL');
          setIsLoading(false);
        }
      } else {
        goToTrack(index, currentTracksList);
      }
    };

    // Refs
    const playerRef = useRef<MMDPlayerBaseRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isStartedRef = useRef(autoPlay);
    const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 获取当前曲目
    const currentTrack = tracks[currentIndex];

    // 切换到指定曲目
    const goToTrack = useCallback(
      (index: number, tracksList: MusicTrack[] = tracks) => {
        if (index < 0 || index >= tracksList.length) return;
        
        const track = tracksList[index];
        if (!track) return;

        // 如果开启了 fixedResources 模式，且模型/动作路径相同，则跳过重载遮罩
        const isSmoothUpdate = fixedResources && 
                              track.resources.modelPath === currentTrack?.resources.modelPath &&
                              track.resources.motionPath === currentTrack?.resources.motionPath;

        if (!isSmoothUpdate) {
          if (isTransitioning) return;
          setIsTransitioning(true);
          setIsLoading(true);
        }
        
        const wasPlaying = isPlaying;
        setIsPlaying(false);

        const applyChange = () => {
          setCurrentIndex(index);
          setCurrentTime(0);
          setDuration(0);
          onTrackChange?.(track, index);

          if (!isSmoothUpdate) {
            setTimeout(() => {
              setIsTransitioning(false);
              if (wasPlaying) isStartedRef.current = true;
            }, 100);
          } else {
            // 平滑切换：直接恢复播放状态
            if (wasPlaying) {
              setTimeout(() => {
                playerRef.current?.play();
                setIsPlaying(true);
              }, 300); // 给音频加载留一点点时间
            }
          }
        };

        if (!isSmoothUpdate) {
          setTimeout(applyChange, 300);
        } else {
          applyChange();
        }
      },
      [tracks, currentTrack, isTransitioning, isPlaying, onTrackChange, fixedResources]
    );

    // 下一曲逻辑
    const next = useCallback(() => {
      let nextIndex = currentIndex + 1;
      if (loopMode === 'shuffle') {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } else if (nextIndex >= tracks.length) {
        nextIndex = 0;
      }
      fetchAndGoToTrack(nextIndex);
    }, [currentIndex, tracks.length, loopMode, fetchAndGoToTrack]);

    // 上一曲逻辑
    const previous = useCallback(() => {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = tracks.length - 1;
      }
      fetchAndGoToTrack(prevIndex);
    }, [currentIndex, tracks.length, fetchAndGoToTrack]);

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
          mikuMode={mikuMode}
          isSearching={isSearching}
          onSearch={(keyword) => search({ keyword, miku: true })}
          onClose={() => setShowPlaylist(false)}
          onSelectTrack={(index) => {
            fetchAndGoToTrack(index);
            setShowPlaylist(false);
          }}
        />
      </div>
    );
  }
);

MMDMusicPlayer.displayName = 'MMDMusicPlayer';

export default MMDMusicPlayer;

