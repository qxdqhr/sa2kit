/**
 * 数据库查询优化中间件
 */

import { performanceMonitor } from '../../monitoring/PerformanceMonitor';

interface QueryPerformance {
  sql: string;
  duration: number;
  params?: any[];
  timestamp: number;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
  isSlow: boolean;
}

export class QueryOptimizer {
  private queryHistory: QueryPerformance[] = [];
  private readonly maxHistorySize = 1000;
  private readonly slowQueryThreshold = 1000;

  async monitorQuery<T>(queryFn: () => Promise<T>, sql: string, params?: any[]): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let error: Error | null = null;

    try {
      result = await queryFn();
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const queryType = this.getQueryType(sql);
      const isSlow = duration > this.slowQueryThreshold;

      this.addQueryToHistory({
        sql,
        duration,
        params,
        timestamp: Date.now(),
        type: queryType,
        isSlow,
      });

      performanceMonitor.recordDatabaseQuery(duration, error !== null);

      if (isSlow) {
        console.warn(`慢查询检测 (${duration}ms):`, {
          sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
          duration,
          params: params?.slice(0, 3),
        });
      }
    }

    return result!;
  }

  private getQueryType(sql: string): QueryPerformance['type'] {
    const upperSql = sql.trim().toUpperCase();

    if (upperSql.startsWith('SELECT')) return 'SELECT';
    if (upperSql.startsWith('INSERT')) return 'INSERT';
    if (upperSql.startsWith('UPDATE')) return 'UPDATE';
    if (upperSql.startsWith('DELETE')) return 'DELETE';

    return 'UNKNOWN';
  }

  private addQueryToHistory(queryPerf: QueryPerformance): void {
    this.queryHistory.push(queryPerf);

    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory.shift();
    }
  }

  getQueryStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentQueries = this.queryHistory.filter((q) => q.timestamp > oneHourAgo);

    const stats = {
      total: recentQueries.length,
      byType: {} as Record<string, number>,
      slowQueries: recentQueries.filter((q) => q.isSlow).length,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
    };

    if (recentQueries.length > 0) {
      recentQueries.forEach((q) => {
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      });

      const durations = recentQueries.map((q) => q.duration);
      stats.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      stats.maxDuration = Math.max(...durations);
      stats.minDuration = Math.min(...durations);
    }

    return stats;
  }
}

export const queryOptimizer = new QueryOptimizer();
