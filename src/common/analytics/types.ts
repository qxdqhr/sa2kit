/**
 * 埋点系统类型定义
 * Analytics System Type Definitions
 */

/**
 * 事件类型枚举
 */
export enum EventType {
  // 页面事件
  PAGE_VIEW = 'page_view',
  PAGE_LEAVE = 'page_leave',

  // 用户行为事件
  CLICK = 'click',
  SCROLL = 'scroll',
  INPUT = 'input',
  SUBMIT = 'submit',

  // 业务事件
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  SEARCH = 'search',
  SHARE = 'share',

  // 性能事件
  PERFORMANCE = 'performance',
  ERROR = 'error',
  API_CALL = 'api_call',

  // 自定义事件
  CUSTOM = 'custom',
}

/**
 * 事件优先级
 */
export enum EventPriority {
  LOW = 0, // 低优先级，可延迟上报
  NORMAL = 1, // 普通优先级，批量上报
  HIGH = 2, // 高优先级，实时上报
  CRITICAL = 3, // 关键事件，立即上报
}

/**
 * 基础事件数据接口
 */
export interface BaseEvent {
  // 基本信息
  event_id: string; // 事件唯一ID
  event_type: EventType; // 事件类型
  event_name: string; // 事件名称
  timestamp: number; // 事件时间戳
  priority: EventPriority; // 事件优先级

  // 用户信息
  user_id?: string; // 用户ID
  session_id: string; // 会话ID
  device_id: string; // 设备ID

  // 页面信息
  page_url?: string; // 页面URL
  page_title?: string; // 页面标题
  referrer?: string; // 来源页面

  // 自定义属性
  properties?: Record<string, any>;

  // 系统信息
  platform: string; // 平台：web/mobile/desktop/miniapp
  app_version: string; // 应用版本
  sdk_version: string; // SDK版本
}

/**
 * 页面浏览事件
 */
export interface PageViewEvent extends BaseEvent {
  event_type: EventType.PAGE_VIEW;
  page_url: string;
  page_title: string;
  duration?: number; // 页面停留时长（ms）
}

/**
 * 点击事件
 */
export interface ClickEvent extends BaseEvent {
  event_type: EventType.CLICK;
  element_id?: string; // 元素ID
  element_class?: string; // 元素类名
  element_text?: string; // 元素文本
  element_type?: string; // 元素类型
  position?: {
    // 点击位置
    x: number;
    y: number;
  };
}

/**
 * 错误事件
 */
export interface ErrorEvent extends BaseEvent {
  event_type: EventType.ERROR;
  error_message: string; // 错误信息
  error_stack?: string; // 错误堆栈
  error_type?: string; // 错误类型
  error_level?: 'warning' | 'error' | 'fatal';
}

/**
 * 性能事件
 */
export interface PerformanceEvent extends BaseEvent {
  event_type: EventType.PERFORMANCE;
  metric_name: string; // 指标名称
  metric_value: number; // 指标值
  metric_unit?: string; // 单位
}

/**
 * API调用事件
 */
export interface ApiCallEvent extends BaseEvent {
  event_type: EventType.API_CALL;
  api_url: string; // API地址
  api_method: string; // 请求方法
  api_status?: number; // 响应状态码
  duration?: number; // 请求耗时（ms）
  success: boolean; // 是否成功
}

/**
 * 所有事件类型联合
 */
export type AnalyticsEvent =
  | BaseEvent
  | PageViewEvent
  | ClickEvent
  | ErrorEvent
  | PerformanceEvent
  | ApiCallEvent;

/**
 * 事件上报配置
 */
export interface AnalyticsConfig {
  // 基础配置
  appId: string; // 应用ID
  appVersion: string; // 应用版本
  endpoint: string; // 上报接口地址
  platform?: string; // 平台标识（web/mobile/miniapp/desktop）
  debug?: boolean; // 是否开启调试模式

  // 上报策略
  batchSize?: number; // 批量上报数量（默认10）
  batchInterval?: number; // 批量上报间隔（ms，默认5000）
  maxQueueSize?: number; // 最大队列长度（默认100）
  retryTimes?: number; // 失败重试次数（默认3）
  retryInterval?: number; // 重试间隔（ms，默认1000）

  // 功能开关
  enableAutoPageView?: boolean; // 自动采集页面浏览（默认true）
  enableAutoClick?: boolean; // 自动采集点击事件（默认false）
  enableAutoError?: boolean; // 自动采集错误（默认true）
  enableAutoPerformance?: boolean; // 自动采集性能（默认true）

  // 数据过滤
  ignoreUrls?: string[]; // 忽略的URL列表
  ignoreErrors?: string[]; // 忽略的错误列表
  beforeSend?: (event: AnalyticsEvent) => AnalyticsEvent | null; // 发送前钩子

  // 用户信息
  userId?: string; // 用户ID
  customProperties?: Record<string, any>; // 自定义全局属性
}

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  device_id: string; // 设备唯一ID
  device_model?: string; // 设备型号
  device_brand?: string; // 设备品牌
  os_name: string; // 操作系统名称
  os_version: string; // 操作系统版本
  screen_width: number; // 屏幕宽度
  screen_height: number; // 屏幕高度
  language: string; // 系统语言
  timezone: string; // 时区
  network_type?: string; // 网络类型
  carrier?: string; // 运营商
}

/**
 * 上报响应接口
 */
export interface UploadResponse {
  success: boolean;
  message?: string;
  code?: number;
}

/**
 * 存储适配器接口
 */
export interface AnalyticsStorageAdapter {
  /**
   * 保存事件到本地存储
   */
  saveEvents(events: AnalyticsEvent[]): Promise<void>;

  /**
   * 获取本地存储的事件
   */
  getEvents(): Promise<AnalyticsEvent[]>;

  /**
   * 清除本地存储的事件
   */
  clearEvents(): Promise<void>;

  /**
   * 保存设备信息
   */
  saveDeviceInfo(info: DeviceInfo): Promise<void>;

  /**
   * 获取设备信息
   */
  getDeviceInfo(): Promise<DeviceInfo | null>;

  /**
   * 保存会话ID
   */
  saveSessionId(sessionId: string): Promise<void>;

  /**
   * 获取会话ID
   */
  getSessionId(): Promise<string | null>;
}

/**
 * 网络适配器接口
 */
export interface AnalyticsNetworkAdapter {
  /**
   * 上传事件数据
   */
  upload(url: string, events: AnalyticsEvent[]): Promise<UploadResponse>;

  /**
   * 检查网络连接状态
   */
  isOnline(): Promise<boolean>;
}

/**
 * 设备信息适配器接口
 */
export interface AnalyticsDeviceAdapter {
  /**
   * 获取设备信息
   */
  getDeviceInfo(): Promise<DeviceInfo>;

  /**
   * 生成设备唯一ID
   */
  generateDeviceId(): Promise<string>;
}
