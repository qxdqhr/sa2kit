import React from 'react';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, Settings, SkipBack } from 'lucide-react';

interface ControlPanelProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showSettings?: boolean;
  title?: string;
  
  onPlayPause: () => void;
  onStop?: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onOpenSettings?: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  showSettings,
  title,
  onPlayPause,
  onStop,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onOpenSettings,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 transition-opacity duration-300 hover:opacity-100">
      {/* 进度条 */}
      <div className="group relative mb-2 h-1 w-full cursor-pointer bg-white/30 hover:h-2">
        <div 
          className="absolute h-full bg-blue-500 transition-all" 
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          {/* 播放控制 */}
          <button 
            onClick={onPlayPause}
            className="rounded-full p-2 hover:bg-white/20 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {onStop && (
            <button 
              onClick={onStop}
              className="rounded-full p-2 hover:bg-white/20 transition-colors"
            >
              <SkipBack size={20} />
            </button>
          )}

          {/* 时间 */}
          <div className="text-sm font-medium">
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1 opacity-50">/</span>
            <span className="opacity-70">{formatTime(duration)}</span>
          </div>

          {/* 音量 */}
          <div className="group flex items-center gap-2">
            <button 
              onClick={onToggleMute}
              className="rounded-full p-2 hover:bg-white/20 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-0 overflow-hidden transition-all duration-300 group-hover:w-24">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 标题 */}
          {title && (
            <div className="hidden text-sm font-medium opacity-80 md:block">
              {title}
            </div>
          )}

          {/* 设置 */}
          {showSettings && (
            <button 
              onClick={onOpenSettings}
              className="rounded-full p-2 hover:bg-white/20 transition-colors"
              title="资源设置"
            >
              <Settings size={20} />
            </button>
          )}

          {/* 全屏 */}
          <button 
            onClick={onToggleFullscreen}
            className="rounded-full p-2 hover:bg-white/20 transition-colors"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

