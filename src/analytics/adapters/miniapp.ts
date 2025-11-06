/**
 * 小程序平台适配器
 * WeChat MiniProgram Platform Adapters
 */

import type {
  AnalyticsStorageAdapter,
  AnalyticsNetworkAdapter,
  AnalyticsDeviceAdapter,
  DeviceInfo,
  AnalyticsEvent,
  UploadResponse,
} from '../types';

/**
 * 小程序存储适配器
 */
export class MiniappStorageAdapter implements AnalyticsStorageAdapter {
  private EVENTS_KEY = 'analytics_events';
  private DEVICE_INFO_KEY = 'analytics_device_info';
  private SESSION_ID_KEY = 'analytics_session_id';

  // 需要注入 Taro 的存储 API
  constructor(
    private storage?: {
      getStorageSync: (key: string) => any;
      setStorageSync: (key: string, data: any) => void;
      removeStorageSync: (key: string) => void;
    }
  ) {}

  async saveEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      if (this.storage) {
        this.storage.setStorageSync(this.EVENTS_KEY, events);
      }
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      if (this.storage) {
        const data = this.storage.getStorageSync(this.EVENTS_KEY);
        return data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async clearEvents(): Promise<void> {
    try {
      if (this.storage) {
        this.storage.removeStorageSync(this.EVENTS_KEY);
      }
    } catch (error) {
      console.error('Failed to clear events:', error);
    }
  }

  async saveDeviceInfo(info: DeviceInfo): Promise<void> {
    try {
      if (this.storage) {
        this.storage.setStorageSync(this.DEVICE_INFO_KEY, info);
      }
    } catch (error) {
      console.error('Failed to save device info:', error);
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      if (this.storage) {
        return this.storage.getStorageSync(this.DEVICE_INFO_KEY) || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }

  async saveSessionId(sessionId: string): Promise<void> {
    try {
      if (this.storage) {
        this.storage.setStorageSync(this.SESSION_ID_KEY, sessionId);
      }
    } catch (error) {
      console.error('Failed to save session ID:', error);
    }
  }

  async getSessionId(): Promise<string | null> {
    try {
      if (this.storage) {
        return this.storage.getStorageSync(this.SESSION_ID_KEY) || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get session ID:', error);
      return null;
    }
  }
}

/**
 * 小程序网络适配器
 */
export class MiniappNetworkAdapter implements AnalyticsNetworkAdapter {
  // 需要注入 Taro 的网络 API
  constructor(
    private request?: {
      request: (options: any) => Promise<any>;
    },
    private netInfo?: {
      getNetworkType: () => Promise<{ networkType: string }>;
    }
  ) {}

  async upload(url: string, events: AnalyticsEvent[]): Promise<UploadResponse> {
    try {
      if (!this.request) {
        throw new Error('Request module not provided');
      }

      const response = await this.request.request({
        url,
        method: 'POST',
        data: {
          events,
          timestamp: Date.now(),
        },
        header: {
          'Content-Type': 'application/json',
        },
      });

      if (response.statusCode === 200) {
        return {
          success: true,
          message: response.data.message,
          code: response.statusCode,
        };
      } else {
        return {
          success: false,
          message: `HTTP ${response.statusCode}`,
          code: response.statusCode,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
        code: 0,
      };
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      if (this.netInfo) {
        const { networkType } = await this.netInfo.getNetworkType();
        return networkType !== 'none';
      }
      return true;
    } catch (error) {
      return true;
    }
  }
}

/**
 * 小程序设备信息适配器
 */
export class MiniappDeviceAdapter implements AnalyticsDeviceAdapter {
  // 需要注入 Taro 的系统信息 API
  constructor(
    private systemInfo?: {
      getSystemInfoSync: () => any;
    }
  ) {}

  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      if (this.systemInfo) {
        const info = this.systemInfo.getSystemInfoSync();

        return {
          device_id: await this.generateDeviceId(),
          device_model: info.model || 'unknown',
          device_brand: info.brand || 'unknown',
          os_name: info.platform || 'unknown',
          os_version: info.system || 'unknown',
          screen_width: info.screenWidth || 0,
          screen_height: info.screenHeight || 0,
          language: info.language || 'zh_CN',
          timezone: 'Asia/Shanghai',
          network_type: info.networkType,
        };
      }

      return this.getDefaultDeviceInfo();
    } catch (error) {
      console.error('Failed to get device info:', error);
      return this.getDefaultDeviceInfo();
    }
  }

  async generateDeviceId(): Promise<string> {
    // 小程序中使用唯一标识
    // 可以结合 openid 或其他标识
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `miniapp_${timestamp}_${random}`;
  }

  private getDefaultDeviceInfo(): DeviceInfo {
    return {
      device_id: `miniapp_${Date.now()}`,
      os_name: 'wechat',
      os_version: 'unknown',
      screen_width: 0,
      screen_height: 0,
      language: 'zh_CN',
      timezone: 'Asia/Shanghai',
    };
  }
}
