# Logger API 文档

统一的日志管理系统，支持多种日志级别和自定义适配器。

## 安装

```bash
npm install @react-utils-kit/core
```

## 快速开始

```typescript
import { logger, createLogger, LogLevel } from '@react-utils-kit/core/logger';

// 使用默认 logger
logger.info('Application started');
logger.debug('Debug information', { user: 'John' });
logger.warn('Warning message');
logger.error('Error occurred', new Error('Details'));
```

## API

### Logger 类

#### 构造函数

```typescript
new Logger(config?: Partial<LoggerConfig>, context?: string)
```

**参数:**
- `config` - 可选的日志配置
- `context` - 可选的上下文标识（如模块名）

#### 方法

##### debug(message: string, data?: any)

记录调试级别的日志。

```typescript
logger.debug('Debug message', { userId: 123 });
```

##### info(message: string, data?: any)

记录信息级别的日志。

```typescript
logger.info('User logged in', { userId: 123 });
```

##### warn(message: string, data?: any)

记录警告级别的日志。

```typescript
logger.warn('Deprecated API used', { api: '/old-endpoint' });
```

##### error(message: string, error?: Error | any)

记录错误级别的日志。

```typescript
logger.error('Failed to fetch data', new Error('Network error'));
```

##### setLevel(level: LogLevel)

设置最小日志级别。

```typescript
logger.setLevel(LogLevel.WARN); // 只记录 WARN 和 ERROR
```

##### getLevel(): LogLevel

获取当前日志级别。

```typescript
const currentLevel = logger.getLevel();
```

##### createChild(context: string): Logger

创建带上下文的子 Logger。

```typescript
const apiLogger = logger.createChild('API');
apiLogger.info('Request completed'); // 输出: INFO: [API] Request completed
```

### 日志级别

```typescript
enum LogLevel {
  DEBUG = 0,  // 调试信息
  INFO = 1,   // 一般信息
  WARN = 2,   // 警告
  ERROR = 3,  // 错误
  NONE = 4,   // 禁用日志
}
```

### 配置选项

```typescript
interface LoggerConfig {
  minLevel: LogLevel;           // 最小日志级别
  enableTimestamp?: boolean;    // 是否显示时间戳
  enableContext?: boolean;      // 是否显示上下文
  environment?: 'development' | 'production';
  adapter?: LoggerAdapter;      // 自定义适配器
}
```

### 工厂函数

#### createLogger(context: string, config?: Partial<LoggerConfig>): Logger

创建带配置和上下文的新 Logger 实例。

```typescript
const apiLogger = createLogger('API', {
  minLevel: LogLevel.INFO,
  enableTimestamp: true,
});
```

## 自定义适配器

可以实现 `LoggerAdapter` 接口来自定义日志输出方式。

```typescript
import { LoggerAdapter, LogEntry } from '@react-utils-kit/core/logger';

class CustomAdapter implements LoggerAdapter {
  log(entry: LogEntry): void {
    // 自定义日志处理逻辑
    // 例如：发送到服务器、写入文件等
  }
}

const logger = new Logger({
  adapter: new CustomAdapter()
});
```

## 使用示例

### 基础使用

```typescript
import { logger } from '@react-utils-kit/core/logger';

// 简单日志
logger.info('App started');

// 带数据的日志
logger.debug('User data', { id: 1, name: 'John' });

// 错误日志
try {
  // 一些操作
} catch (error) {
  logger.error('Operation failed', error);
}
```

### 模块化日志

```typescript
import { createLogger } from '@react-utils-kit/core/logger';

// 为每个模块创建独立的 logger
const authLogger = createLogger('Auth');
const apiLogger = createLogger('API');

authLogger.info('User logged in');
apiLogger.info('API request completed');
```

### 生产环境配置

```typescript
import { Logger, LogLevel } from '@react-utils-kit/core/logger';

const logger = new Logger({
  minLevel: LogLevel.INFO,      // 生产环境只记录 INFO 及以上
  enableTimestamp: true,
  environment: 'production',
});
```

### 动态控制日志

在浏览器环境中，可以通过 localStorage 动态控制日志输出：

```javascript
// 启用日志
localStorage.setItem('logger-debug', 'true');

// 禁用日志
localStorage.setItem('logger-debug', 'false');
```

## 最佳实践

1. **为不同模块创建独立的 logger**
   ```typescript
   const dbLogger = createLogger('Database');
   const cacheLogger = createLogger('Cache');
   ```

2. **在生产环境提高日志级别**
   ```typescript
   const logger = new Logger({
     minLevel: process.env.NODE_ENV === 'production'
       ? LogLevel.WARN
       : LogLevel.DEBUG
   });
   ```

3. **记录有用的上下文信息**
   ```typescript
   logger.info('API request', {
     method: 'GET',
     url: '/api/users',
     duration: 234,
   });
   ```

4. **错误日志包含完整信息**
   ```typescript
   try {
     await fetchData();
   } catch (error) {
     logger.error('Failed to fetch data', {
       error,
       context: { userId, timestamp },
     });
   }
   ```

