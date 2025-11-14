/**
 * UniversalExport Server 模块入口
 */

// 导出所有服务端类型
export type * from './types';

// 导出接口
export type {
  IExportEngine,
  IDataSource,
  UniversalExportServiceConfig,
  ExportResult,
  ExportProgress,
  DataTransformer,
  FieldMapper,
  Validator,
  ValidationResult,
  ValidationError,
  DataQueryOptions,
  TaskCreateOptions,
  TaskUpdateOptions,
  ExportConfigRecord,
  ExportTaskRecord,
  ExportHistoryRecord,
  ExportEvent,
  ExportEventListener,
  ExportEventType,
  EngineInfo,
  FormatterFunction,
  AggregateFunction,
  CustomProcessor,
} from './types';

// 服务类
export { UniversalExportService, type IExportClient } from './UniversalExportService';

// 初始化辅助函数
export {
  createUniversalExportService,
  createExportServiceConfig,
  createExportServiceFromEnv,
} from './factory';

// 预设配置
export {
  createSmallAppPreset,
  createMediumAppPreset,
  createLargeAppPreset,
  createRealtimeExportPreset,
  createBatchExportPreset,
  createSmartExportPreset,
} from './presets';

// 配置验证
export {
  validateExportConfig,
  validateEnvironment as validateExportEnvironment,
  ConfigValidationError as ExportConfigValidationError,
} from './validation';

// Engines（将在后续 Phase 中迁移）
// export { CsvEngine } from './engines/CsvEngine';
// export { ExcelEngine } from './engines/ExcelEngine';
// export { JsonEngine } from './engines/JsonEngine';

// 工具函数
export * from './utils';

// ============= Drizzle Schemas =============
export * from './drizzle-schemas';

// ============= Drizzle Database Services =============
export {
  ExportConfigDatabaseService,
  ExportHistoryDatabaseService,
  createExportDatabaseServices,
  type ExportDatabaseServiceOptions,
  type DrizzleDb,
} from './drizzle-database';

