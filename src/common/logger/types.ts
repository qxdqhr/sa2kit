/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // 禁用所有日志
}

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  context?: string;
  error?: Error;
}

/**
 * 日志适配器接口
 * 不同平台实现不同的日志输出方式
 */
export interface LoggerAdapter {
  /**
   * 输出日志
   */
  log(entry: LogEntry): void;

  /**
   * 批量输出日志（可选）
   */
  logBatch?(entries: LogEntry[]): void;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  /**
   * 最小日志级别
   * 只有大于等于此级别的日志才会输出
   */
  minLevel: LogLevel;

  /**
   * 是否启用时间戳
   */
  enableTimestamp?: boolean;

  /**
   * 是否启用上下文（模块名）
   */
  enableContext?: boolean;

  /**
   * 环境（development/production）
   */
  environment?: 'development' | 'production';

  /**
   * 自定义适配器
   */
  adapter?: LoggerAdapter;
}

