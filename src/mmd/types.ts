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
 * MMD 资源选项（用于下拉框选择）
 */
export interface MMDResourceOption {
  /** 选项 ID */
  id: string;
  /** 选项名称 */
  name: string;
  /** 资源路径 */
  path: string;
}

/**
 * MMD 播放列表节点
 * 代表一个完整的 MMD 播放配置（模型+动作+音乐+相机+场景+背景）
 */
export interface MMDPlaylistNode {
  /** 节点 ID */
  id: string;
  /** 节点名称 */
  name: string;
  /** 节点描述（可选） */
  description?: string;
  /** 资源配置 */
  resources: MMDResources;
  /** 是否循环播放当前节点（默认 false） */
  loop?: boolean;
}

/**
 * MMD 播放列表配置
 */
export interface MMDPlaylistConfig {
  /** 播放列表 ID */
  id: string;
  /** 播放列表名称 */
  name: string;
  /** 播放列表描述（可选） */
  description?: string;
  /** 播放节点列表 */
  nodes: MMDPlaylistNode[];
  /** 是否循环播放整个列表（默认 false） */
  loop?: boolean;
  /** 是否自动播放（默认 true） */
  autoPlay?: boolean;
}

/**
 * MMD 资源选项列表（用于独立选择模型、动作、音乐、相机等）
 */
export interface MMDResourceOptions {
  /** 模型选项列表 */
  models?: MMDResourceOption[];
  /** 动作选项列表 */
  motions?: MMDResourceOption[];
  /** 音频选项列表 */
  audios?: MMDResourceOption[];
  /** 相机选项列表 */
  cameras?: MMDResourceOption[];
  /** 场景模型选项列表 */
  stageModels?: MMDResourceOption[];
  /** 背景图片选项列表 */
  backgrounds?: MMDResourceOption[];
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
 * MMD 播放列表组件属性
 */
export interface MMDPlaylistProps {
  /** 播放列表配置 */
  playlist: MMDPlaylistConfig;
  /** 舞台配置 */
  stage?: MMDStage;
  /** 默认播放的节点索引（默认 0） */
  defaultNodeIndex?: number;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 资源加载完成回调 */
  onLoad?: () => void;
  /** 资源加载错误回调 */
  onError?: (error: any) => void;
  /** 节点切换回调 */
  onNodeChange?: (nodeIndex: number, node: MMDPlaylistNode) => void;
  /** 播放列表完成回调 */
  onPlaylistComplete?: () => void;
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
  /** MMD资源选项列表（用于下拉框独立选择），如果提供则显示设置按钮 */
  resourceOptions?: MMDResourceOptions;
  /** 默认选中的资源（当使用 resourceOptions 时） */
  defaultSelection?: {
    modelId?: string;
    motionId?: string;
    audioId?: string;
    cameraId?: string;
    stageModelId?: string;
    backgroundId?: string;
  };
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
  /** 资源切换回调（resourcesList 模式） */
  onResourceChange?: (resourceId: string) => void;
  /** 资源选择回调（resourceOptions 模式） */
  onSelectionChange?: (selection: {
    modelId?: string;
    motionId?: string;
    audioId?: string;
    cameraId?: string;
    stageModelId?: string;
    backgroundId?: string;
  }) => void;
  /** 音频播放结束回调 */
  onAudioEnded?: () => void;
}

/**
 * MMD 播放器属性（联合类型）
 */
export type MMDPlayerProps = MMDPlayerBaseProps | MMDPlayerEnhancedProps;
