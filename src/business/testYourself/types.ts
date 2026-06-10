/**
 * 测测你是什么 - 类型定义
 * Test Yourself Game - Type Definitions
 */

/**
 * 测试结果项
 */
export interface TestResult {
  /** 唯一标识 */
  id: string;
  /** 标题/题目 */
  title: string;
  /** 描述 */
  description: string;
  /** 图片URL或emoji */
  image: string;
  /** 图片类型 */
  imageType?: 'url' | 'emoji';
  /** 额外属性（可扩展） */
  extra?: Record<string, any>;
}

/**
 * 测试配置
 */
export interface TestConfig {
  /** 游戏标题 */
  gameTitle: string;
  /** 游戏描述 */
  gameDescription?: string;
  /** 按钮文本 */
  buttonText?: string;
  /** 长按时间（毫秒） */
  longPressDuration?: number;
  /** 结果数据集 */
  results: TestResult[];
  /** 是否启用IP获取 */
  enableIPFetch?: boolean;
  /** 自定义盐值 */
  customSalt?: string;
  /** 结果展示样式 */
  resultStyle?: 'card' | 'full' | 'minimal';
}

/**
 * 设备指纹信息
 */
export interface DeviceFingerprint {
  /** User Agent */
  userAgent: string;
  /** IP地址（如果可获取） */
  ip?: string;
  /** 屏幕分辨率 */
  screenResolution: string;
  /** 时区 */
  timezone: string;
  /** 语言 */
  language: string;
  /** 平台 */
  platform: string;
  /** 颜色深度 */
  colorDepth?: number;
  /** 像素比 */
  devicePixelRatio?: number;
  /** 硬件并发数 */
  hardwareConcurrency?: number;
  /** 最大触摸点数 */
  maxTouchPoints?: number;
  /** Canvas指纹 */
  canvasFingerprint?: string;
  /** WebGL指纹 */
  webglFingerprint?: string;
  /** 字体列表 */
  fonts?: string;
  /** 是否支持cookie */
  cookieEnabled?: boolean;
  /** 是否支持本地存储 */
  localStorageEnabled?: boolean;
  /** 是否支持会话存储 */
  sessionStorageEnabled?: boolean;
  /** 是否支持IndexedDB */
  indexedDBEnabled?: boolean;
}

/**
 * 测试状态
 */
export type TestStatus = 'idle' | 'pressing' | 'completed';

/**
 * 组件属性
 */
export interface TestYourselfProps {
  /** 配置 */
  config?: TestConfig;
  /** 配置ID (通过 query 参数指定) */
  configId?: string;
  /** 结果回调 */
  onResult?: (result: TestResult) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 保存的配置项
 */
export interface SavedConfig {
  /** 配置唯一ID */
  id: string;
  /** 配置名称 */
  name: string;
  /** 配置描述 */
  description?: string;
  /** 测试配置 */
  config: TestConfig;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 是否为默认配置 */
  isDefault?: boolean;
}

/**
 * 图片上传结果
 */
export interface UploadResult {
  /** 图片 URL 或 Base64 */
  url: string;
  /** 文件名 */
  filename: string;
  /** 文件大小(字节) */
  size: number;
  /** 图片类型 */
  type: string;
}

/**
 * 配置列表项
 */
export interface ConfigListItem {
  id: string;
  name: string;
  description?: string;
  resultCount: number;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}




