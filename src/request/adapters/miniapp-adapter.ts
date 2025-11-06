import type { RequestAdapter, RequestConfig } from '../types/types';

/**
 * Taro Request 接口定义
 * 兼容 @tarojs/taro request API
 */
interface TaroRequestStatic {
  request<T = any>(options: {
    url: string;
    method?: string;
    header?: Record<string, string>;
    data?: any;
  }): Promise<{
    statusCode: number;
    data: T;
  }>;
}

/**
 * Miniapp 平台请求适配器
 * 基于 Taro.request API
 *
 * 使用方式：
 * ```typescript
 * import Taro from '@tarojs/taro'
 * const adapter = new MiniappRequestAdapter(Taro)
 * ```
 *
 * 适用平台：
 * - WeChat Miniapp
 * - Other Taro-based miniapps
 */
export class MiniappRequestAdapter implements RequestAdapter {
  private taro: TaroRequestStatic;

  constructor(taro: TaroRequestStatic) {
    if (!taro) {
      throw new Error('MiniappRequestAdapter requires Taro instance');
    }
    this.taro = taro;
  }

  async request<T = any>(config: RequestConfig): Promise<T> {
    const { url, method = 'GET', headers = {}, body, params } = config;

    try {
      const response = await this.taro.request({
        url,
        method: method as any,
        header: {
          'Content-Type': 'application/json',
          ...headers,
        },
        data: method === 'GET' ? params : body,
      });

      const data = response.data as any;

      // 统一返回格式
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      } else {
        return {
          success: false,
          error: data.error || `请求失败: ${response.statusCode}`,
        } as T;
      }
    } catch (error) {
      console.error('[MiniappRequestAdapter] request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败',
      } as T;
    }
  }
}

