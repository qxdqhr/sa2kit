/**
 * Config Server Module - 配置管理服务端模块
 *
 * 提供完整的配置管理解决方案，包括：
 * - 类型定义
 * - 数据库Schema
 * - ConfigEngine（数据驱动的配置引擎）
 * - ConfigService（简化的配置服务）
 *
 * @example
 * ```typescript
 * import { ConfigEngine, ConfigService } from 'sa2kit/config/server';
 * import { systemConfigs, configDefinitions, configHistory } from 'sa2kit/config/server';
 * import { ConfigCategory, ConfigType } from 'sa2kit/config/server';
 *
 * // 使用ConfigEngine
 * const engine = new ConfigEngine({ db, tables: { systemConfigs, configDefinitions, configHistory } });
 * await engine.initialize();
 *
 * // 使用ConfigService
 * const service = new ConfigService({ db, tables: { systemConfigs, configMetadata, configHistory } });
 * const apiKey = await service.getConfig('api_key');
 * ```
 *
 * @packageDocumentation
 */

// ==================== 类型定义 ====================
export type {
  // 基础类型（不包括ConfigType，因为它是enum）
  UiComponentType,
  ConfigStatus,
  ChangeType,

  // 配置定义
  ValidationRules,
  UiProps,
  EnumOption,
  ConfigDefinition,
  ConfigDefinitionCreate,
  ConfigDefinitionUpdate,
  ConfigDefinitionWithValue,

  // 配置值
  ConfigValue,

  // 配置历史
  ConfigHistoryRecord,
  ConfigHistoryCreate,

  // 验证结果
  ValidationResult,

  // API 响应
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,

  // 配置分组
  ConfigGroup,
  CategoryConfigs,

  // 批量操作
  BatchRegisterRequest,
  BatchUpdateValuesRequest,

  // 配置元数据
  ConfigMetadataCache,

  // 配置模板
  ConfigItem,
} from './types';

export {
  // 枚举
  ConfigCategory,
} from './types';

// 导出ConfigType类型
export type { ConfigType } from './types';

// ==================== 数据库Schema ====================
export {
  systemConfigs,
  configMetadata,
  configDefinitions,
  configHistory,
} from './schema';

// ==================== ConfigEngine ====================
export {
  ConfigEngine,
  type DatabaseClient,
  type DatabaseTables,
  type Logger,
  type ConfigEngineOptions,
} from './engine';

// ==================== ConfigService ====================
export {
  ConfigService,
  createConfigService,
  type ConfigTemplates,
  type ConfigServiceOptions,
} from './service';

// ==================== 配置模板 ====================
export {
  DEFAULT_CONFIG_TEMPLATES,
  createConfigTemplates,
} from './templates';

// ==================== 工厂函数 ====================
export {
  createConfigEngine,
  createGlobalConfigService,
  createGlobalConfigEngine,
} from './factory';

// ==================== 数据库配置工具 ====================
export type {
  DatabaseConnectionConfig,
  RedisConnectionConfig,
} from './database-config';

export {
  getDatabaseConfig,
  getRedisConfig,
  buildDatabaseUrl,
  buildRedisUrl,
  validateDatabaseConfig,
  getDatabaseConfigForDisplay,
} from './database-config';
