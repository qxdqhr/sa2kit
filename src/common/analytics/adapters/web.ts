/**
 * Web 平台适配器
 * Browser/Next.js Platform Adapters
 */

import type {
  AnalyticsStorageAdapter,
  AnalyticsNetworkAdapter,
  AnalyticsDeviceAdapter,
  DeviceInfo,
  AnalyticsEvent,
  UploadResponse,
} from '../types';
import { WebStorageAdapter } from '../../storage/adapters/web-adapter';

/**
 * Web 事件存储适配器
 * 基于通用 WebStorageAdapter 实现
 * 
 * 注意：此适配器专门用于 Analytics 埋点事件的存储
 * 与通用存储适配器 (storage/adapters/web-adapter) 不同
 */
export class WebEventStorageAdapter implements AnalyticsStorageAdapter {
  private storage = new WebStorageAdapter();
  private EVENTS_KEY = 'analytics:events';
  private DEVICE_INFO_KEY = 'analytics:device_info';
  private SESSION_ID_KEY = 'analytics:session_id';

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
      // sessionStorage 需要特殊处理
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.SESSION_ID_KEY, sessionId);
      }
    } catch (error) {
      console.error('Failed to save session ID:', error);
    }
  }

  async getSessionId(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem(this.SESSION_ID_KEY);
      }
      return null;
    } catch (error) {
      console.error('Failed to get session ID:', error);
      return null;
    }
  }
}

/**
 * Web 网络适配器
 */
export class WebNetworkAdapter implements AnalyticsNetworkAdapter {
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
        // 使用 keepalive 确保页面关闭时也能发送
        keepalive: true,
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
          message: 'HTTP ' + (response.status),
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
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }
}

/**
 * Web 设备信息适配器
 */
export class WebDeviceAdapter implements AnalyticsDeviceAdapter {
  async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      device_id: await this.generateDeviceId(),
      os_name: this.getOSName(),
      os_version: this.getOSVersion(),
      screen_width: typeof window !== 'undefined' ? window.screen.width : 0,
      screen_height: typeof window !== 'undefined' ? window.screen.height : 0,
      language: typeof navigator !== 'undefined' ? navigator.language : 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      device_model: this.getBrowserName(),
      device_brand: this.getBrowserVersion(),
    };
  }

  async generateDeviceId(): Promise<string> {
    // 尝试从 localStorage 获取已存在的 ID
    if (typeof window !== 'undefined') {
      let deviceId = localStorage.getItem('analytics:device_id');

      if (!deviceId) {
        deviceId = 'web_' + (Date.now()) + '_' + (Math.random().toString(36).substring(2, 15));
        localStorage.setItem('analytics:device_id', deviceId);
      }

      return deviceId;
    }

    return 'web_' + (Date.now()) + '_' + (Math.random().toString(36).substring(2, 15));
  }

  private getOSName(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;

    if (userAgent.indexOf('Win') !== -1) return 'Windows';
    if (userAgent.indexOf('Mac') !== -1) return 'MacOS';
    if (userAgent.indexOf('Linux') !== -1) return 'Linux';
    if (userAgent.indexOf('Android') !== -1) return 'Android';
    if (userAgent.indexOf('iOS') !== -1) return 'iOS';

    return 'unknown';
  }

  private getOSVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;
    const match = userAgent.match(/\(([^)]+)\)/);

    return match && match[1] ? match[1] : 'unknown';
  }

  private getBrowserName(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;

    if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
    if (userAgent.indexOf('Safari') !== -1) return 'Safari';
    if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
    if (userAgent.indexOf('Edge') !== -1) return 'Edge';

    return 'unknown';
  }

  private getBrowserVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Safari|Firefox|Edge)\/(\d+)/);

    return match && match[2] ? match[2] : 'unknown';
  }
}

/**
 * 统一的 Web 适配器对象
 */
export const webAdapter = {
  storage: new WebEventStorageAdapter(),
  network: new WebNetworkAdapter(),
  device: new WebDeviceAdapter(),
};

