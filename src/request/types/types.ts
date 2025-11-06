/**
 * 请求配置接口
 */
export interface RequestConfig {
  /** 请求 URL */
  url: string;
  /** HTTP 方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: any;
  /** 查询参数 */
  params?: Record<string, any>;
}

/**
 * 请求适配器接口
 * 用于抽象不同平台的网络请求实现
 * - Mobile/Desktop: fetch API
 * - Miniapp: Taro.request
 */
export interface RequestAdapter {
  /**
   * 发送 HTTP 请求
   * @param config 请求配置
   * @returns 响应数据
   */
  request<T = any>(config: RequestConfig): Promise<T>;
}

