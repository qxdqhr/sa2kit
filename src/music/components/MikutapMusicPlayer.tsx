'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface MikutapMusicTrack {
  id: string;
  name: string;
  audioUrl: string;
  audioData?: string;
  duration?: number;
}

export interface MikutapMusicPlayerProps {
  track?: MikutapMusicTrack;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  className?: string;
  // 外部状态控制
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export default function MikutapMusicPlayer({
  track,
  onPlay,
  onPause,
  onSeek,
  className = '',
  isPlaying,
  currentTime,
  duration,
}: MikutapMusicPlayerProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);

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

  // 处理拖拽事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress && progressRef.current && duration) {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = percent * duration;
        handleSeek(time);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
    };

    if (isDraggingProgress) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, duration, handleSeek]);

  // 阻止事件传播的通用处理器
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div 
      className={`bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-purple-300/30 ${className}`}
      style={{ width: '200px' }}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onTouchStart={stopPropagation}
      onTouchEnd={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerUp={stopPropagation}
    >
      {/* 音乐信息 */}
      {track && (
        <div className="mb-3 text-center">
          <div className="text-white text-sm font-medium truncate mb-1">
            {track.name}
          </div>
          <div className="text-purple-200 text-xs">
            背景音乐
          </div>
        </div>
      )}

      {/* 播放/暂停按钮 */}
      <div className="flex justify-center mb-3">
        <button
          onClick={(e) => { stopPropagation(e); isPlaying ? handlePause() : handlePlay(); }}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchEnd={stopPropagation}
          onPointerDown={stopPropagation}
          onPointerUp={stopPropagation}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 ${
            isPlaying 
              ? 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white border-orange-300 shadow-orange-500/50' 
              : 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white border-green-300 shadow-green-500/50'
          }`}
          title={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <div className="flex gap-1">
              <div className="w-1.5 h-4 bg-white rounded-sm"></div>
              <div className="w-1.5 h-4 bg-white rounded-sm"></div>
            </div>
          ) : (
            <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1"></div>
          )}
        </button>
      </div>

      {/* 进度条 */}
      <div className="mb-2">
        <div 
          ref={progressRef}
          className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
          onMouseDown={handleProgressMouseDown}
          onClick={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchEnd={stopPropagation}
          onPointerDown={stopPropagation}
          onPointerUp={stopPropagation}
        >
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100 shadow-sm"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          ></div>
          <div 
            className="absolute top-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full transform -translate-y-1/2 cursor-grab shadow-lg"
            style={{ 
              left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-purple-200 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 状态指示器 */}
      <div className="flex justify-center">
        <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full transition-all duration-300 ${
          isPlaying 
            ? 'bg-orange-500/20 text-orange-200 border border-orange-400/30' 
            : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
        }`}>
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isPlaying ? 'bg-orange-400 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span>{isPlaying ? '播放中' : '已暂停'}</span>
        </div>
      </div>
    </div>
  );
} 