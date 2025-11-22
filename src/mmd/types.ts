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
  /** 
   * 场景模型路径 (.pmx/.pmd)
   * 通常是静态的 3D 场景模型，如教室、舞台等
   */
  stageModelPath?: string;
  /**
   * 背景图片路径
   * 支持 jpg/png 等图片格式，将作为 360度背景 (Equirectangular) 或固定背景
   */
  backgroundPath?: string;
}

/**
 * MMD 资源配置项（用于动态切换）
 */
export interface MMDResourceItem {
  /** 配置项 ID */
  id: string;
  /** 配置项名称 */
  name: string;
  /** 资源配置 */
  resources: MMDResources;
}

/**
 * MMD 舞台配置
 */
export interface MMDStage {
  /** 背景色 */
  backgroundColor?: string;
  /** 
   * 背景类型
   * 'color': 纯色背景 (默认)
   * 'image': 固定背景图片 (backgroundPath)
   * 'skybox': 360度全景图 (backgroundPath)
   * @default 'color'
   */
  backgroundType?: 'color' | 'image' | 'skybox';
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
  /** MMD资源配置（单个） */
  resources?: MMDResources;
  /** MMD资源配置列表（用于动态切换），如果提供则显示设置按钮 */
  resourcesList?: MMDResourceItem[];
  /** 默认选中的资源ID（当使用 resourcesList 时） */
  defaultResourceId?: string;
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
  /** 资源切换回调 */
  onResourceChange?: (resourceId: string) => void;
}

/**
 * MMD 播放器属性（联合类型）
 */
export type MMDPlayerProps = MMDPlayerBaseProps | MMDPlayerEnhancedProps;
