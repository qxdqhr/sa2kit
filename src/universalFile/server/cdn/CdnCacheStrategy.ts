/**
 * CDN缓存策略管理
 * 优化静态资源缓存策略和预热机制
 */

/**
 * 缓存策略类型
 */
export enum CacheStrategyType {
  /** 图片资源 */
  IMAGE = 'image',
  /** 视频资源 */
  VIDEO = 'video',
  /** 音频资源 */
  AUDIO = 'audio',
  /** 文档资源 */
  DOCUMENT = 'document',
  /** 压缩包 */
  ARCHIVE = 'archive',
  /** 静态资源 */
  STATIC = 'static',
  /** 其他 */
  OTHER = 'other',
}

/**
 * 缓存策略配置
 */
interface CacheStrategyConfig {
  /** 缓存策略类型 */
  type: CacheStrategyType;
  /** 缓存时间（秒） */
  ttl: number;
  /** 是否启用浏览器缓存 */
  browserCache: boolean;
  /** 浏览器缓存时间（秒） */
  browserCacheTtl: number;
  /** 是否启用CDN缓存 */
  cdnCache: boolean;
  /** CDN缓存时间（秒） */
  cdnCacheTtl: number;
  /** 是否启用预热 */
  enableWarmup: boolean;
  /** 缓存控制头 */
  cacheControl: string;
  /** 允许的文件类型 */
  allowedMimeTypes: string[];
  /** 文件大小限制（字节） */
  maxFileSize?: number;
}

/**
 * 缓存统计信息
 */
interface CacheStats {
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 命中率 */
  hitRate: number;
  /** 总请求数 */
  totalRequests: number;
  /** 缓存大小估算 */
  estimatedSize: number;
  /** 节省的带宽（字节） */
  bandwidthSaved: number;
}

/**
 * CDN缓存策略管理器
 */
export class CdnCacheStrategy {
  private strategies: Map<CacheStrategyType, CacheStrategyConfig> = new Map();
  private stats: Map<CacheStrategyType, CacheStats> = new Map();

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * 初始化默认缓存策略
   */
  private initializeDefaultStrategies(): void {
    // 图片缓存策略
    this.strategies.set(CacheStrategyType.IMAGE, {
      type: CacheStrategyType.IMAGE,
      ttl: 30 * 24 * 3600, // 30天
      browserCache: true,
      browserCacheTtl: 7 * 24 * 3600, // 7天
      cdnCache: true,
      cdnCacheTtl: 30 * 24 * 3600, // 30天
      enableWarmup: true,
      cacheControl: 'public, max-age=604800, s-maxage=2592000',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    // 视频缓存策略
    this.strategies.set(CacheStrategyType.VIDEO, {
      type: CacheStrategyType.VIDEO,
      ttl: 7 * 24 * 3600, // 7天
      browserCache: true,
      browserCacheTtl: 24 * 3600, // 1天
      cdnCache: true,
      cdnCacheTtl: 7 * 24 * 3600, // 7天
      enableWarmup: false, // 视频文件通常较大，不预热
      cacheControl: 'public, max-age=86400, s-maxage=604800',
      allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
      maxFileSize: 500 * 1024 * 1024, // 500MB
    });

    // 音频缓存策略
    this.strategies.set(CacheStrategyType.AUDIO, {
      type: CacheStrategyType.AUDIO,
      ttl: 14 * 24 * 3600, // 14天
      browserCache: true,
      browserCacheTtl: 3 * 24 * 3600, // 3天
      cdnCache: true,
      cdnCacheTtl: 14 * 24 * 3600, // 14天
      enableWarmup: true,
      cacheControl: 'public, max-age=259200, s-maxage=1209600',
      allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });

    // 文档缓存策略
    this.strategies.set(CacheStrategyType.DOCUMENT, {
      type: CacheStrategyType.DOCUMENT,
      ttl: 24 * 3600, // 1天
      browserCache: true,
      browserCacheTtl: 3600, // 1小时
      cdnCache: true,
      cdnCacheTtl: 24 * 3600, // 1天
      enableWarmup: false,
      cacheControl: 'public, max-age=3600, s-maxage=86400',
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    // 压缩包缓存策略
    this.strategies.set(CacheStrategyType.ARCHIVE, {
      type: CacheStrategyType.ARCHIVE,
      ttl: 24 * 3600, // 1天
      browserCache: true,
      browserCacheTtl: 1800, // 30分钟
      cdnCache: true,
      cdnCacheTtl: 24 * 3600, // 1天
      enableWarmup: false,
      cacheControl: 'public, max-age=1800, s-maxage=86400',
      allowedMimeTypes: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/gzip',
        'application/x-tar',
      ],
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });

    // 静态资源缓存策略
    this.strategies.set(CacheStrategyType.STATIC, {
      type: CacheStrategyType.STATIC,
      ttl: 365 * 24 * 3600, // 1年
      browserCache: true,
      browserCacheTtl: 30 * 24 * 3600, // 30天
      cdnCache: true,
      cdnCacheTtl: 365 * 24 * 3600, // 1年
      enableWarmup: true,
      cacheControl: 'public, max-age=2592000, s-maxage=31536000, immutable',
      allowedMimeTypes: [
        'text/css',
        'application/javascript',
        'application/json',
        'font/woff',
        'font/woff2',
        'font/ttf',
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // 其他文件缓存策略
    this.strategies.set(CacheStrategyType.OTHER, {
      type: CacheStrategyType.OTHER,
      ttl: 3600, // 1小时
      browserCache: true,
      browserCacheTtl: 300, // 5分钟
      cdnCache: false,
      cdnCacheTtl: 0,
      enableWarmup: false,
      cacheControl: 'public, max-age=300',
      allowedMimeTypes: [],
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // 初始化统计信息
    for (const type of Object.values(CacheStrategyType)) {
      this.stats.set(type, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        estimatedSize: 0,
        bandwidthSaved: 0,
      });
    }
  }

  /**
   * 根据MIME类型获取缓存策略
   */
  getStrategyByMimeType(mimeType: string): CacheStrategyConfig {
    for (const [type, strategy] of this.strategies.entries()) {
      if (strategy.allowedMimeTypes.includes(mimeType)) {
        return strategy;
      }
    }

    // 根据MIME类型推断策略
    if (mimeType.startsWith('image/')) {
      return this.strategies.get(CacheStrategyType.IMAGE)!;
    } else if (mimeType.startsWith('video/')) {
      return this.strategies.get(CacheStrategyType.VIDEO)!;
    } else if (mimeType.startsWith('audio/')) {
      return this.strategies.get(CacheStrategyType.AUDIO)!;
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('excel')
    ) {
      return this.strategies.get(CacheStrategyType.DOCUMENT)!;
    } else if (
      mimeType.includes('zip') ||
      mimeType.includes('compressed') ||
      mimeType.includes('archive')
    ) {
      return this.strategies.get(CacheStrategyType.ARCHIVE)!;
    }

    return this.strategies.get(CacheStrategyType.OTHER)!;
  }

  /**
   * 生成缓存控制头
   */
  generateCacheHeaders(mimeType: string, fileSize?: number): Record<string, string> {
    const strategy = this.getStrategyByMimeType(mimeType);

    // 检查文件大小限制
    if (fileSize && strategy.maxFileSize && fileSize > strategy.maxFileSize) {
      // 大文件使用更短的缓存时间
      return {
        'Cache-Control': 'public, max-age=300', // 5分钟
        Expires: new Date(Date.now() + 300 * 1000).toUTCString(),
      };
    }

    const headers: Record<string, string> = {
      'Cache-Control': strategy.cacheControl,
      Expires: new Date(Date.now() + strategy.browserCacheTtl * 1000).toUTCString(),
    };

    // 添加ETag用于缓存验证
    if (strategy.browserCache) {
      headers['ETag'] = `"${Date.now()}"`;
    }

    // 添加Last-Modified头
    headers['Last-Modified'] = new Date().toUTCString();

    // 为静态资源添加不可变标记
    if (strategy.type === CacheStrategyType.STATIC) {
      headers['Cache-Control'] += ', immutable';
    }

    return headers;
  }

  /**
   * 检查是否需要缓存预热
   */
  shouldWarmupCache(mimeType: string): boolean {
    const strategy = this.getStrategyByMimeType(mimeType);
    return strategy.enableWarmup;
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(mimeType: string, fileSize: number = 0): void {
    const strategy = this.getStrategyByMimeType(mimeType);
    const stats = this.stats.get(strategy.type);

    if (stats) {
      stats.hits++;
      stats.totalRequests++;
      stats.bandwidthSaved += fileSize;
      stats.hitRate = (stats.hits / stats.totalRequests) * 100;
    }
  }

  /**
   * 记录缓存未命中
   */
  recordCacheMiss(mimeType: string, fileSize: number = 0): void {
    const strategy = this.getStrategyByMimeType(mimeType);
    const stats = this.stats.get(strategy.type);

    if (stats) {
      stats.misses++;
      stats.totalRequests++;
      stats.estimatedSize += fileSize;
      stats.hitRate = (stats.hits / stats.totalRequests) * 100;
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): Map<CacheStrategyType, CacheStats> {
    return new Map(this.stats);
  }

  /**
   * 获取总体缓存统计
   */
  getOverallStats(): CacheStats {
    const overall: CacheStats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      estimatedSize: 0,
      bandwidthSaved: 0,
    };

    for (const stats of this.stats.values()) {
      overall.hits += stats.hits;
      overall.misses += stats.misses;
      overall.totalRequests += stats.totalRequests;
      overall.estimatedSize += stats.estimatedSize;
      overall.bandwidthSaved += stats.bandwidthSaved;
    }

    overall.hitRate = overall.totalRequests > 0 ? (overall.hits / overall.totalRequests) * 100 : 0;

    return overall;
  }

  /**
   * 生成缓存优化建议
   */
  generateOptimizationSuggestions(): Array<{
    type: CacheStrategyType;
    issue: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const suggestions: Array<{
      type: CacheStrategyType;
      issue: string;
      suggestion: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const [type, stats] of this.stats.entries()) {
      if (stats.totalRequests > 100) {
        // 只对有足够请求量的资源类型分析
        // 命中率过低
        if (stats.hitRate < 60) {
          suggestions.push({
            type,
            issue: `${type}类型文件缓存命中率过低 (${stats.hitRate.toFixed(1)}%)`,
            suggestion: '考虑增加缓存时间或启用预热机制',
            severity: stats.hitRate < 30 ? 'high' : 'medium',
          });
        }

        // 缓存大小过大
        if (stats.estimatedSize > 1024 * 1024 * 1024) {
          // 1GB
          suggestions.push({
            type,
            issue: `${type}类型文件缓存占用空间过大 (${(stats.estimatedSize / 1024 / 1024 / 1024).toFixed(2)}GB)`,
            suggestion: '考虑减少缓存时间或优化文件压缩',
            severity: 'medium',
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * 更新缓存策略
   */
  updateStrategy(type: CacheStrategyType, config: Partial<CacheStrategyConfig>): void {
    const currentStrategy = this.strategies.get(type);
    if (currentStrategy) {
      this.strategies.set(type, { ...currentStrategy, ...config });
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    for (const type of Object.values(CacheStrategyType)) {
      this.stats.set(type, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        estimatedSize: 0,
        bandwidthSaved: 0,
      });
    }
  }
}

/**
 * 单例CDN缓存策略管理器
 */
export const cdnCacheStrategy = new CdnCacheStrategy();
