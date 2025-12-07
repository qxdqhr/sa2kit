import React from 'react';
import { Play, Pause, Maximize, Minimize, Settings, Grid3x3, Repeat, Repeat1, SkipBack, SkipForward } from 'lucide-react';

interface ControlPanelProps {
  isPlaying: boolean;
  isFullscreen: boolean;
  isLooping: boolean; // 是否单节点循环播放
  isListLooping?: boolean; // 是否列表循环（播放列表专用）
  showSettings?: boolean;
  showAxes?: boolean; // 坐标轴是否显示
  showPrevNext?: boolean; // 是否显示上一个/下一个按钮
  title?: string;
  subtitle?: string; // 副标题 (如 "1 / 3")
  
  onPlayPause: () => void;
  onToggleFullscreen: () => void;
  onToggleLoop: () => void; // 切换单节点循环播放
  onToggleListLoop?: () => void; // 切换列表循环
  onToggleAxes?: () => void; // 切换坐标轴显示
  onOpenSettings?: () => void;
  onPrevious?: () => void; // 上一个
  onNext?: () => void; // 下一个
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  isFullscreen,
  isLooping,
  isListLooping,
  showSettings,
  showAxes = false,
  showPrevNext = false,
  title,
  subtitle,
  onPlayPause,
  onToggleFullscreen,
  onToggleLoop,
  onToggleListLoop,
  onToggleAxes,
  onOpenSettings,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 hover:opacity-100">
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          {/* 上一个按钮 */}
          {showPrevNext && onPrevious && (
            <button 
              onClick={onPrevious}
              className="rounded-full p-2 hover:bg-white/20 transition-colors"
              title="上一个"
            >
              <SkipBack size={20} />
            </button>
          )}

          {/* 播放/暂停按钮 */}
          <button 
            onClick={onPlayPause}
            className="rounded-full p-2 hover:bg-white/20 transition-colors"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {/* 下一个按钮 */}
          {showPrevNext && onNext && (
            <button 
              onClick={onNext}
              className="rounded-full p-2 hover:bg-white/20 transition-colors"
              title="下一个"
            >
              <SkipForward size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* 标题和副标题 */}
          {(title || subtitle) && (
            <div className="hidden text-sm font-medium opacity-80 md:block">
              {title}
              {subtitle && <span className="ml-2 text-xs opacity-60">{subtitle}</span>}
            </div>
          )}

          {/* 列表循环切换（仅播放列表模式） */}
          {onToggleListLoop && (
            <button 
              onClick={onToggleListLoop}
              className={`rounded-full p-2 transition-colors ${isListLooping ? 'bg-green-500/30 hover:bg-green-500/50' : 'hover:bg-white/20'}`}
              title={isListLooping ? '列表循环：开启' : '列表循环：关闭'}
            >
              <Repeat size={20} />
            </button>
          )}

          {/* 单节点循环切换 */}
          <button 
            onClick={onToggleLoop}
            className={`rounded-full p-2 transition-colors ${isLooping ? 'bg-blue-500/30 hover:bg-blue-500/50' : 'hover:bg-white/20'}`}
            title={isLooping ? '单曲循环：开启' : '单曲循环：关闭'}
          >
            <Repeat1 size={20} />
          </button>

          {/* 坐标轴切换 */}
          {onToggleAxes && (
            <button 
              onClick={onToggleAxes}
              className={`rounded-full p-2 transition-colors ${showAxes ? 'bg-blue-500/30 hover:bg-blue-500/50' : 'hover:bg-white/20'}`}
              title="显示/隐藏坐标轴"
            >
              <Grid3x3 size={20} />
            </button>
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
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

