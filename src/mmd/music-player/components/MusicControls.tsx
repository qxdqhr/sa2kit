import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Repeat1, 
  Shuffle,
  Volume2,
  VolumeX,
  ListMusic
} from 'lucide-react';

export interface MusicControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopMode: 'list' | 'single' | 'shuffle';
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onToggleLoop: () => void;
  onTogglePlaylist: () => void;
  className?: string;
}

export const MusicControls: React.FC<MusicControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  loopMode,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleLoop,
  onTogglePlaylist,
  className = '',
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`w-full max-w-4xl mx-auto px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl pointer-events-auto transition-all group ${className}`}
    >
      {/* 进度条 */}
      <div className="relative w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group/progress overflow-hidden">
        <div 
          className="absolute h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between">
        {/* 时间显示 */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/60 w-32">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* 主控制按钮 */}
        <div className="flex items-center gap-6">
          <button 
            onClick={onPrevious}
            className="text-white/80 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button 
            onClick={onPlayPause}
            className="w-12 h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          <button 
            onClick={onNext}
            className="text-white/80 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>

        {/* 附加功能按钮 */}
        <div className="flex items-center gap-4 w-32 justify-end">
          <button 
            onClick={onToggleLoop}
            className="text-white/60 hover:text-white transition-colors"
            title={loopMode}
          >
            {loopMode === 'list' && <Repeat className="w-5 h-5" />}
            {loopMode === 'single' && <Repeat1 className="w-5 h-5 text-blue-400" />}
            {loopMode === 'shuffle' && <Shuffle className="w-5 h-5 text-orange-400" />}
          </button>

          <button 
            onClick={onTogglePlaylist}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

