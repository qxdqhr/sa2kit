'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface MusicPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error?: string;
}

export interface PlayerMusicTrack {
  id: string;
  name: string;
  file: string;
  duration?: number;
  volume?: number;
}

export interface MusicPlayerProps {
  track?: PlayerMusicTrack;
  onPlay?: () => void; // 新增播放回调
  onPause?: () => void;
  onStop?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSeek?: (time: number) => void;
  initialVolume?: number;
  className?: string;
  compact?: boolean;
  ultraCompact?: boolean; // 超级紧缩模式，只显示播放控制和音量
  hideVolumeControl?: boolean; // 隐藏音量控制模块
  showTrackInfo?: boolean;
  // 外部状态控制 - 必需的props
  isPlaying: boolean; // 外部播放状态
  currentTime: number; // 外部当前时间
  duration: number; // 外部总时长
  externalVolume?: number; // 外部音量状态
}

export default function MusicPlayer({
  track,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onSeek,
  initialVolume = 0.7,
  className = '',
  compact = false,
  ultraCompact = false,
  hideVolumeControl = false,
  showTrackInfo = true,
  isPlaying,
  currentTime,
  duration,
  externalVolume
}: MusicPlayerProps) {
  const [volume, setVolume] = useState(externalVolume ?? initialVolume);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // 同步外部音量状态
  useEffect(() => {
    if (externalVolume !== undefined) {
      setVolume(externalVolume);
    }
  }, [externalVolume]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 播放控制
  const handlePlay = useCallback(() => {
    onPlay?.();
  }, [onPlay]);

  // 暂停控制
  const handlePause = useCallback(() => {
    onPause?.();
  }, [onPause]);

  // 停止控制
  const handleStop = useCallback(() => {
    onStop?.();
  }, [onStop]);

  // 音量控制
  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    onVolumeChange?.(clampedVolume);
  }, [onVolumeChange]);

  // 进度控制
  const handleSeek = useCallback((time: number) => {
    if (!duration || isNaN(duration)) return;
    
    const seekTime = Math.max(0, Math.min(duration, time));
    onSeek?.(seekTime);
  }, [duration, onSeek]);

  // 鼠标拖拽进度条
  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    
    setIsDraggingProgress(true);
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    handleSeek(time);
  }, [duration, handleSeek]);

  // 鼠标拖拽音量条
  const handleVolumeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!volumeRef.current) return;
    
    setIsDraggingVolume(true);
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    handleVolumeChange(percent);
  }, [handleVolumeChange]);

  // 处理拖拽事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress && progressRef.current && duration) {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = percent * duration;
        handleSeek(time);
      }
      
      if (isDraggingVolume && volumeRef.current) {
        const rect = volumeRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        handleVolumeChange(percent);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume, duration, handleSeek, handleVolumeChange]);

  // 阻止事件传播的通用处理器
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 如果是超级紧缩模式
  if (ultraCompact) {
    return (
      <div 
        className={`flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-purple-200 ${className}`}
        style={{ width: hideVolumeControl ? '120px' : '192px' }}
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        onTouchStart={stopPropagation}
        onTouchEnd={stopPropagation}
        onPointerDown={stopPropagation}
        onPointerUp={stopPropagation}
      >
        {/* 控制按钮 */}
        <div className={`flex items-center gap-1 ${hideVolumeControl ? 'w-full justify-center' : ''}`}>
          {/* 停止按钮 */}
          <button
            onClick={(e) => { stopPropagation(e); handleStop(); }}
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
            onTouchStart={stopPropagation}
            onTouchEnd={stopPropagation}
            onPointerDown={stopPropagation}
            onPointerUp={stopPropagation}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-colors"
            title="停止"
          >
            <div className="w-2.5 h-2.5 bg-gray-600 rounded-sm"></div>
          </button>

          {/* 播放/暂停按钮 */}
          <button
            onClick={(e) => { stopPropagation(e); isPlaying ? handlePause() : handlePlay(); }}
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
            onTouchStart={stopPropagation}
            onTouchEnd={stopPropagation}
            onPointerDown={stopPropagation}
            onPointerUp={stopPropagation}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
              isPlaying 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-purple-400' 
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-green-400 cursor-pointer'
            }`}
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? (
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-white rounded-sm"></div>
                <div className="w-1 h-3 bg-white rounded-sm"></div>
              </div>
            ) : (
              <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
            )}
          </button>
        </div>

        {/* 音量控制 */}
        {!hideVolumeControl && (
          <div className="flex items-center gap-1 flex-1">
            <div className="text-gray-500 text-xs">🔊</div>
            <div 
              ref={volumeRef}
              className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative"
              onMouseDown={handleVolumeMouseDown}
              onClick={stopPropagation}
              onTouchStart={stopPropagation}
              onTouchEnd={stopPropagation}
              onPointerDown={stopPropagation}
              onPointerUp={stopPropagation}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                style={{ width: `${volume * 100}%` }}
              ></div>
              <div 
                className="absolute top-1/2 w-3 h-3 bg-white border-2 border-purple-400 rounded-full transform -translate-y-1/2 cursor-grab"
                style={{ left: `${volume * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200 ${className}`}
      style={{ width: compact ? '280px' : '320px' }}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onTouchStart={stopPropagation}
      onTouchEnd={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerUp={stopPropagation}
    >
      {/* 音乐信息 */}
      {!compact && showTrackInfo && track && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-800 truncate">{track.name}</h3>
          <p className="text-xs text-gray-500">背景音乐</p>
        </div>
      )}

      {/* 进度条 */}
      {!compact && (
        <div className="mb-3">
          <div 
            ref={progressRef}
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative"
            onMouseDown={handleProgressMouseDown}
            onClick={stopPropagation}
            onTouchStart={stopPropagation}
            onTouchEnd={stopPropagation}
            onPointerDown={stopPropagation}
            onPointerUp={stopPropagation}
          >
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-100"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            ></div>
            <div 
              className="absolute top-1/2 w-4 h-4 bg-white border-2 border-purple-400 rounded-full transform -translate-y-1/2 cursor-grab"
              style={{ 
                left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                transform: 'translateX(-50%) translateY(-50%)'
              }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-3 mb-3">
        {/* 停止按钮 */}
        <button
          onClick={(e) => { stopPropagation(e); handleStop(); }}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchEnd={stopPropagation}
          onPointerDown={stopPropagation}
          onPointerUp={stopPropagation}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-colors"
          title="停止"
        >
          <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
        </button>

        {/* 播放/暂停按钮 */}
        <button
          onClick={(e) => { stopPropagation(e); isPlaying ? handlePause() : handlePlay(); }}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchEnd={stopPropagation}
          onPointerDown={stopPropagation}
          onPointerUp={stopPropagation}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
            isPlaying 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-purple-400' 
              : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-green-400 cursor-pointer'
          }`}
          title={isPlaying ? "暂停" : "播放"}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <div className="flex gap-1">
              <div className="w-1.5 h-4 bg-white rounded-sm"></div>
              <div className="w-1.5 h-4 bg-white rounded-sm"></div>
            </div>
          ) : (
            <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1"></div>
          )}
        </button>
      </div>

      {/* 音量控制 */}
      {!hideVolumeControl && (
        <div className="flex items-center gap-3">
          <div className="text-gray-500 text-sm">🔊</div>
          <div 
            ref={volumeRef}
            className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative"
            onMouseDown={handleVolumeMouseDown}
            onClick={stopPropagation}
            onTouchStart={stopPropagation}
            onTouchEnd={stopPropagation}
            onPointerDown={stopPropagation}
            onPointerUp={stopPropagation}
          >
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              style={{ width: `${volume * 100}%` }}
            ></div>
            <div 
              className="absolute top-1/2 w-4 h-4 bg-white border-2 border-purple-400 rounded-full transform -translate-y-1/2 cursor-grab"
              style={{ left: `${volume * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 w-8 text-right">
            {Math.round(volume * 100)}%
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}