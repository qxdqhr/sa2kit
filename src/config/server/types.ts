/**
 * 配置系统类型定义
 * ConfigEngine V2 - 数据驱动的配置管理
 */

// ==================== 基础类型 ====================

export type ConfigType = 'string' | 'number' | 'boolean' | 'json' | 'enum' | 'url' | 'email';

export type UiComponentType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'switch'
  | 'slider'
  | 'color-picker';

export type ConfigStatus = 'active' | 'deprecated' | 'disabled';

export type ChangeType = 'create' | 'update' | 'delete';

// ==================== 配置定义 ====================

/**
 * 验证规则
 */
export interface ValidationRules {
  /** 最小值（数字） */
  min?: number;
  /** 最大值（数字） */
  max?: number;
  /** 最小长度（字符串） */
  minLength?: number;
  /** 最大长度（字符串） */
  maxLength?: number;
  /** 正则表达式 */
  pattern?: string;
  /** 是否为邮箱 */
  email?: boolean;
  /** 是否为 URL */
  url?: boolean;
  /** 自定义验证函数名 */
  custom?: string;
}

/**
 * UI 组件属性
 */
export interface UiProps {
  /** 占位符 */
  placeholder?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 步长（数字输入） */
  step?: number;
  /** 行数（文本域） */
  rows?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大值（滑块） */
  max?: number;
  /** 最小值（滑块） */
  min?: number;
}

/**
 * 枚举选项
 */
export interface EnumOption {
  /** 显示标签 */
  label: string;
  /** 实际值 */
  value: any;
  /** 描述 */
  description?: string;
  /** 图标 */
  icon?: string;
}

/**
 * 配置定义（完整）
 */
export interface ConfigDefinition {
  // 基本信息
  id?: number;
  key: string;
  category: string;
  name: string;
  description?: string;

  // 类型和验证
  type: ConfigType;
  validationRules?: ValidationRules;

  // UI 配置
  uiComponent?: UiComponentType;
  uiProps?: UiProps;

  // 安全和权限
  isSensitive?: boolean;
  isRequired?: boolean;
  isReadonly?: boolean;
  requiredPermission?: string;

  // 默认值和选项
  defaultValue?: any;
  enumOptions?: EnumOption[];

  // 依赖和条件
  dependsOn?: string[];
  showIf?: Record<string, any>;

  // 分组和排序
  groupName?: string;
  sortOrder?: number;

  // 版本和状态
  version?: number;
  status?: ConfigStatus;

  // 标签
  tags?: string[];

  // 元数据
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: number;
}

/**
 * 配置定义（用于创建）
 */
export type ConfigDefinitionCreate = Omit<ConfigDefinition, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 配置定义（用于更新）
 */
export type ConfigDefinitionUpdate = Partial<ConfigDefinitionCreate>;

/**
 * 配置定义（带值）
 */
export interface ConfigDefinitionWithValue extends ConfigDefinition {
  value: any;
  displayValue?: any; // 用于敏感信息掩码
}

// ==================== 配置值 ====================

/**
 * 配置值
 */
export interface ConfigValue {
  key: string;
  value: any;
}

// ==================== 配置历史 ====================

/**
 * 配置变更历史
 */
export interface ConfigHistoryRecord {
  id?: number;
  configKey: string;
  oldValue?: string;
  newValue?: string;
  changeType: ChangeType;
  changedBy?: number;
  changedAt?: Date | string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 配置历史（用于创建）
 */
export type ConfigHistoryCreate = Omit<ConfigHistoryRecord, 'id' | 'changedAt'>;

// ==================== 验证结果 ====================

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ==================== API 响应 ====================

/**
 * API 成功响应
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

/**
 * API 响应（联合类型）
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== 配置分组 ====================

/**
 * 配置分组（UI 展示用）
 */
export interface ConfigGroup {
  groupName: string;
  definitions: ConfigDefinitionWithValue[];
}

/**
 * 分类配置（UI 展示用）
 */
export interface CategoryConfigs {
  category: string;
  groups: ConfigGroup[];
}

// ==================== 批量操作 ====================

/**
 * 批量注册配置定义
 */
export interface BatchRegisterRequest {
  definitions: ConfigDefinitionCreate[];
}

/**
 * 批量更新配置值
 */
export interface BatchUpdateValuesRequest {
  values: Array<{
    key: string;
    value: any;
  }>;
}

// ==================== 配置元数据 ====================

/**
 * 配置元数据缓存
 */
export interface ConfigMetadataCache {
  category: string;
  type: ConfigType;
  isSensitive: boolean;
  isRequired: boolean;
  defaultDescription?: string;
}

// ==================== 配置分类和模板 ====================

/**
 * 配置分类枚举
 */
export enum ConfigCategory {
  DATABASE = 'database',
  STORAGE = 'storage',
  AI_SERVICE = 'ai_service',
  EMAIL = 'email',
  SECURITY = 'security',
  SYSTEM = 'system',
  MOBILE = 'mobile',
  WECHAT = 'wechat',
}

/**
 * 配置项（用于模板）
 */
export interface ConfigItem {
  key: string;
  value: any;
  category: ConfigCategory;
  type: ConfigType;
  isRequired: boolean;
  isSensitive: boolean;
  description?: string;
  defaultValue?: any;
  group?: string; // 配置分组
  isGroupTemplate?: boolean; // 是否为组模板（可多次实例化）
  groupFields?: string[]; // 组内字段列表（用于多实例配置）
}

