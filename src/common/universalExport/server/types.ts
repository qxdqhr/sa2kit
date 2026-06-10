/**
 * UniversalExport Server 端类型定义
 */

import type {
  ExportFormat,
  ExportConfig,
  ExportField,
  ExportStatus,
} from '../types';

// ============= 服务配置 =============

/** 导出服务配置 */
export interface UniversalExportServiceConfig {
  /** 数据库连接（可选） */
  db?: any;
  /** 导出文件存储目录 */
  exportDir?: string;
  /** 临时文件目录 */
  tempDir?: string;
  /** 最大导出行数 */
  maxRows?: number;
  /** 是否启用流式导出 */
  enableStreaming?: boolean;
  /** 导出超时时间（毫秒） */
  timeout?: number;
}

// ============= 导出引擎接口 =============

/** 导出引擎接口 */
export interface IExportEngine {
  /** 引擎格式 */
  readonly format: ExportFormat;

  /** 导出数据 */
  export(data: any[], config: ExportConfig): Promise<ExportResult>;

  /** 流式导出 */
  exportStream?(data: AsyncIterable<any>, config: ExportConfig): Promise<ExportResult>;

  /** 验证配置 */
  validateConfig(config: ExportConfig): boolean;

  /** 获取引擎信息 */
  getInfo(): EngineInfo;
}

/** 引擎信息 */
export interface EngineInfo {
  /** 引擎名称 */
  name: string;
  /** 支持的格式 */
  format: ExportFormat;
  /** 支持流式导出 */
  supportsStreaming: boolean;
  /** 最大行数限制 */
  maxRows?: number;
}

// ============= 导出结果 =============

/** 导出结果 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean;
  /** 文件路径 */
  filePath?: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 导出行数 */
  rowCount: number;
  /** 导出时长（毫秒） */
  duration: number;
  /** 错误信息 */
  error?: string;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/** 导出进度 */
export interface ExportProgress {
  /** 任务 ID */
  taskId: string;
  /** 当前状态 */
  status: ExportStatus;
  /** 已处理行数 */
  processedRows: number;
  /** 总行数 */
  totalRows: number;
  /** 进度百分比 */
  percentage: number;
  /** 剩余时间（秒） */
  estimatedTime?: number;
  /** 错误信息 */
  error?: string;
}

// ============= 数据处理 =============

/** 数据转换器 */
export interface DataTransformer {
  /** 转换数据行 */
  transform(row: any, config: ExportConfig): any;

  /** 批量转换 */
  transformBatch?(rows: any[], config: ExportConfig): any[];
}

/** 字段映射器 */
export interface FieldMapper {
  /** 映射字段 */
  map(value: any, field: ExportField): any;
}

/** 数据验证器 */
export interface Validator {
  /** 验证数据 */
  validate(data: any[], config: ExportConfig): ValidationResult;
}

/** 验证结果 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误列表 */
  errors: ValidationError[];
}

/** 验证错误 */
export interface ValidationError {
  /** 行号 */
  row: number;
  /** 字段 */
  field: string;
  /** 错误消息 */
  message: string;
}

// ============= 数据源接口 =============

/** 数据源接口 */
export interface IDataSource {
  /** 获取数据 */
  getData(query: any, options?: DataQueryOptions): Promise<any[]>;

  /** 获取数据流 */
  getDataStream?(query: any, options?: DataQueryOptions): AsyncIterable<any>;

  /** 获取总数 */
  getCount(query: any): Promise<number>;
}

/** 数据查询选项 */
export interface DataQueryOptions {
  /** 分页 */
  page?: number;
  pageSize?: number;
  /** 排序 */
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  /** 过滤 */
  filters?: Record<string, any>;
}

// ============= 任务管理 =============

/** 任务创建选项 */
export interface TaskCreateOptions {
  /** 配置 ID */
  configId: string;
  /** 导出格式 */
  format: ExportFormat;
  /** 查询条件 */
  query?: any;
  /** 创建者 ID */
  creatorId?: string;
  /** 任务名称 */
  name?: string;
  /** 任务描述 */
  description?: string;
}

/** 任务更新选项 */
export interface TaskUpdateOptions {
  /** 任务状态 */
  status?: ExportStatus;
  /** 进度 */
  progress?: number;
  /** 文件路径 */
  filePath?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 导出行数 */
  rowCount?: number;
  /** 错误信息 */
  error?: string;
}

// ============= 数据库记录类型 =============

/** 导出配置记录 */
export interface ExportConfigRecord {
  /** 配置 ID */
  id: string;
  /** 配置名称 */
  name: string;
  /** 配置描述 */
  description?: string;
  /** 导出格式 */
  format: ExportFormat;
  /** 字段定义 */
  fields: ExportField[];
  /** 创建时间 */
  createdAt: Date | string;
  /** 更新时间 */
  updatedAt: Date | string;
  /** 创建者 ID */
  creatorId?: string;
}

/** 导出任务记录 */
export interface ExportTaskRecord {
  /** 任务 ID */
  id: string;
  /** 配置 ID */
  configId: string;
  /** 任务状态 */
  status: ExportStatus;
  /** 文件路径 */
  filePath?: string;
  /** 导出进度 */
  progress?: number;
  /** 创建时间 */
  createdAt: Date | string;
  /** 更新时间 */
  updatedAt: Date | string;
  /** 完成时间 */
  completedAt?: Date | string;
}

/** 导出历史记录 */
export interface ExportHistoryRecord {
  /** 历史 ID */
  id: string;
  /** 任务 ID */
  taskId: string;
  /** 配置 ID */
  configId: string;
  /** 导出格式 */
  format: ExportFormat;
  /** 导出状态 */
  status: ExportStatus;
  /** 文件路径 */
  filePath?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 导出行数 */
  rowCount: number;
  /** 导出时长 */
  duration: number;
  /** 创建者 ID */
  creatorId?: string;
  /** 创建时间 */
  createdAt: Date | string;
  /** 错误信息 */
  error?: string;
}

// ============= 事件类型 =============

/** 导出事件类型 */
export type ExportEventType =
  | 'task:created'
  | 'task:started'
  | 'task:progress'
  | 'task:completed'
  | 'task:failed'
  | 'task:cancelled'
  | 'config:created'
  | 'config:updated'
  | 'config:deleted';

/** 导出事件 */
export interface ExportEvent {
  /** 事件类型 */
  type: ExportEventType;
  /** 任务 ID */
  taskId?: string;
  /** 配置 ID */
  configId?: string;
  /** 事件数据 */
  data?: any;
  /** 时间戳 */
  timestamp: Date;
}

/** 事件监听器 */
export type ExportEventListener = (event: ExportEvent) => void | Promise<void>;

// ============= 工具类型 =============

/** 格式化器函数 */
export type FormatterFunction = (value: any) => string;

/** 聚合函数 */
export type AggregateFunction = (values: any[]) => any;

/** 自定义处理函数 */
export type CustomProcessor = (values: any[]) => any;

