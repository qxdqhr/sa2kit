/**
 * 通用导出服务类型定义
 *
 * 定义了导出功能的核心接口和类型
 */

// ============= 基础类型定义 =============

/** 导出格式类型 */
export type ExportFormat = 'csv' | 'excel' | 'json';

/** 字段类型 */
export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';

/** 字段对齐方式 */
export type FieldAlignment = 'left' | 'center' | 'right';

/** 导出状态 */
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** 分组模式 */
export type GroupingMode = 'merge' | 'separate' | 'nested';

/** 分组处理类型 */
export type GroupValueProcessing = 'first' | 'last' | 'concat' | 'sum' | 'count' | 'custom';

// ============= 字段定义接口 =============

/** 导出字段定义 */
export interface ExportField {
  /** 字段键名 */
  key: string;
  /** 字段显示名称 */
  label: string;
  /** 字段类型 */
  type: FieldType;
  /** 是否启用 */
  enabled: boolean;
  /** 字段宽度 */
  width?: number;
  /** 对齐方式 */
  alignment?: FieldAlignment;
  /** 格式化函数 */
  formatter?: (value: any) => string;
  /** 排序权重 */
  sortOrder?: number;
  /** 是否必填 */
  required?: boolean;
  /** 字段描述 */
  description?: string;
  /** 自定义样式 */
  style?: Record<string, any>;
}

/** 分组字段配置 */
export interface GroupingField {
  /** 分组字段键名 */
  key: string;
  /** 分组字段显示名称 */
  label: string;
  /** 分组模式 */
  mode: GroupingMode;
  /** 其他字段的值处理方式 */
  valueProcessing: GroupValueProcessing;
  /** 自定义处理函数 */
  customProcessor?: (values: any[]) => any;
  /** 是否显示分组行 */
  showGroupHeader: boolean;
  /** 分组行模板 */
  groupHeaderTemplate?: string;
  /** 是否合并单元格（仅Excel格式支持） */
  mergeCells: boolean;
}

/** 分组配置 */
export interface GroupingConfig {
  /** 是否启用分组 */
  enabled: boolean;
  /** 分组字段列表（支持多级分组） */
  fields: GroupingField[];
  /** 分组后是否保持原始顺序 */
  preserveOrder: boolean;
  /** 空值处理方式 */
  nullValueHandling: 'skip' | 'group' | 'separate';
  /** 空值分组名称 */
  nullGroupName?: string;
}

/** 导出配置 */
export interface ExportConfig {
  /** 配置ID */
  id: string;
  /** 配置名称 */
  name: string;
  /** 配置描述 */
  description?: string;
  /** 导出格式 */
  format: ExportFormat;
  /** 字段定义 */
  fields: ExportField[];
  /** 分组配置 */
  grouping?: GroupingConfig;
  /** 文件名模板 */
  fileNameTemplate: string;
  /** 是否包含表头 */
  includeHeader: boolean;
  /** 分隔符 */
  delimiter: string;
  /** 编码格式 */
  encoding: string;
  /** 是否添加BOM */
  addBOM: boolean;
  /** 最大行数限制 */
  maxRows?: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 模块标识 */
  moduleId: string;
  /** 业务标识 */
  businessId?: string;
  /** 创建者ID */
  createdBy?: string;
}

/** 导出请求 */
export interface ExportRequest {
  /** 导出配置ID或配置对象 */
  configId: string | ExportConfig;
  /** 数据源 */
  dataSource: string | (() => Promise<any[]>);
  /** 查询参数 */
  queryParams?: Record<string, any>;
  /** 自定义字段映射 */
  fieldMapping?: Record<string, string>;
  /** 过滤条件 */
  filters?: ExportFilter[];
  /** 排序条件 */
  sortBy?: ExportSort[];
  /** 分页参数 */
  pagination?: {
    page: number;
    pageSize: number;
  };
  /** 自定义文件名 */
  customFileName?: string;
  /** 回调函数 */
  callbacks?: {
    onProgress?: (progress: ExportProgress) => void;
    onSuccess?: (result: ExportResult) => void;
    onError?: (error: ExportError) => void;
  };
}

/** 导出过滤器 */
export interface ExportFilter {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'in'
    | 'notIn';
  /** 值 */
  value: any;
}

/** 导出排序 */
export interface ExportSort {
  /** 字段名 */
  field: string;
  /** 排序方向 */
  direction: 'asc' | 'desc';
}

/** 导出进度 */
export interface ExportProgress {
  /** 导出ID */
  exportId: string;
  /** 状态 */
  status: ExportStatus;
  /** 进度百分比 */
  progress: number;
  /** 已处理行数 */
  processedRows: number;
  /** 总行数 */
  totalRows: number;
  /** 开始时间 */
  startTime: Date;
  /** 预计完成时间 */
  estimatedEndTime?: Date;
  /** 当前处理的数据 */
  currentData?: any;
  /** 错误信息 */
  error?: string;
}

/** 导出结果 */
export interface ExportResult {
  /** 导出ID */
  exportId: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小 */
  fileSize: number;
  /** 文件URL */
  fileUrl?: string;
  /** 文件Blob */
  fileBlob?: Blob;
  /** 导出行数 */
  exportedRows: number;
  /** 开始时间 */
  startTime: Date;
  /** 完成时间 */
  endTime: Date;
  /** 耗时(毫秒) */
  duration: number;
  /** 统计信息 */
  statistics?: {
    totalRows: number;
    filteredRows: number;
    exportedRows: number;
    skippedRows: number;
  };
}

/** 导出错误 */
export interface ExportError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: Record<string, any>;
  /** 错误时间 */
  timestamp: Date;
}

// ============= 服务配置接口 =============

/** 通用导出服务配置 */
export interface UniversalExportServiceConfig {
  /** 默认导出格式 */
  defaultFormat: ExportFormat;
  /** 默认分隔符 */
  defaultDelimiter: string;
  /** 默认编码 */
  defaultEncoding: string;
  /** 是否默认添加BOM */
  defaultAddBOM: boolean;
  /** 最大文件大小限制(字节) */
  maxFileSize: number;
  /** 最大行数限制 */
  maxRowsLimit: number;
  /** 并发导出数量限制 */
  maxConcurrentExports: number;
  /** 导出超时时间(毫秒) */
  exportTimeout: number;
  /** 缓存配置 */
  cache: {
    /** 配置缓存TTL(秒) */
    configTTL: number;
    /** 结果缓存TTL(秒) */
    resultTTL: number;
  };
}

// ============= 异常类定义 =============

/** 导出服务基础异常 */
export class ExportServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ExportServiceError';
  }
}

/** 导出配置错误 */
export class ExportConfigError extends ExportServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'EXPORT_CONFIG_ERROR', details);
    this.name = 'ExportConfigError';
  }
}

/** 导出数据处理错误 */
export class ExportDataError extends ExportServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'EXPORT_DATA_ERROR', details);
    this.name = 'ExportDataError';
  }
}

/** 导出文件生成错误 */
export class ExportFileError extends ExportServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'EXPORT_FILE_ERROR', details);
    this.name = 'ExportFileError';
  }
}

// ============= 事件类型定义 =============

/** 导出事件类型 */
export type ExportEventType =
  | 'export:start'
  | 'export:progress'
  | 'export:complete'
  | 'export:error'
  | 'export:cancel'
  | 'config:save'
  | 'config:delete';

/** 导出事件 */
export interface ExportEvent {
  /** 事件类型 */
  type: ExportEventType;
  /** 导出ID */
  exportId: string;
  /** 事件时间 */
  timestamp: Date;
  /** 事件数据 */
  data?: Record<string, any>;
  /** 错误信息 */
  error?: string;
}

/** 导出事件监听器 */
export type ExportEventListener = (event: ExportEvent) => void | Promise<void>;

// ============= 工具类型 =============

/** 字段映射函数 */
export type FieldMapper<T = any> = (item: T, index: number) => Record<string, any>;

/** 数据转换函数 */
export type DataTransformer<T = any, R = any> = (data: T[]) => R[];

/** 验证函数 */
export type Validator<T = any> = (data: T) => boolean | string;

/** 格式化函数 */
export type Formatter<T = any> = (value: T) => string;
