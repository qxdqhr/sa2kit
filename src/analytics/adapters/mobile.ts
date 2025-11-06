/**
 * Mobile 平台适配器
 * React Native Platform Adapters
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
 * Mobile 存储适配器
 * 需要在 mobile 项目中实现具体的 AsyncStorage 逻辑
 */
export class MobileStorageAdapter implements AnalyticsStorageAdapter {
  private EVENTS_KEY = '@analytics:events';
  private DEVICE_INFO_KEY = '@analytics:device_info';
  private SESSION_ID_KEY = '@analytics:session_id';

  // 需要注入具体的存储实现
  constructor(
    private storage: {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    }
  ) {}

  async saveEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      await this.storage.setItem(this.EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      const data = await this.storage.getItem(this.EVENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async clearEvents(): Promise<void> {
    try {
      await this.storage.removeItem(this.EVENTS_KEY);
    } catch (error) {
      console.error('Failed to clear events:', error);
    }
  }

  async saveDeviceInfo(info: DeviceInfo): Promise<void> {
    try {
      await this.storage.setItem(this.DEVICE_INFO_KEY, JSON.stringify(info));
    } catch (error) {
      console.error('Failed to save device info:', error);
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const data = await this.storage.getItem(this.DEVICE_INFO_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }

  async saveSessionId(sessionId: string): Promise<void> {
    try {
      await this.storage.setItem(this.SESSION_ID_KEY, sessionId);
    } catch (error) {
      console.error('Failed to save session ID:', error);
    }
  }

  async getSessionId(): Promise<string | null> {
    try {
      return await this.storage.getItem(this.SESSION_ID_KEY);
    } catch (error) {
      console.error('Failed to get session ID:', error);
      return null;
    }
  }
}

/**
 * Mobile 网络适配器
 */
export class MobileNetworkAdapter implements AnalyticsNetworkAdapter {
  // 需要注入网络检查函数
  constructor(
    private netInfo?: {
      fetch: () => Promise<{ isConnected: boolean | null }>;
    }
  ) {}

  async upload(url: string, events: AnalyticsEvent[]): Promise<UploadResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          timestamp: Date.now(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: data.message,
          code: response.status,
        };
      } else {
        return {
          success: false,
          message: `HTTP ${response.status}`,
          code: response.status,
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
        const state = await this.netInfo.fetch();
        return state.isConnected ?? false;
      }
      // 如果没有 NetInfo，假设在线
      return true;
    } catch (error) {
      return true;
    }
  }
}

/**
 * Mobile 设备信息适配器
 */
export class MobileDeviceAdapter implements AnalyticsDeviceAdapter {
  // 需要注入设备信息获取函数
  constructor(
    private deviceInfoModule?: {
      getSystemName: () => Promise<string>;
      getSystemVersion: () => Promise<string>;
      getModel: () => Promise<string>;
      getBrand: () => Promise<string>;
      getUniqueId: () => Promise<string>;
    }
  ) {}

  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      const info = this.deviceInfoModule;

      return {
        device_id: info ? await info.getUniqueId() : await this.generateDeviceId(),
        device_model: info ? await info.getModel() : 'unknown',
        device_brand: info ? await info.getBrand() : 'unknown',
        os_name: info ? await info.getSystemName() : 'unknown',
        os_version: info ? await info.getSystemVersion() : 'unknown',
        screen_width: typeof window !== 'undefined' ? window.screen.width : 0,
        screen_height: typeof window !== 'undefined' ? window.screen.height : 0,
        language: typeof navigator !== 'undefined' ? navigator.language : 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return this.getDefaultDeviceInfo();
    }
  }

  async generateDeviceId(): Promise<string> {
    // 生成一个唯一的设备ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `mobile_${timestamp}_${random}`;
  }

  private getDefaultDeviceInfo(): DeviceInfo {
    return {
      device_id: `mobile_${Date.now()}`,
      os_name: 'unknown',
      os_version: 'unknown',
      screen_width: 0,
      screen_height: 0,
      language: 'en',
      timezone: 'UTC',
    };
  }
}
