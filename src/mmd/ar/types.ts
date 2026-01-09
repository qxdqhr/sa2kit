import { MMDResources, MMDStage, MobileOptimization } from '../types';

/**
 * AR 模式枚举
 */
export enum ARMode {
  /** 
   * 叠加模式 - 模型固定在屏幕上，跟随屏幕移动
   * 特点：简单易用，不需要陀螺仪权限
   */
  Overlay = 'overlay',
  
  /**
   * 世界固定模式 - 真正的 AR 体验
   * 特点：模型固定在世界空间，移动设备时模型保持原位
   * 需要：设备陀螺仪/加速度计权限
   */
  WorldFixed = 'world-fixed',
}

/** 预设模型配置 */
export interface ModelPreset {
  /** 预设ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 缩略图URL */
  thumbnail?: string;
  /** 模型路径 (.pmx) */
  modelPath: string;
}

/** 预设动作配置 */
export interface MotionPreset {
  /** 预设ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 动作路径 (.vmd) */
  motionPath: string;
}

/** 预设音乐配置 */
export interface AudioPreset {
  /** 预设ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 音乐路径 */
  audioPath: string;
}

export interface MMDARPlayerProps {
  /** 舞台配置 */
  stage?: MMDStage;
  /** 移动端优化配置 */
  mobileOptimization?: MobileOptimization;
  
  /** 摄像头配置 */
  cameraConfig?: {
    /** 偏好使用的摄像头 ('user' 为前置, 'environment' 为后置) */
    facingMode?: 'user' | 'environment';
    /** 视频分辨率 */
    width?: number | { min?: number; ideal?: number; max?: number };
    height?: number | { min?: number; ideal?: number; max?: number };
  };

  /** 是否开启镜像显示 (通常前置摄像头需要开启) */
  mirrored?: boolean;

  /** 是否显示设置按钮 */
  showSettings?: boolean;
  
  /** 预设模型列表 */
  modelPresets: ModelPreset[];
  
  /** 预设动作列表 */
  motionPresets: MotionPreset[];
  
  /** 预设音乐列表 (可选) */
  audioPresets?: AudioPreset[];
  
  /** 默认模型ID */
  defaultModelId?: string;
  
  /** 默认动作ID */
  defaultMotionId?: string;
  
  /** 默认音乐ID (可选) */
  defaultAudioId?: string;
  
  /** 初始时是否显示模型 (false 则需要点击放置) */
  initialModelVisible?: boolean;
  
  /** 放置按钮文案 */
  placementText?: string;
  
  /** AR 模式 (默认 Overlay) */
  arMode?: ARMode;
  
  /** 默认 AR 模式 */
  defaultARMode?: ARMode;
  
  /** 播放控制 */
  autoPlay?: boolean;
  loop?: boolean;
  
  /** 事件回调 */
  onCameraReady?: (stream: MediaStream) => void;
  onCameraError?: (error: Error) => void;
  onResourcesChange?: (resources: MMDResources) => void;
  onModelPlaced?: () => void;
  onARModeChange?: (mode: ARMode) => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  
  /** 样式 */
  className?: string;
  style?: React.CSSProperties;
}

export interface MMDARPlayerRef {
  /** 开启摄像头 */
  startCamera: () => Promise<void>;
  /** 关闭摄像头 */
  stopCamera: () => void;
  /** 切换摄像头 */
  switchCamera: () => Promise<void>;
  /** 截图 (包含视频背景和模型) */
  snapshot: () => Promise<string>;
  /** 放置模型 */
  placeModel: () => void;
  /** 移除模型（重置位置） */
  removeModel: () => void;
  /** 切换模型 */
  switchModel: (resources: MMDResources) => void;
  /** 切换 AR 模式 */
  setARMode: (mode: ARMode) => void;
  /** 获取当前 AR 模式 */
  getARMode: () => ARMode;
}
