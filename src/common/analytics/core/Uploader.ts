/**
 * 事件上传器
 * Event Uploader
 */

import type {
  AnalyticsEvent,
  AnalyticsNetworkAdapter,
  AnalyticsStorageAdapter,
} from '../types';

export interface UploaderConfig {
  endpoint: string;
  batchSize: number;
  retryTimes: number;
  retryInterval: number;
  networkAdapter: AnalyticsNetworkAdapter;
  storageAdapter: AnalyticsStorageAdapter;
  onSuccess?: (events: AnalyticsEvent[]) => void;
  onError?: (error: Error, events: AnalyticsEvent[]) => void;
}

export class Uploader {
  private config: UploaderConfig;
  private uploading = false;
  private retryQueue: Map<string, { events: AnalyticsEvent[]; retryCount: number }> = new Map();

  constructor(config: UploaderConfig) {
    this.config = config;
  }

  /**
   * 上传事件
   */
  async upload(events: AnalyticsEvent[]): Promise<boolean> {
    if (events.length === 0) return true;

    // 检查网络状态
    const isOnline = await this.config.networkAdapter.isOnline();
    if (!isOnline) {
      // 离线时保存到本地
      await this.saveToLocal(events);
      return false;
    }

    try {
      this.uploading = true;

      const response = await this.config.networkAdapter.upload(this.config.endpoint, events);

      if (response.success) {
        this.config.onSuccess?.(events);
        return true;
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.config.onError?.(err, events);

      // 添加到重试队列
      await this.addToRetryQueue(events);
      return false;
    } finally {
      this.uploading = false;
    }
  }

  /**
   * 批量上传
   */
  async uploadBatch(events: AnalyticsEvent[]): Promise<boolean> {
    const batches = this.splitIntoBatches(events, this.config.batchSize);
    const results = await Promise.all(batches.map((batch) => this.upload(batch)));

    return results.every((result) => result);
  }

  /**
   * 重试失败的上传
   */
  async retryFailedUploads(): Promise<void> {
    if (this.uploading || this.retryQueue.size === 0) return;

    const isOnline = await this.config.networkAdapter.isOnline();
    if (!isOnline) return;

    const entries = Array.from(this.retryQueue.entries());

    for (const [key, item] of entries) {
      if (item.retryCount >= this.config.retryTimes) {
        // 达到最大重试次数，保存到本地
        await this.saveToLocal(item.events);
        this.retryQueue.delete(key);
        continue;
      }

      // 延迟重试
      await this.delay(this.config.retryInterval * (item.retryCount + 1));

      const success = await this.upload(item.events);

      if (success) {
        this.retryQueue.delete(key);
      } else {
        // 增加重试次数
        item.retryCount++;
      }
    }
  }

  /**
   * 上传本地缓存的事件
   */
  async uploadCachedEvents(): Promise<void> {
    try {
      const cachedEvents = await this.config.storageAdapter.getEvents();

      if (cachedEvents.length > 0) {
        const success = await this.uploadBatch(cachedEvents);

        if (success) {
          await this.config.storageAdapter.clearEvents();
        }
      }
    } catch (error) {
      console.error('Failed to upload cached events:', error);
    }
  }

  /**
   * 保存事件到本地存储
   */
  private async saveToLocal(events: AnalyticsEvent[]): Promise<void> {
    try {
      const existingEvents = await this.config.storageAdapter.getEvents();
      const allEvents = [...existingEvents, ...events];
      await this.config.storageAdapter.saveEvents(allEvents);
    } catch (error) {
      console.error('Failed to save events to local storage:', error);
    }
  }

  /**
   * 添加到重试队列
   */
  private async addToRetryQueue(events: AnalyticsEvent[]): Promise<void> {
    const key = (Date.now()) + '_' + (Math.random());
    this.retryQueue.set(key, {
      events,
      retryCount: 0,
    });
  }

  /**
   * 分割成批次
   */
  private splitIntoBatches(events: AnalyticsEvent[], batchSize: number): AnalyticsEvent[][] {
    const batches: AnalyticsEvent[][] = [];

    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 是否正在上传
   */
  isUploading(): boolean {
    return this.uploading;
  }

  /**
   * 获取重试队列大小
   */
  getRetryQueueSize(): number {
    return this.retryQueue.size;
  }

  /**
   * 清空重试队列
   */
  clearRetryQueue(): void {
    this.retryQueue.clear();
  }
}
