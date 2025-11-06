/**
 * 埋点系统核心类
 * Analytics Core SDK
 */

import {
  EventType,
  EventPriority,
  type AnalyticsConfig,
  type AnalyticsEvent,
  type BaseEvent,
  type AnalyticsStorageAdapter,
  type AnalyticsNetworkAdapter,
  type AnalyticsDeviceAdapter,
  type DeviceInfo,
} from '../types';
import { EventQueue } from './EventQueue';
import { Uploader } from './Uploader';

const SDK_VERSION = '1.0.0';

export class Analytics {
  private config: Required<AnalyticsConfig>;
  private eventQueue: EventQueue;
  private uploader: Uploader;
  private storageAdapter: AnalyticsStorageAdapter;
  private networkAdapter: AnalyticsNetworkAdapter;
  private deviceAdapter: AnalyticsDeviceAdapter;

  private sessionId: string = '';
  private deviceId: string = '';
  private deviceInfo: DeviceInfo | null = null;
  private initialized = false;
  private batchTimer: any = null;

  constructor(
    config: Omit<AnalyticsConfig, 'endpoint'> & {
      adapter?: {
        storage: AnalyticsStorageAdapter;
        network: AnalyticsNetworkAdapter;
        device: AnalyticsDeviceAdapter;
      };
      platform?: string;
      serverUrl?: string;
      endpoint?: string;
    },
    storageAdapter?: AnalyticsStorageAdapter,
    networkAdapter?: AnalyticsNetworkAdapter,
    deviceAdapter?: AnalyticsDeviceAdapter
  ) {
    // 支持两种初始化方式：
    // 1. 新方式：传入包含 adapter 的 config 对象
    // 2. 旧方式：分别传入四个参数
    if (config.adapter) {
      this.storageAdapter = config.adapter.storage;
      this.networkAdapter = config.adapter.network;
      this.deviceAdapter = config.adapter.device;
    } else if (storageAdapter && networkAdapter && deviceAdapter) {
      this.storageAdapter = storageAdapter;
      this.networkAdapter = networkAdapter;
      this.deviceAdapter = deviceAdapter;
    } else {
      throw new Error('Analytics initialization failed: adapter is required');
    }

    // 合并默认配置
    const serverUrl = (config as any).serverUrl || config.endpoint || '/api/analytics/events';
    const platform = (config as any).platform || 'web';

    this.config = {
      ...config,
      appId: config.appId,
      appVersion: config.appVersion || '1.0.0',
      platform: platform,
      endpoint: serverUrl,
      batchSize: config.batchSize ?? 10,
      batchInterval: config.batchInterval ?? 5000,
      maxQueueSize: config.maxQueueSize ?? 100,
      retryTimes: config.retryTimes ?? 3,
      retryInterval: config.retryInterval ?? 1000,
      enableAutoPageView: config.enableAutoPageView ?? true,
      enableAutoClick: config.enableAutoClick ?? false,
      enableAutoError: config.enableAutoError ?? true,
      enableAutoPerformance: config.enableAutoPerformance ?? true,
      debug: config.debug ?? false,
      ignoreUrls: config.ignoreUrls ?? [],
      ignoreErrors: config.ignoreErrors ?? [],
      beforeSend: config.beforeSend,
    } as Required<AnalyticsConfig>;

    this.eventQueue = new EventQueue(this.config.maxQueueSize);
    this.uploader = new Uploader({
      endpoint: this.config.endpoint,
      batchSize: this.config.batchSize,
      retryTimes: this.config.retryTimes,
      retryInterval: this.config.retryInterval,
      networkAdapter: this.networkAdapter,
      storageAdapter: this.storageAdapter,
      onSuccess: (events) => this.onUploadSuccess(events),
      onError: (error, events) => this.onUploadError(error, events),
    });

    // 自动初始化
    this.init().catch((error) => {
      console.error('Failed to initialize Analytics:', error);
    });
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    if (this.initialized) {
      this.log('Analytics already initialized');
      return;
    }

    try {
      // 初始化设备信息
      await this.initDeviceInfo();

      // 初始化会话
      await this.initSession();

      // 上传缓存的事件
      await this.uploader.uploadCachedEvents();

      // 启动批量上传定时器
      this.startBatchTimer();

      // 监听调试配置变化
      if (typeof window !== 'undefined') {
        window.addEventListener('analytics-debug-changed', ((e: CustomEvent) => {
          this.log(`Debug mode changed: ${e.detail.enabled ? 'enabled' : 'disabled'}`);
        }) as EventListener);
      }

      this.initialized = true;
      this.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      throw error;
    }
  }

  /**
   * 追踪事件（简化版本，支持两种调用方式）
   */
  track(
    eventNameOrType: string | EventType,
    propertiesOrName?: Record<string, any> | string,
    maybeProperties?: Record<string, any>,
    priority: EventPriority = EventPriority.NORMAL
  ): void {
    if (!this.initialized) {
      console.warn('Analytics not initialized yet, queuing event...');
      // 可以选择在初始化后重试
      setTimeout(
        () => this.track(eventNameOrType, propertiesOrName, maybeProperties, priority),
        100
      );
      return;
    }

    let eventType: EventType;
    let eventName: string;
    let properties: Record<string, any> | undefined;

    // 支持两种调用方式：
    // 1. track(eventName, properties) - 简化版
    // 2. track(eventType, eventName, properties, priority) - 完整版
    if (typeof propertiesOrName === 'string') {
      // 完整版调用
      eventType = eventNameOrType as EventType;
      eventName = propertiesOrName;
      properties = maybeProperties;
    } else {
      // 简化版调用
      eventType = EventType.CUSTOM;
      eventName = eventNameOrType as string;
      properties = propertiesOrName;
    }

    const event = this.createEvent(eventType, eventName, properties, priority);

    // beforeSend 钩子
    const processedEvent = this.config.beforeSend?.(event) ?? event;
    if (!processedEvent) {
      this.log('Event filtered by beforeSend hook', event);
      return;
    }

    // 添加到队列
    this.eventQueue.enqueue(processedEvent);
    this.log('Event tracked', processedEvent);

    // 高优先级事件立即上传
    if (priority >= EventPriority.HIGH) {
      this.flushHighPriority();
    }

    // 队列满了自动上传
    if (this.eventQueue.isFull()) {
      this.flush();
    }
  }

  /**
   * 追踪页面浏览
   */
  trackPageView(pageUrl: string, pageTitle: string, properties?: Record<string, any>): void {
    this.track(
      EventType.PAGE_VIEW,
      'page_view',
      {
        page_url: pageUrl,
        page_title: pageTitle,
        ...properties,
      },
      EventPriority.NORMAL
    );
  }

  /**
   * 追踪点击事件
   */
  trackClick(
    elementInfo: {
      elementId?: string;
      elementClass?: string;
      elementText?: string;
      elementType?: string;
      position?: { x: number; y: number };
    },
    properties?: Record<string, any>
  ): void {
    this.track(
      EventType.CLICK,
      'click',
      {
        ...elementInfo,
        ...properties,
      },
      EventPriority.LOW
    );
  }

  /**
   * 追踪错误
   */
  trackError(
    errorMessage: string,
    errorStack?: string,
    errorType?: string,
    properties?: Record<string, any>
  ): void {
    this.track(
      EventType.ERROR,
      'error',
      {
        error_message: errorMessage,
        error_stack: errorStack,
        error_type: errorType,
        ...properties,
      },
      EventPriority.HIGH
    );
  }

  /**
   * 追踪性能指标
   */
  trackPerformance(
    metricName: string,
    metricValue: number,
    metricUnit?: string,
    properties?: Record<string, any>
  ): void {
    this.track(
      EventType.PERFORMANCE,
      'performance',
      {
        metric_name: metricName,
        metric_value: metricValue,
        metric_unit: metricUnit,
        ...properties,
      },
      EventPriority.LOW
    );
  }

  /**
   * 追踪 API 调用
   */
  trackApiCall(
    apiUrl: string,
    apiMethod: string,
    apiStatus: number,
    duration: number,
    success: boolean,
    properties?: Record<string, any>
  ): void {
    this.track(
      EventType.API_CALL,
      'api_call',
      {
        api_url: apiUrl,
        api_method: apiMethod,
        api_status: apiStatus,
        duration,
        success,
        ...properties,
      },
      EventPriority.NORMAL
    );
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.config.userId = userId;
    this.log('User ID set', userId);
  }

  /**
   * 设置用户信息（包括用户ID和其他属性）
   */
  setUser(userInfo: { userId: string; [key: string]: any }): void {
    const { userId, ...otherProps } = userInfo;
    this.config.userId = userId;
    this.config.customProperties = {
      ...this.config.customProperties,
      ...otherProps,
    };
    this.log('User info set', userInfo);
  }

  /**
   * 设置自定义属性
   */
  setCustomProperties(properties: Record<string, any>): void {
    this.config.customProperties = {
      ...this.config.customProperties,
      ...properties,
    };
    this.log('Custom properties set', properties);
  }

  /**
   * 立即上传所有事件
   */
  async flush(): Promise<void> {
    if (this.eventQueue.isEmpty()) {
      return;
    }

    const events = this.eventQueue.dequeueAll();
    await this.uploader.upload(events);
  }

  /**
   * 立即上传高优先级事件
   */
  private async flushHighPriority(): Promise<void> {
    const highPriorityEvents = this.eventQueue.getHighPriorityEvents();

    if (highPriorityEvents.length > 0) {
      await this.uploader.upload(highPriorityEvents);
    }
  }

  /**
   * 销毁实例
   */
  async destroy(): Promise<void> {
    // 停止定时器
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // 上传剩余事件
    await this.flush();

    this.initialized = false;
    this.log('Analytics destroyed');
  }

  /**
   * 创建事件对象
   */
  private createEvent(
    eventType: EventType,
    eventName: string,
    properties?: Record<string, any>,
    priority: EventPriority = EventPriority.NORMAL
  ): BaseEvent {
    // 获取当前页面信息（仅在浏览器环境）
    let pageUrl: string | undefined;
    let pageTitle: string | undefined;
    let referrer: string | undefined;

    if (typeof window !== 'undefined') {
      pageUrl = window.location.href;
      pageTitle = document.title;
      referrer = document.referrer || undefined;
    }

    return {
      event_id: this.generateEventId(),
      event_type: eventType,
      event_name: eventName,
      timestamp: Date.now(),
      priority,
      user_id: this.config.userId,
      session_id: this.sessionId,
      device_id: this.deviceId,
      page_url: pageUrl,
      page_title: pageTitle,
      referrer: referrer,
      properties: {
        ...this.config.customProperties,
        ...properties,
      },
      platform: this.getPlatform(),
      app_version: this.config.appVersion,
      sdk_version: SDK_VERSION,
    };
  }

  /**
   * 初始化设备信息
   */
  private async initDeviceInfo(): Promise<void> {
    try {
      // 尝试从缓存获取
      let cachedDeviceInfo = await this.storageAdapter.getDeviceInfo();

      if (!cachedDeviceInfo) {
        // 生成新的设备信息
        this.deviceInfo = await this.deviceAdapter.getDeviceInfo();
        this.deviceId = await this.deviceAdapter.generateDeviceId();

        // 保存到缓存
        await this.storageAdapter.saveDeviceInfo(this.deviceInfo);
      } else {
        this.deviceInfo = cachedDeviceInfo;
        this.deviceId = cachedDeviceInfo.device_id;
      }
    } catch (error) {
      console.error('Failed to init device info:', error);
      // 使用临时ID
      this.deviceId = `temp_${Date.now()}_${Math.random()}`;
    }
  }

  /**
   * 初始化会话
   */
  private async initSession(): Promise<void> {
    try {
      // 尝试从缓存获取
      const cachedSessionId = await this.storageAdapter.getSessionId();

      if (cachedSessionId) {
        this.sessionId = cachedSessionId;
      } else {
        // 生成新会话
        this.sessionId = this.generateSessionId();
        await this.storageAdapter.saveSessionId(this.sessionId);
      }
    } catch (error) {
      console.error('Failed to init session:', error);
      this.sessionId = this.generateSessionId();
    }
  }

  /**
   * 启动批量上传定时器
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (!this.eventQueue.isEmpty()) {
        this.flush();
      }

      // 重试失败的上传
      this.uploader.retryFailedUploads();
    }, this.config.batchInterval);
  }

  /**
   * 上传成功回调
   */
  private onUploadSuccess(events: AnalyticsEvent[]): void {
    this.log('Events uploaded successfully', events);
  }

  /**
   * 上传失败回调
   */
  private onUploadError(error: Error, events: AnalyticsEvent[]): void {
    this.log('Failed to upload events', { error, events });
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 获取平台标识
   */
  private getPlatform(): string {
    return this.config.platform || 'unknown';
  }

  /**
   * 日志输出
   */
  private log(message: string, data?: any): void {
    // 检查动态调试配置（优先级高于初始化时的 debug 配置）
    const dynamicDebug =
      typeof window !== 'undefined' ? localStorage.getItem('analytics-debug') === 'true' : false;

    if (this.config.debug || dynamicDebug) {
      console.log(`[Analytics] ${message}`, data ?? '');
    }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    size: number;
    isFull: boolean;
    isEmpty: boolean;
  } {
    return {
      size: this.eventQueue.size(),
      isFull: this.eventQueue.isFull(),
      isEmpty: this.eventQueue.isEmpty(),
    };
  }

  /**
   * 获取初始化状态
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
