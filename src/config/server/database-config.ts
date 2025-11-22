/**
 * 数据库连接配置管理
 *
 * 注意：这些配置应该从环境变量读取，不存储在数据库中
 * 因为它们是连接数据库本身所需的基础配置
 */

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  queryTimeout?: number;
}

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
}

/**
 * 从环境变量解析数据库连接配置
 */
export function getDatabaseConfig(): DatabaseConnectionConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // 解析 DATABASE_URL
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // 移除开头的 /
      username: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
    };
  }

  // 兜底：从单独的环境变量读取
  return {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432'),
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'lyricnote',
    username: process.env.DB_USER || process.env.POSTGRES_USER || 'lyricnote',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  };
}

/**
 * 从环境变量解析 Redis 连接配置
 */
export function getRedisConfig(): RedisConnectionConfig {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      database: parseInt(url.pathname.slice(1)) || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'lyricnote:',
    };
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'lyricnote:',
  };
}

/**
 * 生成数据库连接 URL
 */
export function buildDatabaseUrl(config: DatabaseConnectionConfig): string {
  const { host, port, database, username, password, ssl } = config;
  let url = `postgresql://${username}:${password}@${host}:${port}/${database}`;

  if (ssl) {
    url += '?sslmode=require';
  }

  return url;
}

/**
 * 生成 Redis 连接 URL
 */
export function buildRedisUrl(config: RedisConnectionConfig): string {
  const { host, port, password, database } = config;
  let url = `redis://`;

  if (password) {
    url += `:${password}@`;
  }

  url += `${host}:${port}`;

  if (database && database !== 0) {
    url += `/${database}`;
  }

  return url;
}

/**
 * 验证数据库连接配置
 */
export function validateDatabaseConfig(config: DatabaseConnectionConfig): string[] {
  const errors: string[] = [];

  if (!config.host) errors.push('数据库主机地址不能为空');
  if (!config.port || config.port < 1 || config.port > 65535) errors.push('数据库端口号无效');
  if (!config.database) errors.push('数据库名不能为空');
  if (!config.username) errors.push('数据库用户名不能为空');
  if (!config.password) errors.push('数据库密码不能为空');

  return errors;
}

/**
 * 显示数据库连接配置（用于管理界面只读显示）
 * 敏感信息会被掩码处理
 */
export function getDatabaseConfigForDisplay(): Record<string, any> {
  const config = getDatabaseConfig();

  return {
    // 只显示非敏感信息
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password ? '***' : '',
    ssl: config.ssl || false,
    poolSize: config.poolSize,
    queryTimeout: config.queryTimeout,
    // 连接状态
    connectionString: `postgresql://${config.username}:***@${config.host}:${config.port}/${config.database}`,
    source: process.env.DATABASE_URL ? 'DATABASE_URL' : 'Environment Variables',
  };
}








