"use client";

import { useState, useRef, useEffect } from 'react';
import styles from '../styles';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  loop?: boolean;
  maxPlayCount?: number;
  className?: string;
}

/**
 * 通用音频播放器组件
 */
const AudioPlayer = ({ 
  audioUrl, 
  autoPlay = false, 
  loop = false, 
  maxPlayCount = 0, 
  className = '' 
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 处理加载状态和错误
  useEffect(() => {
    if (!audioUrl) {
      setError('未提供音频URL');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const audio = new Audio();
    audioRef.current = audio;
    
    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(audio.duration);
      if (autoPlay) {
        handlePlay();
      }
    };
    
    const handleError = () => {
      setIsLoading(false);
      setError('音频加载失败');
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      
      // 如果启用了循环播放并且没有达到最大播放次数
      if (loop && (maxPlayCount === 0 || playCount < maxPlayCount - 1)) {
        handlePlay();
      }
      
      // 无论是否循环，都增加播放次数
      setPlayCount(prev => prev + 1);
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    audio.src = audioUrl;
    audio.load();
    audio.volume = volume;
    
    return () => {
      audio.pause();
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, autoPlay, loop, maxPlayCount]);
  
  // 全局音频管理 - 暂停其他音频
  useEffect(() => {
    if (isPlaying) {
      // 创建一个自定义事件通知其他播放器暂停
      const pauseEvent = new CustomEvent('pauseOtherAudio', {
        detail: { excludeId: audioUrl }
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(pauseEvent);
      }
    }
    
    // 监听其他播放器的暂停请求
    const handlePauseRequest = (event: CustomEvent) => {
      if (event.detail.excludeId !== audioUrl && isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    
    // 安全地添加事件监听器
    if (typeof window !== 'undefined') {
      window.addEventListener('pauseOtherAudio', handlePauseRequest as EventListener);
    }
    
    return () => {
      // 安全地移除事件监听器
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('pauseOtherAudio', handlePauseRequest as EventListener);
        }
      } catch (error) {
        console.warn('清理AudioPlayer事件监听器时出错:', error);
      }
    };
  }, [audioUrl, isPlaying]);
  
  // 处理播放/暂停
  const handlePlay = () => {
    if (!audioRef.current) return;
    
    // 检查是否达到最大播放次数
    if (maxPlayCount > 0 && playCount >= maxPlayCount) {
      return;
    }
    
    // 如果音频已经结束，重置到开始
    if (audioRef.current.ended) {
      audioRef.current.currentTime = 0;
    }
    
    // 播放前通知其他音频暂停
    const pauseEvent = new CustomEvent('pauseOtherAudio', {
      detail: { excludeId: audioUrl }
    });
    window.dispatchEvent(pauseEvent);
    
    // 播放当前音频
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('播放失败:', error);
          setError('播放失败，可能是浏览器限制自动播放');
          setIsPlaying(false);
        });
    }
  };
  
  // 处理暂停
  const handlePause = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  };
  
  // 处理播放进度条拖动
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // 处理音量调整
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className={`${styles.audioPlayer} ${className}`}>
      {isLoading ? (
        <div className={styles.audioLoading}>加载音频中...</div>
      ) : error ? (
        <div className={styles.audioError}>{error}</div>
      ) : (
        <>
          <div className={styles.audioControls}>
            <button 
              className={styles.playButton} 
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={maxPlayCount > 0 && playCount >= maxPlayCount}
            >
              {isPlaying ? '暂停' : '播放'}
            </button>
            
            <div className={styles.progressContainer}>
              <input
                type="range"
                className={styles.progressBar}
                min="0"
                max={duration}
                step="0.01"
                value={currentTime}
                onChange={handleSeek}
              />
              <div className={styles.timeDisplay}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className={styles.volumeContainer}>
              <input
                type="range"
                className={styles.volumeControl}
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>
          
          {maxPlayCount > 0 && (
            <div className={styles.playCount}>
              已播放: {playCount}/{maxPlayCount}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AudioPlayer; 