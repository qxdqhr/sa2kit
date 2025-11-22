/**
 * MMD 资源配置
 */
export interface MMDResources {
  /** 模型路径 */
  modelPath: string;
  /** 动作路径 */
  motionPath?: string;
  /** 相机路径 */
  cameraPath?: string;
  /** 音频路径 */
  audioPath?: string;
}

/**
 * MMD 舞台配置
 */
export interface MMDStage {
  /** 背景色 */
  backgroundColor?: string;
  /** 相机初始位置 */
  cameraPosition?: { x: number; y: number; z: number };
  /** 相机目标位置 */
  cameraTarget?: { x: number; y: number; z: number };
  /** 启用物理引擎 */
  enablePhysics?: boolean;
  /** 启用网格 */
  showGrid?: boolean;
  /** Ammo.js 脚本路径 */
  ammoPath?: string;
  /** Ammo WASM 文件的基础路径 */
  ammoWasmPath?: string;
}

/**
 * 基础 MMD 播放器属性（原始API）
 */
export interface MMDPlayerBaseProps {
  /**
   * URL to the PMX model file
   */
  modelUrl: string;

  /**
   * URL to the VMD motion file for the model
   */
  vmdUrl?: string;

  /**
   * URL to the VMD motion file for the camera
   */
  cameraUrl?: string;

  /**
   * URL to the audio file (wav, mp3)
   */
  audioUrl?: string;

  /**
   * Whether to enable physics simulation (requires Ammo.js)
   * @default true
   */
  physics?: boolean;

  /**
   * Width of the player
   * @default '100%'
   */
  width?: string | number;

  /**
   * Height of the player
   * @default '100%'
   */
  height?: string | number;

  /**
   * Callback when resources are loaded
   */
  onLoad?: () => void;

  /**
   * Callback for loading progress
   */
  onProgress?: (xhr: ProgressEvent) => void;

  /**
   * Callback for loading error
   */
  onError?: (error: unknown) => void;
}

/**
 * 增强版 MMD 播放器属性（支持resources和stage配置）
 */
export interface MMDPlayerEnhancedProps {
  /** MMD资源配置 */
  resources: MMDResources;
  /** 舞台配置 */
  stage?: MMDStage;
  /** 自动播放 */
  autoPlay?: boolean;
  /** 循环播放 */
  loop?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 加载完成回调 */
  onLoad?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * MMD 播放器属性（联合类型）
 */
export type MMDPlayerProps = MMDPlayerBaseProps | MMDPlayerEnhancedProps;

