/**
 * 存储适配器类型定义
 */

/**
 * 存储适配器接口
 * 用于抽象不同平台的本地存储实现
 */
export interface StorageAdapter {
  /**
   * 获取存储的值
   * @param key 存储键
   * @returns 存储的值，不存在则返回 null
   */
  getItem(key: string): Promise<string | null>;

  /**
   * 设置存储的值
   * @param key 存储键
   * @param value 要存储的值
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * 删除存储的值
   * @param key 存储键
   */
  removeItem(key: string): Promise<void>;

  /**
   * 清空所有存储（可选）
   */
  clear?(): Promise<void>;

  /**
   * 监听存储变化（可选，部分平台支持）
   */
  addChangeListener?(callback: (key: string, value: string | null) => void): () => void;

  /**
   * 移除存储变化监听器（可选）
   */
  removeChangeListener?(callback: (key: string, value: string | null) => void): void;
}

/**
 * 存储事件
 */
export interface StorageChangeEvent {
  key: string;
  value: any;
  oldValue?: any;
}

