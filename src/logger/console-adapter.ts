import type { LoggerAdapter, LogEntry, LogLevel } from './types';

/**
 * 控制台日志适配器
 * 使用 console.info/warn/error 输出日志
 */
export class ConsoleLoggerAdapter implements LoggerAdapter {
  private readonly colors = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m', // Green
    WARN: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m',
  };

  log(entry: LogEntry): void {
    const { level, message, timestamp, data, context, error } = entry;

    // 构建日志消息
    let logMessage = '';

    // 添加时间戳
    if (timestamp) {
      logMessage += '[' + (this.formatTimestamp(timestamp)) + '] ';
    }

    // 添加日志级别
    const levelName = this.getLevelName(level);
    logMessage += (levelName) + ': ';

    // 添加上下文
    if (context) {
      logMessage += '[' + (context) + '] ';
    }

    // 添加消息
    logMessage += message;

    // 根据日志级别选择输出方式
    switch (level) {
      case 0: // DEBUG
        console.debug(this.colorize(logMessage, 'DEBUG'), data || '');
        break;
      case 1: // INFO
        console.info(this.colorize(logMessage, 'INFO'), data || '');
        break;
      case 2: // WARN
        console.warn(this.colorize(logMessage, 'WARN'), data || '');
        break;
      case 3: // ERROR
        console.error(this.colorize(logMessage, 'ERROR'), data || '');
        if (error) {
          console.error(error);
        }
        break;
    }
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  private getLevelName(level: LogLevel): string {
    const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'];
    return names[level] || 'UNKNOWN';
  }

  private colorize(message: string, level: keyof typeof this.colors): string {
    // 只在支持颜色的环境中使用颜色
    if (typeof process !== 'undefined' && process.stdout?.isTTY) {
      return (this.colors[level]) + (message) + (this.colors.RESET);
    }
    return message;
  }
}

