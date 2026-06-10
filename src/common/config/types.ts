/**
 * Config 模块类型定义
 */

export interface ConfigItem {
  key: string;
  value: any;
  type: string;
  isRequired: boolean;
  isSensitive: boolean;
  description?: string;
  defaultValue?: any;
  readonly?: boolean;
}

export interface AllConfigs {
  [category: string]: {
    [key: string]: ConfigItem;
  };
}

export interface UseConfigsOptions {
  /**
   * API 基础 URL
   */
  apiBaseUrl?: string;

  /**
   * 获取认证 token 的函数
   */
  getAuthToken: () => string | null | Promise<string | null>;

  /**
   * 未认证时的回调（可选）
   */
  onUnauthorized?: () => void;

  /**
   * 缓存去重时间（毫秒）
   */
  dedupingInterval?: number;

  /**
   * 是否在窗口聚焦时重新验证
   */
  revalidateOnFocus?: boolean;
}

