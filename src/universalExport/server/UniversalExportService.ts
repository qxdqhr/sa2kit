// @ts-nocheck

/**
 * 通用导出服务
 *
 * 提供统一的导出功能，支持配置化字段选择、格式化和分组
 */

import type {
  ExportConfig,
  ExportRequest,
  ExportResult,
  ExportProgress,
  ExportError,
  ExportField,
  ExportFormat,
  UniversalExportServiceConfig,
  ExportEvent,
  ExportEventListener,
  FieldMapper,
  DataTransformer,
  Validator,
  Formatter,
  GroupingConfig,
  GroupingField,
  GroupingMode,
  GroupValueProcessing,
} from '../types';

// Excel导出依赖
import * as XLSX from 'xlsx';

// 日志
import { createLogger } from '../../logger';
const logger = createLogger('UniversalExportService');

// 客户端服务（可选依赖，通过构造函数注入）
// import { universalExportClient } from './client';

import {
  ExportServiceError,
  ExportConfigError,
  ExportDataError,
  ExportFileError,
} from '../types';

// ============= 默认配置 =============

const DEFAULT_CONFIG: UniversalExportServiceConfig = {
  defaultFormat: 'csv',
  defaultDelimiter: ',',
  defaultEncoding: 'utf-8',
  defaultAddBOM: true,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxRowsLimit: 100000,
  maxConcurrentExports: 5,
  exportTimeout: 300000, // 5分钟
  cache: {
    configTTL: 3600, // 1小时
    resultTTL: 1800, // 30分钟
  },
};

// ============= 内置格式化器 =============

const DEFAULT_FORMATTERS: Record<string, Formatter> = {
  // 日期格式化
  date: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  },

  // 时间格式化
  datetime: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('zh-CN');
  },

  // 数字格式化
  number: (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value);
  },

  // 货币格式化
  currency: (value: any) => {
    if (value === null || value === undefined) return '';
    return '¥' + (Number(value).toFixed(2));
  },

  // 百分比格式化
  percentage: (value: any) => {
    if (value === null || value === undefined) return '';
    return ((Number(value) * 100).toFixed(2)) + '%';
  },

  // 布尔值格式化
  boolean: (value: any) => {
    if (value === null || value === undefined) return '';
    return value ? '是' : '否';
  },

  // 数组格式化
  array: (value: any) => {
    if (!Array.isArray(value)) return '';
    return value.join(', ');
  },

  // 对象格式化
  object: (value: any) => {
    if (!value || typeof value !== 'object') return '';
    return JSON.stringify(value);
  },
};

// ============= 主服务类 =============

/**
 * 导出客户端接口（用于依赖注入）
 */
export interface IExportClient {
  createConfig(config: Omit<ExportConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExportConfig>;
  getConfigsByModule(moduleId: string, businessId?: string): Promise<ExportConfig[]>;
}

export class UniversalExportService {
  private config: UniversalExportServiceConfig;
  private eventListeners: Map<string, ExportEventListener[]> = new Map();
  private activeExports: Map<string, ExportProgress> = new Map();
  private configCache: Map<string, { config: ExportConfig; timestamp: number }> = new Map();
  private resultCache: Map<string, { result: ExportResult; timestamp: number }> = new Map();
  private client?: IExportClient;

  constructor(
    config?: Partial<UniversalExportServiceConfig>,
    client?: IExportClient
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = client;
  }

  // ============= 配置管理 =============

  /**
   * 创建导出配置
   */
  async createConfig(
    config: Omit<ExportConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExportConfig> {
    try {
      // 验证配置
      this.validateConfig({
        ...config,
        id: 'temp',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 通过客户端API保存到数据库（如果提供了client）
      if (!this.client) {
        throw new ExportConfigError('未提供导出客户端服务', config);
      }
      const newConfig = await this.client.createConfig(config);

      // 保存到缓存
      this.configCache.set(newConfig.id, {
        config: newConfig,
        timestamp: Date.now(),
      });

      // 触发事件
      this.emitEvent({
        type: 'config:save',
        exportId: newConfig.id,
        timestamp: new Date(),
        data: { config: newConfig },
      });

      return newConfig;
    } catch (error) {
      throw new ExportConfigError(
        '创建导出配置失败: ' + (error instanceof Error ? error.message : '未知错误'),
        { originalError: error }
      );
    }
  }

  /**
   * 获取导出配置
   */
  async getConfig(configId: string): Promise<ExportConfig | null> {
    // 先从缓存获取
    const cached = this.configCache.get(configId);
    if (cached && Date.now() - cached.timestamp < this.config.cache.configTTL * 1000) {
      return cached.config;
    }

    // 从缓存中获取（暂时不支持从数据库获取单个配置）
    return null;
  }

  /**
   * 更新导出配置
   */
  async updateConfig(configId: string, updates: Partial<ExportConfig>): Promise<ExportConfig> {
    const existing = await this.getConfig(configId);
    if (!existing) {
      throw new ExportConfigError('配置不存在: ' + (configId));
    }

    const updatedConfig: ExportConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    // 验证配置
    this.validateConfig(updatedConfig);

    // 更新缓存
    this.configCache.set(configId, {
      config: updatedConfig,
      timestamp: Date.now(),
    });

    // 触发事件
    this.emitEvent({
      type: 'config:save',
      exportId: configId,
      timestamp: new Date(),
      data: { config: updatedConfig },
    });

    return updatedConfig;
  }

  /**
   * 删除导出配置
   */
  async deleteConfig(configId: string): Promise<void> {
    const existing = await this.getConfig(configId);
    if (!existing) {
      throw new ExportConfigError('配置不存在: ' + (configId));
    }

    // 从缓存删除
    this.configCache.delete(configId);

    // 触发事件
    this.emitEvent({
      type: 'config:delete',
      exportId: configId,
      timestamp: new Date(),
      data: { configId },
    });
  }

  /**
   * 获取模块的配置列表
   */
  async getConfigsByModule(moduleId: string, businessId?: string): Promise<ExportConfig[]> {
    if (!this.client) {
      throw new ExportConfigError('未提供导出客户端服务', { moduleId, businessId });
    }
    return await this.client.getConfigsByModule(moduleId, businessId);
  }

  // ============= 导出执行 =============

  /**
   * 执行导出
   */
  async export(request: ExportRequest): Promise<ExportResult> {
    const exportId = this.generateId();
    const startTime = new Date();

    logger.info('🚀 [UniversalExportService] 开始导出:', {
      exportId,
      configId: request.configId,
      hasDataSource: !!request.dataSource,
      hasCallbacks: !!request.callbacks,
    });

    try {
      // 获取配置 - 支持直接传入配置对象或从缓存获取
      let config: ExportConfig;
      if (typeof request.configId === 'object' && request.configId !== null) {
        // 直接传入配置对象
        config = request.configId as ExportConfig;
        logger.info('📋 [UniversalExportService] 使用直接传入的配置:', {
          configId: config.id,
          configName: config.name,
          format: config.format,
          fieldsCount: config.fields.length,
          hasGrouping: !!config.grouping,
          groupingEnabled: config.grouping?.enabled,
          groupingFieldsCount: config.grouping?.fields?.length || 0,
          groupingFields:
            config.grouping?.fields?.map((f) => ({ key: f.key, mergeCells: f.mergeCells })) || [],
        });
      } else {
        // 从缓存获取配置
        logger.info('🔍 [UniversalExportService] 从缓存获取配置:', request.configId);
        const cachedConfig = await this.getConfig(request.configId as string);
        if (!cachedConfig) {
          throw new ExportConfigError('导出配置不存在: ' + (request.configId));
        }
        config = cachedConfig;
        logger.info('✅ [UniversalExportService] 成功获取缓存配置:', {
          configId: config.id,
          configName: config.name,
        });
      }

      // 创建进度对象
      const progress: ExportProgress = {
        exportId,
        status: 'pending',
        progress: 0,
        processedRows: 0,
        totalRows: 0,
        startTime,
      };

      this.activeExports.set(exportId, progress);

      // 触发开始事件
      this.emitEvent({
        type: 'export:start',
        exportId,
        timestamp: startTime,
        data: { config, request },
      });

      // 调用进度回调
      if (request.callbacks?.onProgress) {
        logger.info('📞 [UniversalExportService] 调用 onProgress 回调 - 开始');
        request.callbacks.onProgress(progress);
      }

      logger.info('📊 [UniversalExportService] 开始获取数据...');

      // 获取数据
      const data = await this.getData(request);
      logger.info('✅ [UniversalExportService] 数据获取成功:', {
        dataLength: data.length,
        firstItem: data[0] ? Object.keys(data[0]) : [],
        sampleData: data.slice(0, 2),
      });

      progress.totalRows = data.length;
      progress.status = 'processing';

      // 更新进度回调
      if (request.callbacks?.onProgress) {
        logger.info('📞 [UniversalExportService] 调用 onProgress 回调 - 数据处理');
        progress.progress = 30;
        request.callbacks.onProgress(progress);
      }

      // 过滤和排序数据
      logger.info('🔄 [UniversalExportService] 开始处理数据...');
      const processedData = await this.processData(data, request, config);
      logger.info('✅ [UniversalExportService] 数据处理完成:', {
        originalLength: data.length,
        processedLength: processedData.length,
      });

      // 更新进度回调
      if (request.callbacks?.onProgress) {
        logger.info('📞 [UniversalExportService] 调用 onProgress 回调 - 数据完成');
        progress.progress = 60;
        request.callbacks.onProgress(progress);
      }

      // 生成文件
      logger.info('📄 [UniversalExportService] 开始生成文件...');
      const result = await this.generateFile(processedData, config, request, exportId);
      logger.info('✅ [UniversalExportService] 文件生成成功:', {
        fileName: result.fileName,
        fileSize: result.fileSize,
        exportedRows: result.exportedRows,
      });

      // 更新进度
      progress.status = 'completed';
      progress.progress = 100;
      progress.processedRows = data.length;

      // 调用成功回调
      if (request.callbacks?.onSuccess) {
        logger.info('📞 [UniversalExportService] 调用 onSuccess 回调');
        request.callbacks.onSuccess(result);
      }

      // 触发完成事件
      this.emitEvent({
        type: 'export:complete',
        exportId,
        timestamp: new Date(),
        data: { result },
      });

      // 缓存结果
      this.resultCache.set(exportId, {
        result,
        timestamp: Date.now(),
      });

      // 清理进度
      this.activeExports.delete(exportId);

      return result;
    } catch (error) {
      const errorObj: ExportError = {
        code: 'EXPORT_FAILED',
        message: error instanceof Error ? error.message : '导出失败',
        details: { originalError: error },
        timestamp: new Date(),
      };

      // 更新进度
      const progress = this.activeExports.get(exportId);
      if (progress) {
        progress.status = 'failed';
        progress.error = errorObj.message;
        this.activeExports.delete(exportId);
      }

      // 调用错误回调
      if (request.callbacks?.onError) {
        logger.info('📞 [UniversalExportService] 调用 onError 回调');
        request.callbacks.onError(errorObj);
      }

      // 触发错误事件
      this.emitEvent({
        type: 'export:error',
        exportId,
        timestamp: new Date(),
        error: errorObj.message,
        data: { error: errorObj },
      });

      throw error;
    }
  }

  /**
   * 获取导出进度
   */
  getExportProgress(exportId: string): ExportProgress | null {
    return this.activeExports.get(exportId) || null;
  }

  /**
   * 取消导出
   */
  cancelExport(exportId: string): boolean {
    const progress = this.activeExports.get(exportId);
    if (!progress) {
      return false;
    }

    progress.status = 'cancelled';
    this.activeExports.delete(exportId);

    // 触发取消事件
    this.emitEvent({
      type: 'export:cancel',
      exportId,
      timestamp: new Date(),
      data: { progress },
    });

    return true;
  }

  // ============= 事件管理 =============

  /**
   * 添加事件监听器
   */
  addEventListener(type: string, listener: ExportEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: string, listener: ExportEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // ============= 私有方法 =============

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return 'export_' + (Date.now()) + '_' + (Math.random().toString(36).substr(2, 9));
  }

  /**
   * 验证配置
   */
  private validateConfig(config: ExportConfig): void {
    if (!config.name || config.name.trim() === '') {
      throw new ExportConfigError('配置名称不能为空');
    }

    if (!config.fields || config.fields.length === 0) {
      throw new ExportConfigError('至少需要定义一个字段');
    }

    const enabledFields = config.fields.filter((f) => f.enabled);
    if (enabledFields.length === 0) {
      throw new ExportConfigError('至少需要启用一个字段');
    }

    // 检查字段键名唯一性
    const keys = config.fields.map((f) => f.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      throw new ExportConfigError('字段键名必须唯一');
    }
  }

  /**
   * 获取数据
   */
  private async getData(request: ExportRequest): Promise<any[]> {
    logger.info('🔍 [UniversalExportService] getData 开始执行...');
    try {
      // 支持直接传递数据数组（用于客户端直接导出）
      if (Array.isArray(request.dataSource)) {
        logger.info('📦 [UniversalExportService] 使用直接传递的数据数组:', {
          length: request.dataSource.length,
        });
        return request.dataSource;
      }

      // 支持数据源函数（用于服务端导出）
      if (typeof request.dataSource === 'function') {
        logger.info('📞 [UniversalExportService] 调用数据源函数...');
        const data = await request.dataSource();
        logger.info('✅ [UniversalExportService] 数据源函数执行成功:', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
        });
        return data;
      }

      // 这里可以扩展支持从API获取数据
      console.error('❌ [UniversalExportService] 数据源类型不支持:', typeof request.dataSource);
      throw new ExportDataError('不支持的数据源类型');
    } catch (error) {
      console.error('❌ [UniversalExportService] 获取数据失败:', error);
      throw new ExportDataError(
        '获取数据失败: ' + (error instanceof Error ? error.message : '未知错误'),
        { originalError: error }
      );
    }
  }

  /**
   * 处理数据
   */
  private async processData(
    data: any[],
    request: ExportRequest,
    config: ExportConfig
  ): Promise<any[]> {
    logger.info('🔄 [UniversalExportService] processData 开始执行:', {
      dataLength: data.length,
      hasFilters: !!(request.filters && request.filters.length > 0),
      hasSortBy: !!(request.sortBy && request.sortBy.length > 0),
      hasPagination: !!request.pagination,
      hasGrouping: !!(config.grouping && config.grouping.enabled),
      maxRows: config.maxRows,
    });

    // 🔍 详细调试分组配置
    logger.info('🔍 [UniversalExportService] 详细分组配置检查:', {
      configGrouping: config.grouping,
      groupingExists: !!config.grouping,
      groupingEnabled: config.grouping?.enabled,
      groupingFields: config.grouping?.fields,
      groupingFieldsLength: config.grouping?.fields?.length,
    });

    let processedData = [...data];

    // 应用过滤器
    if (request.filters && request.filters.length > 0) {
      logger.info('🔍 [UniversalExportService] 应用过滤器...');
      processedData = this.applyFilters(processedData, request.filters);
      logger.info('✅ [UniversalExportService] 过滤器应用完成:', {
        beforeLength: data.length,
        afterLength: processedData.length,
      });
    }

    // 应用排序
    if (request.sortBy && request.sortBy.length > 0) {
      logger.info('📊 [UniversalExportService] 应用排序...');
      processedData = this.applySorting(processedData, request.sortBy);
      logger.info('✅ [UniversalExportService] 排序应用完成');
    }

    // 应用分组
    if (config.grouping && config.grouping.enabled) {
      logger.info('📊 [UniversalExportService] 应用分组...');
      processedData = this.applyGrouping(processedData, config.grouping);
      logger.info('✅ [UniversalExportService] 分组应用完成:', {
        groupsCount: this.countGroups(processedData),
        resultLength: processedData.length,
      });
    }

    // 应用分页
    if (request.pagination) {
      logger.info('📄 [UniversalExportService] 应用分页...');
      const { page, pageSize } = request.pagination;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      processedData = processedData.slice(start, end);
      logger.info('✅ [UniversalExportService] 分页应用完成:', {
        page,
        pageSize,
        start,
        end,
        resultLength: processedData.length,
      });
    }

    // 限制行数
    if (config.maxRows && processedData.length > config.maxRows) {
      logger.info('📏 [UniversalExportService] 应用行数限制...');
      processedData = processedData.slice(0, config.maxRows);
      logger.info('✅ [UniversalExportService] 行数限制应用完成:', {
        maxRows: config.maxRows,
        resultLength: processedData.length,
      });
    }

    logger.info('✅ [UniversalExportService] processData 执行完成:', {
      originalLength: data.length,
      finalLength: processedData.length,
    });

    return processedData;
  }

  /**
   * 应用过滤器
   */
  private applyFilters(data: any[], filters: any[]): any[] {
    return data.filter((item) => {
      return filters.every((filter) => {
        const value = this.getNestedValue(item, filter.field);

        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'ne':
            return value !== filter.value;
          case 'gt':
            return value > filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lt':
            return value < filter.value;
          case 'lte':
            return value <= filter.value;
          case 'contains':
            return String(value).includes(String(filter.value));
          case 'startsWith':
            return String(value).startsWith(String(filter.value));
          case 'endsWith':
            return String(value).endsWith(String(filter.value));
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          case 'notIn':
            return Array.isArray(filter.value) && !filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }

  /**
   * 应用排序
   */
  private applySorting(data: any[], sortBy: any[]): any[] {
    return data.sort((a, b) => {
      for (const sort of sortBy) {
        const aValue = this.getNestedValue(a, sort.field);
        const bValue = this.getNestedValue(b, sort.field);

        if (aValue < bValue) {
          return sort.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sort.direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * 过滤掉所有行都为空值的字段
   */
  private filterEmptyFields(data: any[], fields: ExportField[]): ExportField[] {
    const filteredFields = fields.filter((field) => {
      // 特殊处理：强制保留某些重要字段，即使所有行都为空值
      const forceKeepFields = ['pickupMethod', 'notes', 'adminNotes'];
      if (forceKeepFields.includes(field.key)) {
        logger.info('🔧 [UniversalExportService] 强制保留字段 "' + (field.key) + '" (' + (field.label) + ')');
        return true;
      }

      // 检查所有数据行，如果至少有一行该字段有值，则保留该字段
      const hasValue = data.some((item) => {
        const value = this.getNestedValue(item, field.key);
        return value !== null && value !== undefined && value !== '';
      });

      if (!hasValue) {
        logger.info(
          '🔍 [UniversalExportService] 字段 "' + (field.key) + '" (' + (field.label) + ') 被过滤掉 - 所有行都为空值'
        );
      }

      return hasValue;
    });

    logger.info('📊 [UniversalExportService] 字段过滤结果:', {
      原始字段数: fields.length,
      过滤后字段数: filteredFields.length,
      被过滤的字段: fields.filter((f) => !filteredFields.includes(f)).map((f) => f.key),
      保留的字段: filteredFields.map((f) => f.key),
    });

    return filteredFields;
  }

  /**
   * 生成文件
   */
  private async generateFile(
    data: any[],
    config: ExportConfig,
    request: ExportRequest,
    exportId: string
  ): Promise<ExportResult> {
    const startTime = new Date();
    const enabledFields = config.fields.filter((f) => f.enabled);

    logger.info('📄 [UniversalExportService] generateFile 开始执行:', {
      dataLength: data.length,
      enabledFieldsCount: enabledFields.length,
      format: config.format,
      enabledFields: enabledFields.map((f) => ({ key: f.key, label: f.label })),
    });

    try {
      let content: string;
      let fileName: string;

      switch (config.format) {
        case 'csv':
          logger.info('📊 [UniversalExportService] 生成CSV格式...');
          content = this.generateCSV(data, enabledFields, config);
          fileName = this.generateFileName(
            request.customFileName || config.fileNameTemplate,
            'csv'
          );
          logger.info('✅ [UniversalExportService] CSV生成完成:', {
            contentLength: content.length,
            fileName,
          });
          break;
        case 'excel':
          logger.info('📊 [UniversalExportService] 生成Excel格式...');
          const excelBuffer = this.generateExcel(data, enabledFields, config);
          fileName = this.generateFileName(
            request.customFileName || config.fileNameTemplate,
            'xlsx'
          );
          logger.info('✅ [UniversalExportService] Excel生成完成:', {
            bufferLength: excelBuffer.byteLength,
            fileName,
          });
          // 创建Excel Blob
          const excelBlob = new Blob([excelBuffer], { type: this.getMimeType(config.format) });
          const endTime = new Date();
          const duration = endTime.getTime() - startTime.getTime();
          return {
            exportId,
            fileName,
            fileSize: excelBlob.size,
            fileBlob: excelBlob,
            exportedRows: data.length,
            startTime,
            endTime,
            duration,
            statistics: {
              totalRows: data.length,
              filteredRows: data.length,
              exportedRows: data.length,
              skippedRows: 0,
            },
          };
        case 'json':
          logger.info('📄 [UniversalExportService] 生成JSON格式...');
          content = this.generateJSON(data, enabledFields);
          fileName = this.generateFileName(
            request.customFileName || config.fileNameTemplate,
            'json'
          );
          logger.info('✅ [UniversalExportService] JSON生成完成:', {
            contentLength: content.length,
            fileName,
          });
          break;
        default:
          console.error('❌ [UniversalExportService] 不支持的格式:', config.format);
          throw new ExportFileError('不支持的导出格式: ' + (config.format));
      }

      // 创建Blob
      const blob = new Blob([content], { type: this.getMimeType(config.format) });

      // 检查文件大小
      if (blob.size > this.config.maxFileSize) {
        throw new ExportFileError('文件大小超过限制: ' + (blob.size) + ' > ' + (this.config.maxFileSize));
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        exportId,
        fileName,
        fileSize: blob.size,
        fileBlob: blob,
        exportedRows: data.length,
        startTime,
        endTime,
        duration,
        statistics: {
          totalRows: data.length,
          filteredRows: data.length,
          exportedRows: data.length,
          skippedRows: 0,
        },
      };
    } catch (error) {
      throw new ExportFileError(
        '生成文件失败: ' + (error instanceof Error ? error.message : '未知错误'),
        { originalError: error }
      );
    }
  }

  /**
   * 生成CSV内容
   */
  private generateCSV(data: any[], fields: ExportField[], config: ExportConfig): string {
    logger.info('📊 [UniversalExportService] generateCSV 开始执行:', {
      dataLength: data.length,
      fieldsCount: fields.length,
      includeHeader: config.includeHeader,
      delimiter: config.delimiter,
      addBOM: config.addBOM,
    });

    const lines: string[] = [];

    // 添加BOM
    if (config.addBOM) {
      lines.push('\uFEFF');
      logger.info('📝 [UniversalExportService] 添加BOM');
    }

    // 过滤掉所有行都为空值的字段
    const nonEmptyFields = this.filterEmptyFields(data, fields);
    logger.info('📊 [UniversalExportService] 过滤空字段:', {
      originalFieldsCount: fields.length,
      nonEmptyFieldsCount: nonEmptyFields.length,
      removedFields: fields
        .filter((f: ExportField) => !nonEmptyFields.includes(f))
        .map((f: ExportField) => f.key),
    });

    // 添加表头
    if (config.includeHeader) {
      const headers = nonEmptyFields.map((f) => this.escapeCSVField(f.label));
      lines.push(headers.join(config.delimiter));
      logger.info('📋 [UniversalExportService] 添加表头:', headers);
    }

    // 添加数据行
    logger.info('📊 [UniversalExportService] 开始处理数据行...');
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (i === 0) {
        logger.info('📊 [UniversalExportService] 第一行数据示例:', item);
      }

      const row = nonEmptyFields.map((field) => {
        // 处理分组头行
        if (item.__isGroupHeader) {
          return this.escapeCSVField(item[field.key] || '');
        }

        let value = this.getNestedValue(item, field.key);

        // 应用格式化器
        if (field.formatter) {
          value = field.formatter(value);
        } else if (DEFAULT_FORMATTERS[field.type]) {
          value = DEFAULT_FORMATTERS[field.type](value);
        } else {
          value = String(value || '');
        }

        return this.escapeCSVField(value);
      });

      lines.push(row.join(config.delimiter));

      if (i === 0) {
        logger.info('📊 [UniversalExportService] 第一行处理结果:', row);
      }
    }

    const result = lines.join('\n');
    logger.info('✅ [UniversalExportService] CSV生成完成:', {
      totalLines: lines.length,
      resultLength: result.length,
    });
    return result;
  }

  /**
   * 生成JSON内容
   */
  private generateJSON(data: any[], fields: ExportField[]): string {
    const processedData = data.map((item) => {
      const processed: Record<string, any> = {};

      for (const field of fields) {
        let value = this.getNestedValue(item, field.key);

        // 应用格式化器
        if (field.formatter) {
          value = field.formatter(value);
        } else if (DEFAULT_FORMATTERS[field.type]) {
          value = DEFAULT_FORMATTERS[field.type](value);
        }

        processed[field.key] = value;
      }

      return processed;
    });

    return JSON.stringify(processedData, null, 2);
  }

  /**
   * 转义CSV字段
   */
  private escapeCSVField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + (value.replace(/"/g, '""')) + '"';
    }
    return value;
  }

  /**
   * 生成文件名
   */
  private generateFileName(template: string, extension: string): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

    return (
      template
        .replace('{date}', dateStr)
        .replace('{time}', timeStr)
        .replace('{timestamp}', now.getTime().toString()) + '.' + (extension)
    );
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'csv':
        return 'text/csv; charset=utf-8';
      case 'json':
        return 'application/json; charset=utf-8';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: ExportEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('事件监听器执行失败:', error);
        }
      });
    }
  }

  // ============= 分组相关方法 =============

  /**
   * 应用分组
   */
  private applyGrouping(data: any[], groupingConfig: GroupingConfig): any[] {
    logger.info('📊 [UniversalExportService] applyGrouping 开始执行:', {
      dataLength: data.length,
      groupingFields: groupingConfig.fields.map((f) => f.key),
      preserveOrder: groupingConfig.preserveOrder,
    });

    if (!groupingConfig.fields || groupingConfig.fields.length === 0) {
      return data;
    }

    // 按分组字段对数据进行分组
    const grouped = this.groupDataByFields(data, groupingConfig);

    // 处理分组后的数据
    const result = this.processGroupedData(grouped, groupingConfig);

    logger.info('✅ [UniversalExportService] applyGrouping 执行完成:', {
      originalLength: data.length,
      groupedLength: result.length,
    });

    return result;
  }

  /**
   * 按字段分组数据
   */
  private groupDataByFields(data: any[], groupingConfig: GroupingConfig): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    for (const item of data) {
      // 生成分组键
      const groupKey = this.generateGroupKey(item, groupingConfig.fields);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    }

    return groups;
  }

  /**
   * 生成分组键
   */
  private generateGroupKey(item: any, groupingFields: GroupingField[]): string {
    const keyParts = groupingFields.map((field) => {
      const value = this.getNestedValue(item, field.key);

      // 处理空值
      if (value === null || value === undefined || value === '') {
        return '__NULL__';
      }

      return String(value);
    });

    return keyParts.join('|');
  }

  /**
   * 处理分组后的数据
   */
  private processGroupedData(groups: Map<string, any[]>, groupingConfig: GroupingConfig): any[] {
    const result: any[] = [];

    for (const [groupKey, groupItems] of groups) {
      if (groupItems.length === 0) continue;

      // 解析分组键
      const groupValues = groupKey.split('|');

      // 处理分组
      const processedGroup = this.processGroup(groupItems, groupingConfig, groupValues);
      result.push(...processedGroup);
    }

    return result;
  }

  /**
   * 处理单个分组
   */
  private processGroup(
    groupItems: any[],
    groupingConfig: GroupingConfig,
    groupValues: string[]
  ): any[] {
    const result: any[] = [];

    // 添加分组头行（如果需要）
    const showGroupHeader = groupingConfig.fields.some((f) => f.showGroupHeader);
    if (showGroupHeader) {
      const groupHeader = this.createGroupHeader(groupValues, groupingConfig.fields);
      result.push(groupHeader);
    }

    // 处理分组模式 - 对于多字段分组，使用特殊处理
    if (groupingConfig.fields.length > 1) {
      // 多字段合并模式
      result.push(...this.processMultiFieldMergeMode(groupItems, groupingConfig.fields));
    } else {
      // 单字段分组
      const primaryGroupField = groupingConfig.fields[0];

      switch (primaryGroupField.mode) {
        case 'merge':
          // 合并模式：第一行显示分组值，其他行为空
          result.push(...this.processMergeMode(groupItems, primaryGroupField));
          break;
        case 'separate':
          // 分离模式：每个分组独立显示
          result.push(...groupItems);
          break;
        case 'nested':
          // 嵌套模式：支持多级分组
          result.push(...this.processNestedMode(groupItems, groupingConfig));
          break;
        default:
          result.push(...groupItems);
      }
    }

    return result;
  }

  /**
   * 创建分组头行
   */
  private createGroupHeader(groupValues: string[], groupingFields: GroupingField[]): any {
    const header: any = { __isGroupHeader: true };

    groupingFields.forEach((field, index) => {
      const value = groupValues[index] === '__NULL__' ? '' : groupValues[index];
      const template = field.groupHeaderTemplate || (field.label) + ': {value}';
      header[field.key] = template.replace('{value}', value);
    });

    return header;
  }

  /**
   * 处理合并模式
   */
  private processMergeMode(groupItems: any[], groupField: GroupingField): any[] {
    if (groupItems.length === 0) return [];

    const result: any[] = [];

    // 第一行保持原样
    const firstItem = { ...groupItems[0] };
    firstItem.__groupSize = groupItems.length;
    firstItem.__isGroupFirst = true;
    result.push(firstItem);

    // 其他行的分组字段设置为空，用于合并单元格
    for (let i = 1; i < groupItems.length; i++) {
      const item = { ...groupItems[i] };
      item[groupField.key] = ''; // 空值表示需要合并
      item.__isGroupChild = true;
      item.__groupIndex = i;
      result.push(item);
    }

    return result;
  }

  /**
   * 处理多字段合并模式
   */
  private processMultiFieldMergeMode(groupItems: any[], groupFields: GroupingField[]): any[] {
    if (groupItems.length === 0) return [];

    const result: any[] = [];

    // 第一行保持原样，添加分组标记
    const firstItem = { ...groupItems[0] };
    firstItem.__groupSize = groupItems.length;
    firstItem.__isGroupFirst = true;

    // 为每个分组字段标记
    groupFields.forEach((field) => {
      firstItem['__' + (field.key) + '_groupSize'] = groupItems.length;
      firstItem['__' + (field.key) + '_isGroupFirst'] = true;
    });

    result.push(firstItem);

    logger.info('🔗 [UniversalExportService] 处理多字段合并模式:', {
      groupItemsLength: groupItems.length,
      groupFields: groupFields.map((f) => f.key),
      firstItem: firstItem,
    });

    // 其他行的所有分组字段设置为空，用于合并单元格
    for (let i = 1; i < groupItems.length; i++) {
      const item = { ...groupItems[i] };

      // 清空所有分组字段的值，用于单元格合并
      groupFields.forEach((field) => {
        item[field.key] = ''; // 空值表示需要合并
      });

      item.__isGroupChild = true;
      item.__groupIndex = i;
      result.push(item);
    }

    return result;
  }

  /**
   * 处理嵌套模式
   */
  private processNestedMode(groupItems: any[], groupingConfig: GroupingConfig): any[] {
    // 如果只有一个分组字段，按merge模式处理
    if (groupingConfig.fields.length === 1) {
      return this.processMergeMode(groupItems, groupingConfig.fields[0]);
    }

    // 多级分组：递归处理下一级
    const subGroupingConfig: GroupingConfig = {
      ...groupingConfig,
      fields: groupingConfig.fields.slice(1),
    };

    return this.applyGrouping(groupItems, subGroupingConfig);
  }

  /**
   * 统计分组数量
   */
  private countGroups(data: any[]): number {
    const groupHeaders = data.filter((item) => item.__isGroupHeader);
    const groupFirsts = data.filter((item) => item.__isGroupFirst);
    return Math.max(groupHeaders.length, groupFirsts.length);
  }

  /**
   * 生成Excel文件
   */
  private generateExcel(data: any[], fields: ExportField[], config: ExportConfig): ArrayBuffer {
    logger.info('📊 [UniversalExportService] generateExcel 开始执行:', {
      dataLength: data.length,
      fieldsCount: fields.length,
      hasGrouping: !!(config.grouping && config.grouping.enabled),
    });

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 过滤掉所有行都为空值的字段
    const nonEmptyFields = this.filterEmptyFields(data, fields);

    // 准备数据
    const worksheetData = this.prepareExcelData(data, nonEmptyFields, config);

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 应用分组和合并单元格
    if (config.grouping && config.grouping.enabled) {
      this.applyExcelGrouping(
        worksheet,
        data,
        nonEmptyFields,
        config.grouping,
        config.includeHeader
      );
    }

    // 设置列宽和样式
    this.setExcelColumnWidths(worksheet, nonEmptyFields);

    // 为所有数据单元格添加边框
    this.applyExcelDataStyles(worksheet, config.includeHeader);

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 生成文件
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    });

    logger.info('✅ [UniversalExportService] generateExcel 执行完成');
    return excelBuffer;
  }

  /**
   * 准备Excel数据
   */
  private prepareExcelData(data: any[], fields: ExportField[], config: ExportConfig): any[][] {
    const result: any[][] = [];

    logger.info('📊 [UniversalExportService] 准备Excel数据:', {
      dataLength: data.length,
      fieldsCount: fields.length,
      includeHeader: config.includeHeader,
      hasGrouping: !!(config.grouping && config.grouping.enabled),
    });

    // 添加表头
    if (config.includeHeader) {
      const headers = fields.map((field) => field.label);
      result.push(headers);
      logger.info('📋 [UniversalExportService] 添加表头:', headers);
    }

    // 添加数据行
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      const row = fields.map((field) => {
        // 跳过分组头行的处理
        if (item.__isGroupHeader) {
          return item[field.key] || '';
        }

        let value = this.getNestedValue(item, field.key);

        // 应用格式化器
        if (field.formatter) {
          value = field.formatter(value);
        } else if (DEFAULT_FORMATTERS[field.type]) {
          value = DEFAULT_FORMATTERS[field.type](value);
        } else {
          value = String(value || '');
        }

        return value;
      });

      result.push(row);

      if (i === 0) {
        logger.info('📊 [UniversalExportService] 第一行数据示例:', row);
      }
    }

    logger.info('✅ [UniversalExportService] Excel数据准备完成:', {
      totalRows: result.length,
      headerRows: config.includeHeader ? 1 : 0,
      dataRows: result.length - (config.includeHeader ? 1 : 0),
    });

    return result;
  }

  /**
   * 应用Excel分组和合并单元格
   */
  private applyExcelGrouping(
    worksheet: XLSX.WorkSheet,
    data: any[],
    fields: ExportField[],
    groupingConfig: GroupingConfig,
    includeHeader: boolean = true
  ): void {
    if (!worksheet['!merges']) {
      worksheet['!merges'] = [];
    }

    const headerOffset = includeHeader ? 1 : 0; // 是否有表头
    let currentRow = headerOffset;

    logger.info('📊 [UniversalExportService] 开始处理Excel分组和合并单元格:', {
      dataLength: data.length,
      headerOffset,
      groupingFields: groupingConfig.fields.map((f) => ({ key: f.key, mergeCells: f.mergeCells })),
    });

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (item.__isGroupFirst && item.__groupSize > 1) {
        logger.info('🔗 [UniversalExportService] 处理分组合并:', {
          row: currentRow,
          groupSize: item.__groupSize,
          item: item,
        });

        // 找到需要合并的分组字段
        groupingConfig.fields.forEach((groupField) => {
          if (groupField.mergeCells) {
            const fieldIndex = fields.findIndex((f) => f.key === groupField.key);
            if (fieldIndex >= 0) {
              // 获取分组大小 - 优先使用字段特定的分组大小
              const groupSize = item['__' + (groupField.key) + '_groupSize'] || item.__groupSize;

              // 创建合并区域
              const mergeRange = {
                s: { r: currentRow, c: fieldIndex }, // 开始行列
                e: { r: currentRow + groupSize - 1, c: fieldIndex }, // 结束行列
              };

              logger.info('📊 [UniversalExportService] 添加合并区域:', {
                field: groupField.key,
                fieldIndex,
                groupSize,
                mergeRange,
              });

              worksheet['!merges']!.push(mergeRange);

              // 为合并单元格添加样式
              const startCellAddress = XLSX.utils.encode_cell(mergeRange.s);
              if (worksheet[startCellAddress]) {
                worksheet[startCellAddress].s = {
                  ...worksheet[startCellAddress].s,
                  alignment: { horizontal: 'center', vertical: 'middle' },
                  fill: { fgColor: { rgb: 'F2F2F2' } },
                  border: {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    bottom: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } },
                    right: { style: 'thin', color: { rgb: '000000' } },
                  },
                };
              }
            }
          }
        });
      }

      currentRow++;
    }

    logger.info('✅ [UniversalExportService] Excel分组和合并单元格处理完成:', {
      totalMerges: worksheet['!merges']?.length || 0,
    });
  }

  /**
   * 设置Excel列宽和样式
   */
  private setExcelColumnWidths(worksheet: XLSX.WorkSheet, fields: ExportField[]): void {
    const colWidths = fields.map((field) => ({
      wch: field.width || 15, // 默认宽度15字符
    }));

    worksheet['!cols'] = colWidths;

    // 设置表头样式
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          // 为表头添加样式
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4472C4' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            },
          };
        }
      }
    }

    logger.info('✅ [UniversalExportService] Excel列宽和样式设置完成:', {
      columnsCount: colWidths.length,
      columnWidths: colWidths.map((col, index) => ({ field: fields[index]?.key, width: col.wch })),
    });
  }

  /**
   * 为Excel数据单元格应用样式
   */
  private applyExcelDataStyles(worksheet: XLSX.WorkSheet, includeHeader: boolean = true): void {
    if (!worksheet['!ref']) return;

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const startRow = includeHeader ? 1 : 0; // 跳过表头

    logger.info('🎨 [UniversalExportService] 开始应用Excel数据样式:', {
      totalRows: range.e.r + 1,
      totalCols: range.e.c + 1,
      startRow,
    });

    // 为数据单元格添加边框和对齐
    for (let row = startRow; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellAddress]) {
          // 保留已有样式（如合并单元格的样式）
          const existingStyle = worksheet[cellAddress].s || {};

          worksheet[cellAddress].s = {
            ...existingStyle,
            border: {
              top: { style: 'thin', color: { rgb: 'CCCCCC' } },
              bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
              left: { style: 'thin', color: { rgb: 'CCCCCC' } },
              right: { style: 'thin', color: { rgb: 'CCCCCC' } },
            },
            alignment: {
              ...existingStyle.alignment,
              vertical: 'center',
            },
          };
        }
      }
    }

    logger.info('✅ [UniversalExportService] Excel数据样式应用完成');
  }
}
