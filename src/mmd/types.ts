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
  stageModelPath?: string | string[];
  /** 舞台/场景动作路径 (.vmd) - 可选 */
  stageMotionPath?: string;
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
  
  /** 渲染特效模式 (默认 'default') */
  renderEffect?: 'default' | 'outline';
  /** 描边效果配置 */
  outlineOptions?: OutlineOptions;
  /** 
   * FX效果文件路径 (.fx文件，MME格式)
   * 注意：
   * - .fx 文件用于模型级效果（应用到人物模型）
   * - .x 文件用于场景级渲染（渲染整个环境，包括模型）
   * 如需同时使用多个效果，请使用 fxConfigs
   */
  fxPath?: string;
  /** FX纹理基础路径 */
  fxTexturePath?: string;
  /** 
   * 多个FX效果配置（高级用法）
   * 支持同时应用多个.fx和.x文件
   */
  fxConfigs?: Array<{
    path: string;
    texturePath?: string;
    type?: 'fx' | 'x' | 'auto';
    priority?: number;
    target?: 'all' | 'model' | 'stage' | 'scene' | string[];
    description?: string;
  }>;
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

/** 描边效果配置 */
export interface OutlineOptions {
  /** 是否启用描边 (默认 false) */
  enabled?: boolean;
  /** 描边粗细 (默认 0.003) */
  thickness?: number;
  /** 描边颜色 (默认 '#000000') */
  color?: string;
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
  /** 重置相机到初始位置 */
  resetCamera: () => void;
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
  
  /** 调试与辅助 */
  showAxes?: boolean; // 是否显示坐标轴
  
  /** 渲染特效配置 */
  renderEffect?: 'default' | 'outline';
  /** 描边效果配置 */
  outlineOptions?: OutlineOptions;
  /** FX效果文件路径 */
  fxPath?: string;
  /** FX纹理基础路径 */
  fxTexturePath?: string;
  /** 多个FX效果配置（高级用法） */
  fxConfigs?: Array<{
    path: string;
    texturePath?: string;
    type?: 'fx' | 'x' | 'auto';
    priority?: number;
    target?: 'all' | 'model' | 'stage' | 'scene' | string[];
    description?: string;
  }>;
  
  /** 事件回调 */
  onLoad?: () => void;
  onLoadProgress?: (progress: number, item: string) => void;
  onError?: (error: Error) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onCameraChange?: (isManual: boolean) => void;
  
  /** 样式 */
  className?: string;
  style?: React.CSSProperties;
}

/** 增强播放器属性 */
export interface MMDPlayerEnhancedProps extends Omit<MMDPlayerBaseProps, 'resources'> {
  /** 单一资源模式 */
  resources?: MMDResources;
  /** 列表模式资源 */
  resourcesList?: MMDResourceItem[];
  /** 自由组合模式选项 */
  resourceOptions?: MMDResourceOptions;
  
  /** 列表模式下的默认 ID */
  defaultResourceId?: string;
  /** 自由组合模式下的默认选择 */
  defaultSelection?: {
    modelId?: string;
    motionId?: string;
    cameraId?: string;
    audioId?: string;
    stageId?: string;
  };
  
  /** 是否显示调试信息面板 */
  showDebugInfo?: boolean;
}

/** 播放列表节点 */
export interface MMDPlaylistNode {
  id: string;
  name: string;
  resources: MMDResources;
  /** 节点特定的舞台配置（可选，覆盖全局配置） */
  stage?: MMDStage;
  /** 该节点是否循环播放 */
  loop?: boolean;
  /** 预计时长（秒）- 用于进度计算 */
  duration?: number;
  /** 缩略图 */
  thumbnail?: string;
}

/** 播放列表配置 */
export interface MMDPlaylistConfig {
  id: string;
  name: string;
  nodes: MMDPlaylistNode[];
  /** 整个播放列表是否循环 */
  loop?: boolean;
  /** 预加载策略
   * - 'none': 不预加载 (默认)
   * - 'next': 预加载下一个节点
   * - 'all': 预加载所有节点
   */
  preload?: 'none' | 'next' | 'all';
  /** 是否自动播放 */
  autoPlay?: boolean;
}

/** 播放列表组件属性 */
export interface MMDPlaylistProps {
  /** 播放列表配置 */
  playlist: MMDPlaylistConfig;
  /** 舞台配置 */
  stage?: MMDStage;
  /** 移动端优化配置 */
  mobileOptimization?: MobileOptimization;
  
  /** 事件回调 */
  onNodeChange?: (node: MMDPlaylistNode, index: number) => void;
  onPlaylistComplete?: () => void;
  onError?: (error: Error) => void;
  
  /** 是否显示调试信息面板 */
  showDebugInfo?: boolean;
  
  /** 样式 */
  className?: string;
  style?: React.CSSProperties;
}

