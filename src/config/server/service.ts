/**
 * ConfigService - 简化的配置管理服务
 *
 * 提供更简单的API来管理配置，封装ConfigEngine的复杂性
 *
 * 使用方法:
 * ```typescript
 * import { ConfigService } from 'sa2kit/config/server';
 * import { ConfigCategory, ConfigType } from 'sa2kit/config/server';
 *
 * const service = new ConfigService({ db, tables });
 *
 * // 获取配置
 * const apiKey = await service.getConfig('api_key', 'default-key');
 *
 * // 设置配置
 * await service.setConfig('api_key', 'new-key');
 *
 * // 获取分类下的所有配置
 * const storageConfigs = await service.getConfigsByCategory(ConfigCategory.STORAGE);
 * ```
 */

import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { ConfigEngine, type DatabaseClient, type DatabaseTables, type Logger } from './engine';
import { ConfigCategory, type ConfigType, type ConfigItem } from './types';

/**
 * 配置模板（用于初始化默认配置）
 */
export type ConfigTemplates = Record<string, ConfigItem[]>;

/**
 * ConfigService 配置选项
 */
export interface ConfigServiceOptions {
  /** 数据库客户端 */
  db: DatabaseClient;
  /** 数据库表定义 */
  tables: DatabaseTables;
  /** 加密密钥 */
  encryptionKey?: string;
  /** 日志记录器 */
  logger?: Logger;
  /** 配置模板 */
  templates?: ConfigTemplates;
}

/**
 * 默认日志记录器
 */
const defaultLogger: Logger = {
  info: (message: string, ...args: any[]) => console.log('[ConfigService] ' + (message), ...args),
  warn: (message: string, ...args: any[]) => console.warn('[ConfigService] ' + (message), ...args),
  error: (message: string, ...args: any[]) => console.error('[ConfigService] ' + (message), ...args),
};

/**
 * 配置管理服务类
 */
export class ConfigService {
  private configCache: Map<string, any> = new Map();
  private metadataCache: Map<
    string,
    {
      category: string;
      type: ConfigType;
      isSensitive: boolean;
      isRequired: boolean;
      defaultDescription?: string;
    }
  > = new Map();
  private encryptionKey: string;
  private db: DatabaseClient;
  private tables: DatabaseTables;
  private logger: Logger;
  private templates: ConfigTemplates;

  constructor(options: ConfigServiceOptions) {
    this.db = options.db;
    this.tables = options.tables;
    this.logger = options.logger || defaultLogger;
    this.templates = options.templates || {};

    // 使用环境变量或默认密钥作为加密密钥
    this.encryptionKey = options.encryptionKey || process.env.CONFIG_ENCRYPTION_KEY || 'default-config-key-2024';

    // 初始化时加载配置和元数据
    this.loadConfigsFromDatabase();
    this.loadMetadataFromDatabase();
  }

  // 从数据库加载元数据
  private async loadMetadataFromDatabase() {
    if (!this.tables.configMetadata) {
      this.logger.info('配置元数据表未提供，跳过元数据加载');
      return;
    }

    try {
      const metadata = await this.db.select().from(this.tables.configMetadata);
      metadata.forEach((meta: any) => {
        this.metadataCache.set(meta.key, {
          category: meta.category,
          type: meta.type as ConfigType,
          isSensitive: meta.isSensitive,
          isRequired: meta.isRequired,
          defaultDescription: meta.defaultDescription || undefined,
        });
      });
      this.logger.info('已加载 ' + (metadata.length) + ' 条配置元数据');
    } catch (error) {
      // 如果表不存在，使用模板作为后备
      this.logger.warn(
        '配置元数据表不存在，使用模板数据',
        error instanceof Error ? error.message : String(error)
      );
      // 不抛出错误，继续使用模板
    }
  }

  // 从数据库加载配置到缓存
  private async loadConfigsFromDatabase(): Promise<void> {
    try {
      const configs = await this.db.select().from(this.tables.systemConfigs);

      configs.forEach((config: any) => {
        let value = config.value;

        // 如果是敏感配置，解密
        if (this.isSensitiveConfig(config.key)) {
          try {
            value = this.decrypt(config.value as string);
            this.logger.info('✅ 成功解密配置: ' + (config.key));
          } catch (error) {
            this.logger.error('❌ 解密配置失败: ' + (config.key), error);
            // 跳过该配置，不加入缓存
            return;
          }
        }

        this.configCache.set(config.key, value);
      });

      this.logger.info('已加载 ' + (configs.length) + ' 个配置项');
    } catch (error) {
      this.logger.error('加载配置失败', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // 获取配置值
  public async getConfig(key: string, defaultValue?: any): Promise<any> {
    if (!key) {
      return defaultValue;
    }

    // 优先从环境变量获取
    const envValue = process.env[key.toUpperCase()];
    if (envValue !== undefined) {
      return this.parseValue(envValue, this.getConfigType(key));
    }

    // 从缓存获取
    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }

    // 从数据库获取
    try {
      const [config] = await this.db
        .select()
        .from(this.tables.systemConfigs)
        .where(eq(this.tables.systemConfigs.key, key))
        .limit(1);

      if (config) {
        let value = config.value;

        if (this.isSensitiveConfig(key)) {
          try {
            value = this.decrypt(config.value as string);
            this.logger.info('✅ 成功解密配置: ' + (key) + ', 长度: ' + (value?.length));
          } catch (error) {
            this.logger.error('❌ 解密配置失败: ' + (key), error);
            throw new Error('配置 ' + (key) + ' 解密失败');
          }
        }

        this.configCache.set(key, value);
        return value;
      }
    } catch (error) {
      this.logger.error(
        '获取配置 ' + (key) + ' 失败',
        error instanceof Error ? error : new Error(String(error))
      );
    }

    return defaultValue;
  }

  // 设置配置值
  public async setConfig(key: string, value: any, description?: string): Promise<void> {
    try {
      const category = this.getConfigCategory(key);
      const type = this.getConfigType(key);
      const isSensitive = this.isSensitiveConfig(key);

      // 验证配置值
      const validatedValue = this.validateValue(value, type);

      // 敏感配置需要加密
      const storageValue = isSensitive ? this.encrypt(validatedValue) : validatedValue;

      // 保存到数据库
      const existing = await this.db
        .select()
        .from(this.tables.systemConfigs)
        .where(eq(this.tables.systemConfigs.key, key))
        .limit(1);

      if (existing.length > 0) {
        await this.db
          .update(this.tables.systemConfigs)
          .set({
            value: storageValue,
            description: description || this.getConfigDescription(key),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(this.tables.systemConfigs.key, key));
      } else {
        await this.db.insert(this.tables.systemConfigs).values({
          id: crypto.randomBytes(16).toString('hex'),
          key,
          value: storageValue,
          description: description || this.getConfigDescription(key),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // 更新缓存
      this.configCache.set(key, validatedValue);

      this.logger.info('配置 ' + (key) + ' 已更新');
    } catch (error) {
      this.logger.error(
        '设置配置 ' + (key) + ' 失败',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  // 获取分类下的所有配置
  public async getConfigsByCategory(category: ConfigCategory): Promise<Record<string, any>> {
    const configs: Record<string, any> = {};
    const template = this.templates[category] || [];

    for (const item of template) {
      configs[item.key] = await this.getConfig(item.key, item.defaultValue);
    }

    return configs;
  }

  // 批量设置配置
  public async setConfigs(configs: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(configs)) {
      await this.setConfig(key, value);
    }
  }

  // 删除配置
  public async deleteConfig(key: string): Promise<void> {
    try {
      await this.db.delete(this.tables.systemConfigs).where(eq(this.tables.systemConfigs.key, key));

      this.configCache.delete(key);
      this.logger.info('配置 ' + (key) + ' 已删除');
    } catch (error) {
      this.logger.error(
        '删除配置 ' + (key) + ' 失败',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  // 获取所有配置（用于管理界面）
  public async getAllConfigs(): Promise<Record<string, any>> {
    const allConfigs: Record<string, any> = {};

    // 先获取数据库中所有实际存在的配置
    const dbConfigs = await this.db.select().from(this.tables.systemConfigs);
    const dbConfigKeys = new Set(dbConfigs.map((c: any) => c.key));

    for (const [category, items] of Object.entries(this.templates)) {
      allConfigs[category] = {};

      for (const item of items) {
        // 只显示数据库中实际存在的配置
        if (dbConfigKeys.has(item.key)) {
          const value = await this.getConfig(item.key, item.defaultValue);
          allConfigs[category][item.key] = {
            ...item,
            value: item.isSensitive ? '' : value, // 敏感信息隐藏
            isStored: true, // 标记为已存储
          };
        }
      }
    }

    return allConfigs;
  }

  // 刷新配置缓存
  public async refreshCache(): Promise<void> {
    this.configCache.clear();
    await this.loadConfigsFromDatabase();
  }

  // 配置验证
  public validateConfig(key: string, value: any): boolean {
    const type = this.getConfigType(key);
    const isRequired = this.isRequiredConfig(key);

    if (isRequired && (value === undefined || value === null || value === '')) {
      throw new Error('配置 ' + (key) + ' 是必需的');
    }

    try {
      this.validateValue(value, type);
      return true;
    } catch (error: any) {
      throw new Error('配置 ' + (key) + ' 值无效: ' + (error.message));
    }
  }

  // 私有方法：加密
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  // 私有方法：解密
  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    const parts = encryptedText.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('无效的加密数据格式');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // 私有方法：解析值类型
  private parseValue(value: string, type: ConfigType): any {
    switch (type) {
      case 'number':
        return parseInt(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  // 私有方法：验证值
  private validateValue(value: any, type: ConfigType): any {
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error('值必须是数字');
        return num;
      case 'boolean':
        return Boolean(value);
      case 'json':
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return value;
      default:
        return value;
    }
  }

  // 私有方法：获取配置类型
  private getConfigType(key: string): ConfigType {
    const metadata = this.metadataCache.get(key);
    return metadata?.type || 'string';
  }

  // 私有方法：获取配置分类
  private getConfigCategory(key: string): ConfigCategory {
    const metadata = this.metadataCache.get(key);
    return (metadata?.category as ConfigCategory) || ConfigCategory.SYSTEM;
  }

  // 私有方法：检查是否为敏感配置
  private isSensitiveConfig(key: string): boolean {
    const metadata = this.metadataCache.get(key);
    return metadata?.isSensitive || false;
  }

  // 私有方法：检查是否为必需配置
  private isRequiredConfig(key: string): boolean {
    const metadata = this.metadataCache.get(key);
    return metadata?.isRequired || false;
  }

  // 私有方法：获取配置描述
  private getConfigDescription(key: string): string {
    const metadata = this.metadataCache.get(key);
    return metadata?.defaultDescription || '';
  }

  // 新增方法：创建或更新配置元数据
  public async setConfigMetadata(
    key: string,
    category: string,
    type: ConfigType = 'string',
    options: {
      isSensitive?: boolean;
      isRequired?: boolean;
      defaultDescription?: string;
    } = {}
  ): Promise<void> {
    if (!this.tables.configMetadata) {
      this.logger.warn('配置元数据表未提供，跳过元数据设置');
      return;
    }

    try {
      const now = new Date().toISOString();
      const existing = await this.db
        .select()
        .from(this.tables.configMetadata)
        .where(eq(this.tables.configMetadata.key, key))
        .limit(1);

      if (existing.length > 0) {
        await this.db
          .update(this.tables.configMetadata)
          .set({
            category,
            type,
            isSensitive: options.isSensitive ?? false,
            isRequired: options.isRequired ?? false,
            defaultDescription: options.defaultDescription,
            updatedAt: now,
          })
          .where(eq(this.tables.configMetadata.key, key));
      } else {
        await this.db.insert(this.tables.configMetadata).values({
          key,
          category,
          type,
          isSensitive: options.isSensitive ?? false,
          isRequired: options.isRequired ?? false,
          defaultDescription: options.defaultDescription,
          createdAt: now,
          updatedAt: now,
        });
      }

      // 更新缓存
      this.metadataCache.set(key, {
        category,
        type,
        isSensitive: options.isSensitive ?? false,
        isRequired: options.isRequired ?? false,
        defaultDescription: options.defaultDescription,
      });

      this.logger.info('配置元数据 ' + (key) + ' 已更新');
    } catch (error) {
      this.logger.error(
        '设置配置元数据 ' + (key) + ' 失败',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

/**
 * 创建ConfigService实例的工厂函数
 */
export function createConfigService(options: ConfigServiceOptions): ConfigService {
  return new ConfigService(options);
}

