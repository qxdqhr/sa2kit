import { MMDResources, MMDStage, MobileOptimization } from '../types';

/** 音乐曲目配置 */
export interface MusicTrack {
  /** 唯一标识 */
  id: string;
  /** 歌曲名称 */
  title: string;
  /** 艺术家/歌手 */
  artist?: string;
  /** 封面图 URL */
  coverUrl?: string;
  /** MMD 资源（模型、动作、音频等） */
  resources: MMDResources;
  /** 曲目特定的舞台配置（可选，覆盖全局配置） */
  stage?: MMDStage;
  /** 预计时长（秒） */
  duration?: number;
}

/** 音乐播放器配置 */
export interface MMDMusicPlayerConfig {
  /** 播放列表名称 */
  name: string;
  /** 曲目列表 */
  tracks: MusicTrack[];
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 默认循环模式 */
  defaultLoopMode?: 'list' | 'single' | 'shuffle';
}

/** 音乐播放器组件属性 */
export interface MMDMusicPlayerProps {
  /** 播放配置 */
  config: MMDMusicPlayerConfig;
  /** 舞台配置 */
  stage?: MMDStage;
  /** 移动端优化配置 */
  mobileOptimization?: MobileOptimization;
  
  /** 初始曲目索引 */
  initialTrackIndex?: number;
  
  /** 事件回调 */
  onTrackChange?: (track: MusicTrack, index: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onError?: (error: Error) => void;
  
  /** 样式 */
  className?: string;
  style?: React.CSSProperties;
}

/** 音乐播放器 Ref 接口 */
export interface MMDMusicPlayerRef {
  /** 播放 */
  play: () => void;
  /** 暂停 */
  pause: () => void;
  /** 跳转到下一曲 */
  next: () => void;
  /** 跳转到上一曲 */
  previous: () => void;
  /** 跳转到指定曲目 */
  goToTrack: (index: number) => void;
  /** 设置循环模式 */
  setLoopMode: (mode: 'list' | 'single' | 'shuffle') => void;
  /** 获取当前状态 */
  getState: () => {
    currentIndex: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    loopMode: 'list' | 'single' | 'shuffle';
  };
}

