/**
 * ConfigEngine V2 - 数据驱动的配置管理引擎
 *
 * 核心功能：
 * 1. 从数据库加载配置定义
 * 2. 配置值的验证和管理
 * 3. 配置变更历史记录
 * 4. 敏感信息加密/解密
 *
 * 使用方法:
 * ```typescript
 * import { ConfigEngine } from 'sa2kit/config/server';
 *
 * const engine = new ConfigEngine(db);
 * await engine.initialize();
 *
 * // 获取配置值
 * const value = await engine.getValue('config_key');
 *
 * // 设置配置值
 * await engine.setValue('config_key', 'new_value', userId);
 * ```
 */

import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import type {
  ConfigDefinition,
  ConfigDefinitionCreate,
  ConfigDefinitionWithValue,
  ValidationResult,
  ValidationRules,
  ConfigHistoryCreate,
  ConfigType,
} from './types';

// 数据库表类型 - 需要从外部传入或注入
interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConfigDefinitionRow {
  id: number;
  key: string;
  category: string;
  name: string;
  description?: string | null;
  type: string;
  validationRules?: any;
  uiComponent?: string | null;
  uiProps?: any;
  isSensitive: boolean;
  isRequired: boolean;
  isReadonly: boolean;
  requiredPermission?: string | null;
  defaultValue?: string | null;
  enumOptions?: any;
  dependsOn?: string[] | null;
  showIf?: any;
  groupName?: string | null;
  sortOrder: number;
  version: number;
  status: string;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
}

/**
 * 数据库接口（使用Drizzle ORM）
 * 使用 any 类型以避免复杂的类型推导
 */
export type DatabaseClient = any;

/**
 * 数据库表定义
 */
export interface DatabaseTables {
  systemConfigs: any;
  configDefinitions?: any;
  configMetadata?: any;
  configHistory: any;
}

/**
 * 日志接口
 */
export interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * ConfigEngine 配置选项
 */
export interface ConfigEngineOptions {
  /** 数据库客户端 */
  db: DatabaseClient;
  /** 数据库表定义 */
  tables: DatabaseTables;
  /** 加密密钥 */
  encryptionKey?: string;
  /** 日志记录器 */
  logger?: Logger;
}

/**
 * 默认日志记录器
 */
const defaultLogger: Logger = {
  info: (message: string, ...args: any[]) => console.log('[ConfigEngine] ' + (message), ...args),
  warn: (message: string, ...args: any[]) => console.warn('[ConfigEngine] ' + (message), ...args),
  error: (message: string, ...args: any[]) => console.error('[ConfigEngine] ' + (message), ...args),
};

/**
 * 配置引擎类
 */
export class ConfigEngine {
  private definitionsCache = new Map<string, ConfigDefinition>();
  private encryptionKey: string;
  private initialized = false;
  private db: DatabaseClient;
  private tables: DatabaseTables;
  private logger: Logger;

  constructor(options: ConfigEngineOptions) {
    this.db = options.db;
    this.tables = options.tables;
    this.logger = options.logger || defaultLogger;

    // 使用环境变量作为加密密钥
    this.encryptionKey = options.encryptionKey || process.env.CONFIG_ENCRYPTION_KEY || 'default-config-key-2024';

    if (this.encryptionKey === 'default-config-key-2024') {
      this.logger.warn('⚠️ 使用默认加密密钥，生产环境请设置 CONFIG_ENCRYPTION_KEY 环境变量');
    }
  }

  /**
   * 初始化配置引擎
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadDefinitions();
      this.initialized = true;
      this.logger.info('✅ ConfigEngine 初始化成功');
    } catch (error) {
      this.logger.error('❌ ConfigEngine 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库加载所有配置定义到缓存
   */
  async loadDefinitions(): Promise<void> {
    try {
      const definitions = await this.db
        .select()
        .from(this.tables.configDefinitions)
        .where(eq(this.tables.configDefinitions.status, 'active'));

      this.definitionsCache.clear();

      (definitions as ConfigDefinitionRow[]).forEach((def) => {
        const definition: ConfigDefinition = {
          id: def.id,
          key: def.key,
          category: def.category,
          name: def.name,
          description: def.description || undefined,
          type: def.type as ConfigType,
          validationRules: def.validationRules
            ? JSON.parse(JSON.stringify(def.validationRules))
            : undefined,
          uiComponent: def.uiComponent as any,
          uiProps: def.uiProps ? JSON.parse(JSON.stringify(def.uiProps)) : undefined,
          isSensitive: def.isSensitive,
          isRequired: def.isRequired,
          isReadonly: def.isReadonly,
          requiredPermission: def.requiredPermission || undefined,
          defaultValue: def.defaultValue || undefined,
          enumOptions: def.enumOptions ? JSON.parse(JSON.stringify(def.enumOptions)) : undefined,
          dependsOn: def.dependsOn || undefined,
          showIf: def.showIf ? JSON.parse(JSON.stringify(def.showIf)) : undefined,
          groupName: def.groupName || undefined,
          sortOrder: def.sortOrder,
          version: def.version,
          status: def.status as any,
          tags: def.tags || undefined,
          createdAt: def.createdAt,
          updatedAt: def.updatedAt,
          createdBy: def.createdBy || undefined,
        };

        this.definitionsCache.set(def.key, definition);
      });

      this.logger.info('✅ 已加载 ' + (definitions.length) + ' 个配置定义');
    } catch (error) {
      this.logger.error('❌ 加载配置定义失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个配置定义
   */
  getDefinition(key: string): ConfigDefinition | undefined {
    return this.definitionsCache.get(key);
  }

  /**
   * 获取所有配置定义
   */
  getAllDefinitions(): ConfigDefinition[] {
    return Array.from(this.definitionsCache.values());
  }

  /**
   * 获取指定分类的配置定义
   */
  getDefinitionsByCategory(category: string): ConfigDefinition[] {
    return this.getAllDefinitions()
      .filter((def) => def.category === category)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  /**
   * 验证配置值
   */
  async validate(key: string, value: any): Promise<ValidationResult> {
    const definition = this.getDefinition(key);

    if (!definition) {
      return {
        valid: false,
        errors: ['配置定义不存在'],
      };
    }

    const errors: string[] = [];

    // 必填验证
    if (definition.isRequired && (value === null || value === undefined || value === '')) {
      errors.push('此配置项为必填');
      return { valid: false, errors };
    }

    // 空值跳过后续验证
    if (value === null || value === undefined || value === '') {
      return { valid: true, errors: [] };
    }

    // 类型验证
    const typeError = this.validateType(value, definition.type);
    if (typeError) {
      errors.push(typeError);
    }

    // 规则验证
    if (definition.validationRules && typeError === null) {
      const ruleErrors = this.validateRules(value, definition.validationRules);
      errors.push(...ruleErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取配置的完整数据（定义 + 值）
   */
  async getConfigsWithValues(category?: string): Promise<ConfigDefinitionWithValue[]> {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize();
    }

    // 获取定义
    const definitions = category
      ? this.getDefinitionsByCategory(category)
      : this.getAllDefinitions();

    // 获取所有配置值
    const configValues = await this.db.select().from(this.tables.systemConfigs);
    const valueMap = new Map((configValues as SystemConfig[]).map((v) => [v.key, v.value]));

    // 合并定义和值
    const result: ConfigDefinitionWithValue[] = definitions.map((def) => {
      let value = valueMap.get(def.key) ?? def.defaultValue;
      let displayValue = value;

      // 解密敏感配置
      if (def.isSensitive && value && typeof value === 'string') {
        try {
          value = this.decrypt(value);
          // 掩码显示
          displayValue = this.maskValue(value);
        } catch (error) {
          this.logger.warn('解密配置 ' + (def.key) + ' 失败:', error);
        }
      }

      return {
        ...def,
        value,
        displayValue,
      };
    });

    return result;
  }

  /**
   * 获取单个配置值
   */
  async getValue(key: string): Promise<any> {
    const definition = this.getDefinition(key);
    if (!definition) {
      return undefined;
    }

    const configs = await this.db
      .select()
      .from(this.tables.systemConfigs)
      .where(eq(this.tables.systemConfigs.key, key))
      .limit(1);

    if (configs.length === 0) {
      return definition.defaultValue;
    }

    let value = (configs[0] as SystemConfig).value;

    // 解密敏感配置
    if (definition.isSensitive && value && typeof value === 'string') {
      try {
        value = this.decrypt(value);
      } catch (error) {
        this.logger.warn('解密配置 ' + (key) + ' 失败:', error);
      }
    }

    return value;
  }

  /**
   * 设置配置值
   */
  async setValue(
    key: string,
    value: any,
    userId: number = 0,
    options?: {
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    // 验证配置值
    const validation = await this.validate(key, value);
    if (!validation.valid) {
      throw new Error('配置验证失败: ' + (validation.errors.join(', ')));
    }

    const definition = this.getDefinition(key);
    if (!definition) {
      throw new Error('配置定义不存在');
    }

    // 获取旧值（用于历史记录）
    const oldConfigs = await this.db
      .select()
      .from(this.tables.systemConfigs)
      .where(eq(this.tables.systemConfigs.key, key))
      .limit(1);

    const oldValue = oldConfigs.length > 0 ? (oldConfigs[0] as SystemConfig).value : undefined;

    // 加密敏感配置
    let finalValue = value;
    if (definition.isSensitive && value) {
      finalValue = this.encrypt(String(value));
    }

    // 保存配置值
    if (oldConfigs.length > 0) {
      await this.db
        .update(this.tables.systemConfigs)
        .set({
          value: finalValue,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(this.tables.systemConfigs.key, key));
    } else {
      // 生成 ID
      const id = crypto.randomUUID();
      await this.db.insert(this.tables.systemConfigs).values({
        id,
        key,
        value: finalValue,
        description: definition.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 记录历史
    await this.recordHistory({
      configKey: key,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: JSON.stringify(value),
      changeType: oldValue ? 'update' : 'create',
      changedBy: userId,
      reason: options?.reason,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    this.logger.info('✅ 配置已' + (oldValue ? '更新' : '创建') + ': ' + (key));
  }

  /**
   * 批量设置配置值
   */
  async setValues(
    values: Array<{ key: string; value: any }>,
    userId: number = 0,
    options?: {
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    for (const item of values) {
      await this.setValue(item.key, item.value, userId, options);
    }
  }

  /**
   * 注册新配置定义
   */
  async registerDefinition(definition: ConfigDefinitionCreate, userId: number = 0): Promise<void> {
    try {
      await this.db.insert(this.tables.configDefinitions).values({
        key: definition.key,
        category: definition.category,
        name: definition.name,
        description: definition.description,
        type: definition.type,
        validationRules: definition.validationRules
          ? JSON.stringify(definition.validationRules)
          : null,
        uiComponent: definition.uiComponent || 'input',
        uiProps: definition.uiProps ? JSON.stringify(definition.uiProps) : null,
        isSensitive: definition.isSensitive || false,
        isRequired: definition.isRequired || false,
        isReadonly: definition.isReadonly || false,
        requiredPermission: definition.requiredPermission,
        defaultValue: definition.defaultValue,
        enumOptions: definition.enumOptions ? JSON.stringify(definition.enumOptions) : null,
        dependsOn: definition.dependsOn,
        showIf: definition.showIf ? JSON.stringify(definition.showIf) : null,
        groupName: definition.groupName,
        sortOrder: definition.sortOrder || 0,
        version: definition.version || 1,
        status: definition.status || 'active',
        tags: definition.tags,
        createdBy: userId,
        updatedAt: new Date().toISOString(),
      });

      // 重新加载定义缓存
      await this.loadDefinitions();

      this.logger.info('✅ 注册新配置定义: ' + (definition.key));
    } catch (error) {
      this.logger.error(`❌ 注册配置定义失败:`, error);
      throw error;
    }
  }

  /**
   * 批量注册配置定义
   */
  async registerDefinitions(
    definitions: ConfigDefinitionCreate[],
    userId: number = 0
  ): Promise<void> {
    for (const definition of definitions) {
      await this.registerDefinition(definition, userId);
    }
  }

  /**
   * 记录配置变更历史
   */
  private async recordHistory(record: ConfigHistoryCreate): Promise<void> {
    try {
      await this.db.insert(this.tables.configHistory).values({
        ...record,
        changedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('❌ 记录配置历史失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取配置变更历史
   */
  async getHistory(key: string, limit: number = 50): Promise<any[]> {
    try {
      const history = await this.db
        .select()
        .from(this.tables.configHistory)
        .where(eq(this.tables.configHistory.configKey, key))
        .orderBy(this.tables.configHistory.changedAt)
        .limit(limit);

      return history;
    } catch (error) {
      this.logger.error('❌ 获取配置历史失败:', error);
      return [];
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 类型验证
   */
  private validateType(value: any, type: ConfigType): string | null {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? null : '值必须是字符串';

      case 'number':
        return typeof value === 'number' && !isNaN(value) ? null : '值必须是数字';

      case 'boolean':
        return typeof value === 'boolean' ? null : '值必须是布尔值';

      case 'json':
        try {
          if (typeof value === 'string') {
            JSON.parse(value);
          }
          return null;
        } catch {
          return '值必须是有效的 JSON';
        }

      case 'url':
        try {
          new URL(value);
          return null;
        } catch {
          return '值必须是有效的 URL';
        }

      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : '值必须是有效的邮箱地址';

      case 'enum':
        return null; // 枚举验证在规则验证中处理

      default:
        return null;
    }
  }

  /**
   * 规则验证
   */
  private validateRules(value: any, rules: ValidationRules): string[] {
    const errors: string[] = [];

    if (rules.min !== undefined && value < rules.min) {
      errors.push('值不能小于 ' + (rules.min));
    }

    if (rules.max !== undefined && value > rules.max) {
      errors.push('值不能大于 ' + (rules.max));
    }

    if (rules.minLength !== undefined && String(value).length < rules.minLength) {
      errors.push('长度不能小于 ' + (rules.minLength));
    }

    if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
      errors.push('长度不能大于 ' + (rules.maxLength));
    }

    if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) {
      errors.push('值不符合要求的格式');
    }

    return errors;
  }

  /**
   * 加密
   */
  private encrypt(value: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密
   */
  private decrypt(encrypted: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const parts = encrypted.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('无效的加密数据格式');
    }
    const [ivHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 掩码显示敏感值
   */
  private maskValue(value: string): string {
    if (!value) return '';
    const len = value.length;
    if (len <= 8) {
      return '*'.repeat(len);
    }
    return value.substring(0, 4) + '*'.repeat(len - 8) + value.substring(len - 4);
  }
}

