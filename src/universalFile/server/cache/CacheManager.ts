/**
 * 通用文件服务缓存管理器
 * 支持多层缓存策略：内存缓存 + Redis缓存
 */

import { LRUCache } from 'lru-cache';
import { createLogger } from '../../../logger';

const logger = createLogger('CacheManager');

/**
 * 缓存项接口
 */
interface CacheItem<T = any> {
  /** 缓存数据 */
  data: T;
  /** 创建时间 */
  createdAt: number;
  /** 过期时间 */
  expiresAt: number;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessAt: number;
}

/**
 * 缓存统计信息
 */
interface CacheStats {
  /** 总请求次数 */
  totalRequests: number;
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 命中率 */
  hitRate: number;
  /** 内存缓存大小 */
  memorySize: number;
  /** Redis缓存状态 */
  redisConnected: boolean;
}

/**
 * 缓存配置选项
 */
interface CacheOptions {
  /** 默认过期时间（秒） */
  defaultTTL?: number;
  /** 内存缓存最大条目数 */
  maxMemoryItems?: number;
  /** 是否启用Redis缓存 */
  enableRedis?: boolean;
  /** Redis连接配置 */
  redisConfig?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  /** 缓存键前缀 */
  keyPrefix?: string;
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private memoryCache: LRUCache<string, CacheItem>;
  private redisClient: any = null;
  private stats: CacheStats;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      defaultTTL: options.defaultTTL || 300, // 5分钟
      maxMemoryItems: options.maxMemoryItems || 1000,
      enableRedis: options.enableRedis || false,
      redisConfig: options.redisConfig || {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
      keyPrefix: options.keyPrefix || 'universal-file:',
    };

    // 初始化内存缓存
    this.memoryCache = new LRUCache({
      max: this.options.maxMemoryItems,
      ttl: this.options.defaultTTL * 1000, // LRU缓存使用毫秒
      updateAgeOnGet: true,
      allowStale: false,
    });

    // 初始化统计信息
    this.stats = {
      totalRequests: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      memorySize: 0,
      redisConnected: false,
    };

    // 初始化Redis连接（如果启用）
    if (this.options.enableRedis) {
      this.initRedis();
    }
  }

  /**
   * 初始化Redis连接
   */
  private async initRedis() {
    try {
      // 这里可以集成实际的Redis客户端，如ioredis
      // const Redis = require('ioredis');
      // this.redisClient = new Redis(this.options.redisConfig);

      logger.info('Redis缓存已禁用 - 请安装并配置Redis客户端');
      this.stats.redisConnected = false;
    } catch (error) {
      console.error('Redis连接失败:', error);
      this.stats.redisConnected = false;
    }
  }

  /**
   * 生成缓存键
   */
  private generateKey(key: string): string {
    return (this.options.keyPrefix) + (key);
  }

  /**
   * 获取缓存数据
   */
  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    this.stats.totalRequests++;

    try {
      // 首先尝试从内存缓存获取
      const memoryItem = this.memoryCache.get(cacheKey);
      if (memoryItem && memoryItem.expiresAt > Date.now()) {
        memoryItem.accessCount++;
        memoryItem.lastAccessAt = Date.now();
        this.stats.hits++;
        this.updateHitRate();
        return memoryItem.data as T;
      }

      // 如果内存缓存未命中，尝试从Redis获取
      if (this.redisClient && this.stats.redisConnected) {
        const redisData = await this.redisClient.get(cacheKey);
        if (redisData) {
          const parsedData = JSON.parse(redisData);

          // 将数据放回内存缓存
          const cacheItem: CacheItem<T> = {
            data: parsedData.data,
            createdAt: parsedData.createdAt,
            expiresAt: parsedData.expiresAt,
            accessCount: parsedData.accessCount + 1,
            lastAccessAt: Date.now(),
          };

          this.memoryCache.set(cacheKey, cacheItem);
          this.stats.hits++;
          this.updateHitRate();
          return parsedData.data as T;
        }
      }

      // 缓存未命中
      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      console.error('缓存获取失败:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.generateKey(key);
    const expireTime = ttl || this.options.defaultTTL;
    const now = Date.now();

    const cacheItem: CacheItem<T> = {
      data,
      createdAt: now,
      expiresAt: now + expireTime * 1000,
      accessCount: 0,
      lastAccessAt: now,
    };

    try {
      // 设置到内存缓存
      this.memoryCache.set(cacheKey, cacheItem);

      // 如果启用Redis，也设置到Redis
      if (this.redisClient && this.stats.redisConnected) {
        await this.redisClient.setex(cacheKey, expireTime, JSON.stringify(cacheItem));
      }

      this.updateMemorySize();
    } catch (error) {
      console.error('缓存设置失败:', error);
    }
  }

  /**
   * 删除缓存数据
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);

    try {
      // 从内存缓存删除
      this.memoryCache.delete(cacheKey);

      // 从Redis删除
      if (this.redisClient && this.stats.redisConnected) {
        await this.redisClient.del(cacheKey);
      }

      this.updateMemorySize();
    } catch (error) {
      console.error('缓存删除失败:', error);
    }
  }

  /**
   * 批量删除缓存（支持模式匹配）
   */
  async deletePattern(pattern: string): Promise<void> {
    const cachePattern = this.generateKey(pattern);

    try {
      // 清理内存缓存中匹配的项
      const keys = Array.from(this.memoryCache.keys());
      for (const key of keys) {
        if (this.matchPattern(key, cachePattern)) {
          this.memoryCache.delete(key);
        }
      }

      // 清理Redis中匹配的项
      if (this.redisClient && this.stats.redisConnected) {
        const redisKeys = await this.redisClient.keys(cachePattern);
        if (redisKeys.length > 0) {
          await this.redisClient.del(...redisKeys);
        }
      }

      this.updateMemorySize();
    } catch (error) {
      console.error('批量缓存删除失败:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      // 清空内存缓存
      this.memoryCache.clear();

      // 清空Redis缓存（仅删除带前缀的键）
      if (this.redisClient && this.stats.redisConnected) {
        const keys = await this.redisClient.keys((this.options.keyPrefix) + '*');
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      }

      // 重置统计信息
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.totalRequests = 0;
      this.stats.hitRate = 0;
      this.updateMemorySize();
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    this.updateMemorySize();
    return { ...this.stats };
  }

  /**
   * 获取缓存项详情（用于调试）
   */
  getCacheItem(key: string): CacheItem | null {
    const cacheKey = this.generateKey(key);
    return this.memoryCache.get(cacheKey) || null;
  }

  /**
   * 预热缓存
   */
  async warmup<T>(items: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    logger.info('开始预热缓存，共 ' + (items.length) + ' 项...');

    const promises = items.map((item) => this.set(item.key, item.data, item.ttl));

    try {
      await Promise.all(promises);
      logger.info('缓存预热完成');
    } catch (error) {
      console.error('缓存预热失败:', error);
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    this.stats.hitRate =
      this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0;
  }

  /**
   * 更新内存使用量
   */
  private updateMemorySize(): void {
    this.stats.memorySize = this.memoryCache.size;
  }

  /**
   * 模式匹配函数
   */
  private matchPattern(key: string, pattern: string): boolean {
    // 简单的通配符匹配，* 匹配任意字符
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');

    const regex = new RegExp('^' + (regexPattern) + '$');
    return regex.test(key);
  }

  /**
   * 获取或设置缓存（如果不存在则调用生成函数）
   */
  async getOrSet<T>(key: string, generator: () => Promise<T>, ttl?: number): Promise<T> {
    // 尝试获取缓存
    const cachedData = await this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    // 缓存不存在，调用生成函数
    try {
      const data = await generator();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error('缓存生成失败:', error);
      throw error;
    }
  }

  /**
   * 关闭缓存管理器
   */
  async close(): Promise<void> {
    try {
      // 清理内存缓存
      this.memoryCache.clear();

      // 关闭Redis连接
      if (this.redisClient) {
        await this.redisClient.quit();
      }
    } catch (error) {
      console.error('关闭缓存管理器失败:', error);
    }
  }
}

/**
 * 单例缓存管理器实例
 */
export const cacheManager = new CacheManager({
  defaultTTL: 300, // 5分钟
  maxMemoryItems: 2000,
  enableRedis: false, // 开发环境暂时禁用Redis
  keyPrefix: 'universal-file:',
});
