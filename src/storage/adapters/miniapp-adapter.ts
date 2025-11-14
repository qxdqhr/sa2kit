/**
 * 小程序平台存储适配器 (wx.storage / Taro.storage)
 * 仅在小程序环境下加载和使用
 */

import type { StorageAdapter } from '../types';

// 延迟加载 Taro（仅在小程序环境）
let Taro: any = null;
let taroLoadPromise: Promise<void> | null = null;
let isMiniAppEnvironment: boolean | null = null;

/**
 * 检测是否是小程序环境
 */
function checkIsMiniApp(): boolean {
  if (isMiniAppEnvironment !== null) return isMiniAppEnvironment;

  // 服务端环境，不是小程序
  if (typeof window === 'undefined') {
    isMiniAppEnvironment = false;
    return false;
  }

  // 检测是否有小程序全局对象
  const globalObj = window as any;
  isMiniAppEnvironment = !!(
    globalObj.wx || // 微信小程序
    globalObj.my || // 支付宝小程序
    globalObj.swan || // 百度小程序
    globalObj.tt || // 抖音小程序
    globalObj.qq || // QQ 小程序
    globalObj.Taro // Taro 环境
  );

  return isMiniAppEnvironment;
}

/**
 * 加载 Taro（仅在小程序环境）
 */
async function loadTaro() {
  // 如果不是小程序环境，直接返回
  if (!checkIsMiniApp()) {
    return;
  }

  if (Taro) return;
  if (taroLoadPromise) return taroLoadPromise;

  taroLoadPromise = (async () => {
    try {
      // 使用动态导入，仅在小程序环境加载
      // 使用 Function 构造器来避免 TypeScript 在编译时解析模块
      const importTaro = new Function('return import("@tarojs/taro")');
      const taroModule = await importTaro();
      Taro = taroModule.default || taroModule;
    } catch (e) {
      // Taro 不可用（非小程序环境或未安装）
      console.warn('[MiniAppStorage] Taro is not available. This is expected in non-MiniApp environments.');
    }
  })();

  return taroLoadPromise;
}

export class MiniAppStorageAdapter implements StorageAdapter {
  private listeners: Map<string, Set<(key: string, value: string | null) => void>> = new Map();

  async getItem(key: string): Promise<string | null> {
    // 非小程序环境，直接返回 null
    if (!checkIsMiniApp()) {
      return null;
    }

    await loadTaro();
    if (!Taro) return null;

    try {
      const result = await Taro.getStorage({ key });
      return result.data;
    } catch (error: any) {
      // 如果 key 不存在，Taro 会抛出错误
      if (error.errMsg?.includes('data not found')) {
        return null;
      }
      console.error(`[MiniAppStorage] Error getting item "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    // 非小程序环境，抛出错误
    if (!checkIsMiniApp()) {
      throw new Error('[MiniAppStorage] This adapter can only be used in MiniApp environment');
    }

    await loadTaro();
    if (!Taro) {
      throw new Error('[MiniAppStorage] Taro is not available');
    }

    try {
      await Taro.setStorage({ key, data: value });
      this.notifyListeners(key, value);
    } catch (error) {
      console.error(`[MiniAppStorage] Error setting item "${key}":`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    // 非小程序环境，抛出错误
    if (!checkIsMiniApp()) {
      throw new Error('[MiniAppStorage] This adapter can only be used in MiniApp environment');
    }

    await loadTaro();
    if (!Taro) {
      throw new Error('[MiniAppStorage] Taro is not available');
    }

    try {
      await Taro.removeStorage({ key });
      this.notifyListeners(key, null);
    } catch (error) {
      console.error(`[MiniAppStorage] Error removing item "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    // 非小程序环境，抛出错误
    if (!checkIsMiniApp()) {
      throw new Error('[MiniAppStorage] This adapter can only be used in MiniApp environment');
    }

    await loadTaro();
    if (!Taro) {
      throw new Error('[MiniAppStorage] Taro is not available');
    }

    try {
      await Taro.clearStorage();
    } catch (error) {
      console.error('[MiniAppStorage] Error clearing storage:', error);
      throw error;
    }
  }

  addChangeListener(callback: (key: string, value: string | null) => void): () => void {
    // 小程序没有原生的存储监听，我们使用内存中的监听器
    if (!this.listeners.has('*')) {
      this.listeners.set('*', new Set());
    }

    this.listeners.get('*')!.add(callback);

    // 返回清理函数
    return () => {
      this.listeners.get('*')?.delete(callback);
    };
  }

  private notifyListeners(key: string, value: string | null): void {
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach((callback) => callback(key, value));
    }
  }
}

