import { MMDResources, MMDStage, MobileOptimization } from '../types';

export interface MMDARPlayerProps {
  /** MMD 资源配置 */
  resources: MMDResources;
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

  /** 是否显示设置按钮 (允许手动输入模型和动作路径) */
  showSettings?: boolean;
  
  /** 播放控制 */
  autoPlay?: boolean;
  loop?: boolean;
  
  /** 事件回调 */
  onCameraReady?: (stream: MediaStream) => void;
  onCameraError?: (error: Error) => void;
  onResourcesChange?: (resources: MMDResources) => void;
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
}

