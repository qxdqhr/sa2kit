/**
 * 通用导出服务客户端SDK
 *
 * 提供与后端API交互的客户端接口
 */

import type { ExportConfig, ExportProgress, ExportResult, ExportRequest } from './types';
import { API_ENDPOINTS, ERROR_CODES } from './constants';
import { createExportError, formatErrorMessage } from './utils';

// ============= 配置类型 =============

export interface UniversalExportClientConfig {
  /** API基础URL */
  baseUrl?: string;
  /** 请求超时时间(毫秒) */
  timeout?: number;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

// ============= 客户端类 =============

/**
 * 通用导出服务客户端
 */
export class UniversalExportClient {
  private config: UniversalExportClientConfig;

  constructor(config: UniversalExportClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 30000,
      headers: config.headers || {},
    };
  }

  // ============= 配置管理API =============

  /**
   * 获取模块的导出配置列表
   */
  async getConfigsByModule(moduleId: string, businessId?: string): Promise<ExportConfig[]> {
    const params = new URLSearchParams({ moduleId });
    if (businessId) {
      params.append('businessId', businessId);
    }

    const url = `${this.config.baseUrl}${API_ENDPOINTS.GET_CONFIGS}?${params}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`获取配置失败: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformConfigsFromAPI(data.configs || []);
    } catch (error) {
      throw createExportError(
        ERROR_CODES.NETWORK_ERROR,
        `获取导出配置失败: ${formatErrorMessage(error)}`,
        { moduleId, businessId, originalError: error }
      );
    }
  }

  /**
   * 创建导出配置
   */
  async createConfig(
    config: Omit<ExportConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExportConfig> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.CREATE_CONFIG}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`创建配置失败: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformConfigFromAPI(data.config);
    } catch (error) {
      throw createExportError(
        ERROR_CODES.NETWORK_ERROR,
        `创建导出配置失败: ${formatErrorMessage(error)}`,
        { config, originalError: error }
      );
    }
  }

  /**
   * 更新导出配置
   */
  async updateConfig(configId: string, updates: Partial<ExportConfig>): Promise<ExportConfig> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.UPDATE_CONFIG(configId)}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`更新配置失败: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformConfigFromAPI(data.config);
    } catch (error) {
      throw createExportError(
        ERROR_CODES.NETWORK_ERROR,
        `更新导出配置失败: ${formatErrorMessage(error)}`,
        { configId, updates, originalError: error }
      );
    }
  }

  /**
   * 删除导出配置
   */
  async deleteConfig(configId: string): Promise<void> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.DELETE_CONFIG(configId)}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`删除配置失败: ${response.statusText}`);
      }
    } catch (error) {
      throw createExportError(
        ERROR_CODES.NETWORK_ERROR,
        `删除导出配置失败: ${formatErrorMessage(error)}`,
        { configId, originalError: error }
      );
    }
  }

  // ============= 导出执行API =============

  /**
   * 触发数据导出
   */
  async exportData(request: Omit<ExportRequest, 'callbacks'>): Promise<ExportResult> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.EXPORT_DATA}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId: request.configId,
          dataSource: typeof request.dataSource === 'string' ? request.dataSource : undefined,
          queryParams: request.queryParams,
          fieldMapping: request.fieldMapping,
          filters: request.filters,
          sortBy: request.sortBy,
          pagination: request.pagination,
          customFileName: request.customFileName,
        }),
      });

      if (!response.ok) {
        throw new Error(`导出失败: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformExportResultFromAPI(data.result);
    } catch (error) {
      throw createExportError(
        ERROR_CODES.EXPORT_DATA_ERROR,
        `数据导出失败: ${formatErrorMessage(error)}`,
        { request, originalError: error }
      );
    }
  }

  /**
   * 查询导出进度
   */
  async getExportProgress(exportId: string): Promise<ExportProgress> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.GET_PROGRESS(exportId)}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`获取导出进度失败: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformProgressFromAPI(data.progress);
    } catch (error) {
      throw createExportError(
        ERROR_CODES.NETWORK_ERROR,
        `获取导出进度失败: ${formatErrorMessage(error)}`,
        { exportId, originalError: error }
      );
    }
  }

  /**
   * 下载导出文件
   */
  async downloadExportFile(exportId: string): Promise<Blob> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.DOWNLOAD_FILE(exportId)}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`下载文件失败: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      throw createExportError(
        ERROR_CODES.NETWORK_ERROR,
        `下载导出文件失败: ${formatErrorMessage(error)}`,
        { exportId, originalError: error }
      );
    }
  }

  // ============= 私有辅助方法 =============

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    return {
      ...this.config.headers,
    };
  }

  /**
   * 带超时的fetch请求
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createExportError(ERROR_CODES.TIMEOUT_ERROR, '请求超时', {
          url,
          timeout: this.config.timeout,
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 转换API返回的配置数据
   */
  private transformConfigFromAPI(apiConfig: any): ExportConfig {
    return {
      id: apiConfig.id,
      name: apiConfig.name,
      description: apiConfig.description || undefined,
      format: apiConfig.format,
      fields: apiConfig.fields,
      grouping: apiConfig.grouping,
      fileNameTemplate: apiConfig.fileNameTemplate,
      includeHeader: apiConfig.includeHeader,
      delimiter: apiConfig.delimiter,
      encoding: apiConfig.encoding,
      addBOM: apiConfig.addBOM,
      maxRows: apiConfig.maxRows || undefined,
      createdAt: new Date(apiConfig.createdAt),
      updatedAt: new Date(apiConfig.updatedAt),
      moduleId: apiConfig.moduleId,
      businessId: apiConfig.businessId || undefined,
      createdBy: apiConfig.createdBy || undefined,
    };
  }

  /**
   * 转换API返回的配置列表
   */
  private transformConfigsFromAPI(apiConfigs: any[]): ExportConfig[] {
    return apiConfigs.map((config) => this.transformConfigFromAPI(config));
  }

  /**
   * 转换API返回的导出结果
   */
  private transformExportResultFromAPI(apiResult: any): ExportResult {
    return {
      exportId: apiResult.exportId,
      fileName: apiResult.fileName,
      fileSize: apiResult.fileSize,
      fileUrl: apiResult.fileUrl,
      exportedRows: apiResult.exportedRows,
      startTime: new Date(apiResult.startTime),
      endTime: new Date(apiResult.endTime),
      duration: apiResult.duration,
      statistics: apiResult.statistics,
    };
  }

  /**
   * 转换API返回的进度数据
   */
  private transformProgressFromAPI(apiProgress: any): ExportProgress {
    return {
      exportId: apiProgress.exportId,
      status: apiProgress.status,
      progress: apiProgress.progress,
      processedRows: apiProgress.processedRows,
      totalRows: apiProgress.totalRows,
      startTime: new Date(apiProgress.startTime),
      estimatedEndTime: apiProgress.estimatedEndTime
        ? new Date(apiProgress.estimatedEndTime)
        : undefined,
      currentData: apiProgress.currentData,
      error: apiProgress.error,
    };
  }
}

// ============= 单例导出 =============

/**
 * 默认客户端实例
 */
export const universalExportClient = new UniversalExportClient();

/**
 * 创建自定义客户端实例
 */
export function createExportClient(config?: UniversalExportClientConfig): UniversalExportClient {
  return new UniversalExportClient(config);
}
