/**
 * 配置模板
 *
 * 提供常用的配置项模板，可用于初始化默认配置
 */

import { ConfigCategory, type ConfigType, type ConfigItem } from './types';

/**
 * 配置模板类型
 */
export type ConfigTemplates = Record<string, ConfigItem[]>;

/**
 * 默认配置模板
 *
 * 包含常见的配置项，可作为参考或直接使用
 */
export const DEFAULT_CONFIG_TEMPLATES: ConfigTemplates = {
  // 数据库相关的业务配置（非连接配置）
  [ConfigCategory.DATABASE]: [
    {
      key: 'database_pool_size',
      value: 10,
      category: ConfigCategory.DATABASE,
      type: 'number',
      isRequired: false,
      isSensitive: false,
      description: '数据库连接池大小',
      defaultValue: 10,
      group: '连接池配置',
    },
    {
      key: 'database_query_timeout',
      value: 30000,
      category: ConfigCategory.DATABASE,
      type: 'number',
      isRequired: false,
      isSensitive: false,
      description: '数据库查询超时时间（毫秒）',
      defaultValue: 30000,
      group: '连接池配置',
    },
    {
      key: 'enable_query_logging',
      value: false,
      category: ConfigCategory.DATABASE,
      type: 'boolean',
      isRequired: false,
      isSensitive: false,
      description: '启用数据库查询日志',
      defaultValue: false,
      group: '连接池配置',
    },
  ],

  // 存储配置
  [ConfigCategory.STORAGE]: [
    {
      key: 'storage_type',
      value: 'local',
      category: ConfigCategory.STORAGE,
      type: 'string',
      isRequired: true,
      isSensitive: false,
      description: '存储类型（local/aliyun-oss/aws-s3）',
      defaultValue: 'local',
      group: '基础配置',
    },
    {
      key: 'upload_max_size',
      value: 10485760,
      category: ConfigCategory.STORAGE,
      type: 'number',
      isRequired: false,
      isSensitive: false,
      description: '最大上传文件大小（字节）',
      defaultValue: 10485760,
      group: '上传配置',
    },
  ],

  // 安全配置
  [ConfigCategory.SECURITY]: [
    {
      key: 'jwt_secret',
      value: '',
      category: ConfigCategory.SECURITY,
      type: 'string',
      isRequired: true,
      isSensitive: true,
      description: 'JWT签名密钥',
    },
    {
      key: 'jwt_expires_in',
      value: '7d',
      category: ConfigCategory.SECURITY,
      type: 'string',
      isRequired: true,
      isSensitive: false,
      description: 'JWT过期时间',
      defaultValue: '7d',
    },
    {
      key: 'enable_rate_limiting',
      value: true,
      category: ConfigCategory.SECURITY,
      type: 'boolean',
      isRequired: false,
      isSensitive: false,
      description: '启用API速率限制',
      defaultValue: true,
    },
  ],

  // 系统配置
  [ConfigCategory.SYSTEM]: [
    {
      key: 'app_name',
      value: 'My App',
      category: ConfigCategory.SYSTEM,
      type: 'string',
      isRequired: true,
      isSensitive: false,
      description: '应用名称',
      defaultValue: 'My App',
    },
    {
      key: 'maintenance_mode',
      value: false,
      category: ConfigCategory.SYSTEM,
      type: 'boolean',
      isRequired: false,
      isSensitive: false,
      description: '维护模式',
      defaultValue: false,
    },
    {
      key: 'log_level',
      value: 'info',
      category: ConfigCategory.SYSTEM,
      type: 'string',
      isRequired: false,
      isSensitive: false,
      description: '日志级别',
      defaultValue: 'info',
    },
  ],
};

/**
 * 创建自定义配置模板
 *
 * @param templates 配置模板
 * @returns 合并后的配置模板
 */
export function createConfigTemplates(templates: Partial<ConfigTemplates>): ConfigTemplates {
  const filteredTemplates: ConfigTemplates = { ...DEFAULT_CONFIG_TEMPLATES };

  Object.keys(templates).forEach((key) => {
    const value = templates[key];
    if (value !== undefined) {
      filteredTemplates[key] = value;
    }
  });

  return filteredTemplates;
}

