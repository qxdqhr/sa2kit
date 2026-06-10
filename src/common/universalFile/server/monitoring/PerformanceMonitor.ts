/**
 * 通用文件服务性能监控器
 * 监控API响应时间、数据库查询性能、缓存命中率等指标
 */

/**
 * 性能指标类型
 */
interface PerformanceMetric {
  /** 指标名称 */
  name: string;
  /** 指标值 */
  value: number;
  /** 单位 */
  unit: string;
  /** 时间戳 */
  timestamp: number;
  /** 标签 */
  labels?: Record<string, string>;
}

/**
 * 性能统计信息
 */
interface PerformanceStats {
  /** API响应时间统计 */
  apiResponseTimes: {
    /** 平均响应时间（毫秒） */
    average: number;
    /** 最小响应时间 */
    min: number;
    /** 最大响应时间 */
    max: number;
    /** P95响应时间 */
    p95: number;
    /** P99响应时间 */
    p99: number;
    /** 总请求数 */
    totalRequests: number;
  };

  /** 数据库查询性能 */
  databasePerformance: {
    /** 平均查询时间（毫秒） */
    averageQueryTime: number;
    /** 慢查询数量 */
    slowQueries: number;
    /** 总查询数 */
    totalQueries: number;
    /** 查询错误数 */
    queryErrors: number;
  };

  /** 文件操作性能 */
  fileOperations: {
    /** 文件上传统计 */
    uploads: {
      /** 总上传数 */
      total: number;
      /** 成功上传数 */
      successful: number;
      /** 失败上传数 */
      failed: number;
      /** 平均上传时间 */
      averageTime: number;
      /** 平均文件大小 */
      averageSize: number;
    };

    /** 文件下载统计 */
    downloads: {
      /** 总下载数 */
      total: number;
      /** 成功下载数 */
      successful: number;
      /** 失败下载数 */
      failed: number;
      /** 平均下载时间 */
      averageTime: number;
    };
  };

  /** 系统资源使用 */
  systemResources: {
    /** 内存使用量（MB） */
    memoryUsage: number;
    /** CPU使用率（%） */
    cpuUsage: number;
    /** 磁盘使用量（MB） */
    diskUsage: number;
  };
}

/**
 * 请求跟踪信息
 */
interface RequestTrace {
  /** 请求ID */
  requestId: string;
  /** 请求路径 */
  path: string;
  /** HTTP方法 */
  method: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 响应时间（毫秒） */
  duration?: number;
  /** 状态码 */
  statusCode?: number;
  /** 错误信息 */
  error?: string;
  /** 用户ID */
  userId?: string;
  /** 文件大小（字节） */
  fileSize?: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestTraces: Map<string, RequestTrace> = new Map();
  private stats: PerformanceStats;
  private readonly maxMetrics = 10000; // 最大保存指标数量
  private readonly maxTraces = 1000; // 最大保存跟踪数量

  constructor() {
    this.stats = this.initializeStats();

    // 定期清理过期数据
    setInterval(() => {
      this.cleanupOldData();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): PerformanceStats {
    return {
      apiResponseTimes: {
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
        totalRequests: 0,
      },
      databasePerformance: {
        averageQueryTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        queryErrors: 0,
      },
      fileOperations: {
        uploads: {
          total: 0,
          successful: 0,
          failed: 0,
          averageTime: 0,
          averageSize: 0,
        },
        downloads: {
          total: 0,
          successful: 0,
          failed: 0,
          averageTime: 0,
        },
      },
      systemResources: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
      },
    };
  }

  /**
   * 开始请求跟踪
   */
  startRequest(requestId: string, path: string, method: string, userId?: string): void {
    const trace: RequestTrace = {
      requestId,
      path,
      method,
      startTime: Date.now(),
      userId,
    };

    this.requestTraces.set(requestId, trace);
  }

  /**
   * 结束请求跟踪
   */
  endRequest(requestId: string, statusCode: number, error?: string, fileSize?: number): void {
    const trace = this.requestTraces.get(requestId);
    if (!trace) return;

    const endTime = Date.now();
    const duration = endTime - trace.startTime;

    trace.endTime = endTime;
    trace.duration = duration;
    trace.statusCode = statusCode;
    trace.error = error;
    trace.fileSize = fileSize;

    // 记录API响应时间指标
    this.recordMetric('api_response_time', duration, 'ms', {
      path: trace.path,
      method: trace.method,
      status: statusCode.toString(),
    });

    // 更新统计信息
    this.updateApiStats(duration);

    // 如果是文件操作，更新文件操作统计
    if (trace.path.includes('upload')) {
      this.updateUploadStats(statusCode < 400, duration, fileSize);
    } else if (trace.path.includes('download')) {
      this.updateDownloadStats(statusCode < 400, duration);
    }

    // 如果跟踪数量过多，删除最旧的
    if (this.requestTraces.size > this.maxTraces) {
      const oldestKey = this.requestTraces.keys().next().value;
      if (oldestKey) {
        this.requestTraces.delete(oldestKey);
      }
    }
  }

  /**
   * 记录数据库查询性能
   */
  recordDatabaseQuery(queryTime: number, isError: boolean = false): void {
    this.recordMetric('db_query_time', queryTime, 'ms');

    this.stats.databasePerformance.totalQueries++;

    if (isError) {
      this.stats.databasePerformance.queryErrors++;
    }

    // 更新平均查询时间
    const total = this.stats.databasePerformance.totalQueries;
    const currentAvg = this.stats.databasePerformance.averageQueryTime;
    this.stats.databasePerformance.averageQueryTime =
      (currentAvg * (total - 1) + queryTime) / total;

    // 记录慢查询（超过1秒）
    if (queryTime > 1000) {
      this.stats.databasePerformance.slowQueries++;
      this.recordMetric('slow_query', 1, 'count');
    }
  }

  /**
   * 记录系统资源使用情况
   */
  recordSystemResources(): void {
    try {
      // 获取内存使用情况
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;

      this.stats.systemResources.memoryUsage = memoryUsedMB;
      this.recordMetric('memory_usage', memoryUsedMB, 'MB');

      // 记录其他系统指标（简化版本）
      this.recordMetric('heap_total', memoryUsage.heapTotal / 1024 / 1024, 'MB');
      this.recordMetric('heap_used', memoryUsage.heapUsed / 1024 / 1024, 'MB');
      this.recordMetric('external', memoryUsage.external / 1024 / 1024, 'MB');
    } catch (error) {
      console.error('记录系统资源失败:', error);
    }
  }

  /**
   * 记录自定义指标
   */
  recordMetric(name: string, value: number, unit: string, labels?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      labels,
    };

    this.metrics.push(metric);

    // 如果指标数量过多，删除最旧的
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * 获取性能统计信息
   */
  getStats(): PerformanceStats {
    // 更新系统资源信息
    this.recordSystemResources();

    return { ...this.stats };
  }

  /**
   * 获取指定时间范围内的指标
   */
  getMetrics(name?: string, startTime?: number, endTime?: number): PerformanceMetric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter((m) => m.name === name);
    }

    if (startTime) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp >= startTime);
    }

    if (endTime) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp <= endTime);
    }

    return filteredMetrics;
  }

  /**
   * 获取请求跟踪信息
   */
  getRequestTraces(limit: number = 100): RequestTrace[] {
    const traces = Array.from(this.requestTraces.values());
    return traces.sort((a, b) => b.startTime - a.startTime).slice(0, limit);
  }

  /**
   * 获取慢请求列表
   */
  getSlowRequests(threshold: number = 1000): RequestTrace[] {
    return this.getRequestTraces()
      .filter((trace) => trace.duration && trace.duration > threshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  /**
   * 获取错误请求列表
   */
  getErrorRequests(): RequestTrace[] {
    return this.getRequestTraces().filter((trace) => trace.statusCode && trace.statusCode >= 400);
  }

  /**
   * 生成性能报告
   */
  generateReport(): {
    summary: any;
    topSlowRequests: RequestTrace[];
    recentErrors: RequestTrace[];
    systemHealth: any;
  } {
    const stats = this.getStats();
    const slowRequests = this.getSlowRequests(500); // 500ms以上的请求
    const errorRequests = this.getErrorRequests();

    return {
      summary: {
        totalRequests: stats.apiResponseTimes.totalRequests,
        averageResponseTime: stats.apiResponseTimes.average,
        errorRate: (errorRequests.length / Math.max(stats.apiResponseTimes.totalRequests, 1)) * 100,
        cacheHitRate: 0, // 需要从缓存管理器获取
        slowQueryCount: stats.databasePerformance.slowQueries,
      },
      topSlowRequests: slowRequests.slice(0, 10),
      recentErrors: errorRequests.slice(0, 10),
      systemHealth: {
        memoryUsage: stats.systemResources.memoryUsage,
        queryPerformance: stats.databasePerformance.averageQueryTime,
        uptime: process.uptime(),
      },
    };
  }

  /**
   * 更新API统计信息
   */
  private updateApiStats(duration: number): void {
    const stats = this.stats.apiResponseTimes;
    stats.totalRequests++;

    // 更新平均响应时间
    stats.average = (stats.average * (stats.totalRequests - 1) + duration) / stats.totalRequests;

    // 更新最小/最大值
    if (stats.totalRequests === 1 || duration < stats.min) {
      stats.min = duration;
    }
    if (stats.totalRequests === 1 || duration > stats.max) {
      stats.max = duration;
    }

    // 计算百分位数（简化版本）
    const recentDurations = this.getMetrics('api_response_time', Date.now() - 300000) // 最近5分钟
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (recentDurations.length > 0) {
      stats.p95 = recentDurations[Math.floor(recentDurations.length * 0.95)] || 0;
      stats.p99 = recentDurations[Math.floor(recentDurations.length * 0.99)] || 0;
    }
  }

  /**
   * 更新上传统计信息
   */
  private updateUploadStats(success: boolean, duration: number, fileSize?: number): void {
    const uploads = this.stats.fileOperations.uploads;
    uploads.total++;

    if (success) {
      uploads.successful++;
    } else {
      uploads.failed++;
    }

    // 更新平均上传时间
    uploads.averageTime = (uploads.averageTime * (uploads.total - 1) + duration) / uploads.total;

    // 更新平均文件大小
    if (fileSize) {
      uploads.averageSize = (uploads.averageSize * (uploads.total - 1) + fileSize) / uploads.total;
    }
  }

  /**
   * 更新下载统计信息
   */
  private updateDownloadStats(success: boolean, duration: number): void {
    const downloads = this.stats.fileOperations.downloads;
    downloads.total++;

    if (success) {
      downloads.successful++;
    } else {
      downloads.failed++;
    }

    // 更新平均下载时间
    downloads.averageTime =
      (downloads.averageTime * (downloads.total - 1) + duration) / downloads.total;
  }

  /**
   * 清理过期数据
   */
  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - 3600000; // 1小时前

    // 清理过期指标
    this.metrics = this.metrics.filter((m) => m.timestamp > oneHourAgo);

    // 清理过期跟踪
    for (const [requestId, trace] of this.requestTraces.entries()) {
      if (trace.startTime < oneHourAgo) {
        this.requestTraces.delete(requestId);
      }
    }
  }

  /**
   * 重置统计信息
   */
  reset(): void {
    this.metrics = [];
    this.requestTraces.clear();
    this.stats = this.initializeStats();
  }
}

/**
 * 单例性能监控器实例
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * 性能监控装饰器
 */
export function measurePerformance(operation: string) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const requestId = (operation) + '_' + (Date.now()) + '_' + (Math.random().toString(36).substr(2, 9));

      try {
        performanceMonitor.startRequest(requestId, operation, 'INTERNAL');
        const result = await method.apply(this, args);
        performanceMonitor.endRequest(requestId, 200);
        return result;
      } catch (error) {
        performanceMonitor.endRequest(
          requestId,
          500,
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }
    };

    return descriptor;
  };
}
