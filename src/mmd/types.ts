import { Vector3 } from 'three';

/** MMD 资源配置 */
export interface MMDResources {
  /** 模型文件路径 (.pmx/.pmd) */
  modelPath: string;
  /** 动作文件路径 (.vmd) - 可选 */
  motionPath?: string;
  /** 相机动画路径 (.vmd) - 可选 */
  cameraPath?: string;
  /** 音频文件路径 - 可选 */
  audioPath?: string;
  /** 舞台/场景模型路径 (.pmx/.x) - 可选 */
  stageModelPath?: string;
  /** 附加动作文件 - 可选 */
  additionalMotions?: string[];
}

/** 资源列表项 - 用于预设切换 */
export interface MMDResourceItem {
  id: string;
  name: string;
  resources: MMDResources;
  thumbnail?: string;
  description?: string;
}

/** 资源选项 - 用于自由组合 */
export interface ResourceOption {
  id: string;
  name: string;
  path: string;
  thumbnail?: string;
}

export interface MMDResourceOptions {
  models: ResourceOption[];
  motions: ResourceOption[];
  cameras?: ResourceOption[];
  audios?: ResourceOption[];
  stages?: ResourceOption[];
}

/** 舞台/场景配置 */
export interface MMDStage {
  /** 背景颜色 */
  backgroundColor?: string;
  /** 背景图片 URL */
  backgroundImage?: string;
  /** 是否启用物理模拟 (默认 true) */
  enablePhysics?: boolean;
  /** 物理引擎路径 (ammo.wasm.js 的路径) */
  physicsPath?: string;
  /** 是否启用阴影 (默认 true) */
  enableShadow?: boolean;
  /** 环境光强度 (默认 0.5) */
  ambientLightIntensity?: number;
  /** 方向光强度 (默认 0.8) */
  directionalLightIntensity?: number;
  /** 相机初始位置 */
  cameraPosition?: { x: number; y: number; z: number } | Vector3;
  /** 相机目标点 */
  cameraTarget?: { x: number; y: number; z: number } | Vector3;
}

/** 移动端优化配置 */
export interface MobileOptimization {
  /** 是否启用优化 (默认 true) */
  enabled: boolean;
  /** 像素比 (默认 1.0, 桌面端通常为 window.devicePixelRatio) */
  pixelRatio?: number;
  /** 是否强制关闭物理引擎 (默认 false) */
  disablePhysics?: boolean;
  /** 是否降低阴影质量 (默认 true) */
  reduceShadowQuality?: boolean;
}

/** MMDPlayerBase Ref 接口 */
export interface MMDPlayerBaseRef {
  /** 开始播放 */
  play: () => void;
  /** 暂停播放 */
  pause: () => void;
  /** 停止播放 (重置到开头) */
  stop: () => void;
  /** 跳转到指定时间 (秒) */
  seek: (time: number) => void;
  /** 获取当前播放时间 */
  getCurrentTime: () => number;
  /** 获取总时长 */
  getDuration: () => number;
  /** 获取播放状态 */
  isPlaying: () => boolean;
  /** 截图并返回 Base64 字符串 */
  snapshot: () => string;
}

/** 基础播放器属性 */
export interface MMDPlayerBaseProps {
  /** 资源配置 */
  resources: MMDResources;
  /** 舞台配置 */
  stage?: MMDStage;
  /** 移动端优化配置 */
  mobileOptimization?: MobileOptimization;
  
  /** 播放控制 */
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number; // 0-1
  muted?: boolean;
  
  /** 事件回调 */
  onLoad?: () => void;
  onLoadProgress?: (progress: number, item: string) => void;
  onError?: (error: Error) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  
  /** 样式 */
  className?: string;
  style?: React.CSSProperties;
}

