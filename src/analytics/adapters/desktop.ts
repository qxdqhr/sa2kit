/**
 * Desktop 平台适配器
 * Electron Platform Adapters
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
 * Desktop 存储适配器（使用 localStorage）
 */
export class DesktopStorageAdapter implements AnalyticsStorageAdapter {
  private EVENTS_KEY = 'analytics:events';
  private DEVICE_INFO_KEY = 'analytics:device_info';
  private SESSION_ID_KEY = 'analytics:session_id';

  async saveEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
      }
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(this.EVENTS_KEY);
        return data ? JSON.parse(data) : [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async clearEvents(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.EVENTS_KEY);
      }
    } catch (error) {
      console.error('Failed to clear events:', error);
    }
  }

  async saveDeviceInfo(info: DeviceInfo): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.DEVICE_INFO_KEY, JSON.stringify(info));
      }
    } catch (error) {
      console.error('Failed to save device info:', error);
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(this.DEVICE_INFO_KEY);
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }

  async saveSessionId(sessionId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.SESSION_ID_KEY, sessionId);
      }
    } catch (error) {
      console.error('Failed to save session ID:', error);
    }
  }

  async getSessionId(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(this.SESSION_ID_KEY);
      }
      return null;
    } catch (error) {
      console.error('Failed to get session ID:', error);
      return null;
    }
  }
}

/**
 * Desktop 网络适配器
 */
export class DesktopNetworkAdapter implements AnalyticsNetworkAdapter {
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
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }
}

/**
 * Desktop 设备信息适配器
 */
export class DesktopDeviceAdapter implements AnalyticsDeviceAdapter {
  async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      device_id: await this.generateDeviceId(),
      os_name: this.getOSName(),
      os_version: this.getOSVersion(),
      screen_width: typeof window !== 'undefined' ? window.screen.width : 0,
      screen_height: typeof window !== 'undefined' ? window.screen.height : 0,
      language: typeof navigator !== 'undefined' ? navigator.language : 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      device_model: 'Desktop',
      device_brand: 'Electron',
    };
  }

  async generateDeviceId(): Promise<string> {
    // 尝试从 localStorage 获取已存在的 ID
    if (typeof window !== 'undefined') {
      let deviceId = localStorage.getItem('analytics:device_id');

      if (!deviceId) {
        // Electron 中可以使用机器的唯一标识
        // 这里简化处理，实际可以通过 IPC 获取
        deviceId = `desktop_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('analytics:device_id', deviceId);
      }

      return deviceId;
    }

    return `desktop_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getOSName(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const platform = navigator.platform.toLowerCase();

    if (platform.indexOf('win') !== -1) return 'Windows';
    if (platform.indexOf('mac') !== -1) return 'MacOS';
    if (platform.indexOf('linux') !== -1) return 'Linux';

    return 'unknown';
  }

  private getOSVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    // Electron 中可以通过 process.getSystemVersion() 获取
    // 这里简化处理
    return navigator.userAgent;
  }
}
