/**
 * 通用导出按钮组件
 * 
 * 提供统一的导出功能入口，支持配置化导出
 */

'use client';

import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { 
  Download, 
  Settings, 
  FileText, 
  Loader2,
  ChevronDown
} from 'lucide-react';

import type { 
  ExportConfig, 
  ExportField, 
  ExportRequest,
  ExportResult,
  ExportProgress 
} from '../types';

import { ExportConfigEditor } from './ExportConfigEditor';

// ============= 类型定义 =============

export interface UniversalExportButtonProps {
  /** 导出服务实例 */
  exportService: any; // UniversalExportClient
  /** 模块标识 */
  moduleId: string;
  /** 业务标识 */
  businessId?: string;
  /** 可用的字段定义 */
  availableFields: ExportField[];
  /** 数据源函数 */
  dataSource: () => Promise<any[]>;
  /** 默认配置 */
  defaultConfig?: ExportConfig;
  /** 按钮文本 */
  buttonText?: string;
  /** 按钮样式 */
  variant?: 'primary' | 'secondary' | 'outline';
  /** 按钮大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 导出成功回调 */
  onExportSuccess?: (result: ExportResult) => void;
  /** 导出失败回调 */
  onExportError?: (error: string) => void;
  /** 配置保存回调 */
  onConfigSave?: (config: ExportConfig) => void;
}

// ============= 按钮样式配置 =============

const BUTTON_STYLES = {
  primary: {
    sm: 'px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700',
    md: 'px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700',
    lg: 'px-6 py-3 text-base bg-blue-600 text-white hover:bg-blue-700',
  },
  secondary: {
    sm: 'px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700',
    md: 'px-4 py-2 text-sm bg-gray-600 text-white hover:bg-gray-700',
    lg: 'px-6 py-3 text-base bg-gray-600 text-white hover:bg-gray-700',
  },
  outline: {
    sm: 'px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50',
    md: 'px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50',
    lg: 'px-6 py-3 text-base border border-gray-300 text-gray-700 hover:bg-gray-50',
  },
};

// ============= 主组件 =============

export const UniversalExportButton: React.FC<UniversalExportButtonProps> = ({
  exportService,
  moduleId,
  businessId,
  availableFields,
  dataSource,
  defaultConfig,
  buttonText = '导出数据',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onExportSuccess,
  onExportError,
  onConfigSave,
}) => {
  // ============= 状态管理 =============
  
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<ExportConfig[]>([]);

  // 加载保存的配置
  const loadSavedConfigs = useCallback(async () => {
    try {
      if (exportService) {
        const configs = await exportService.getConfigsByModule(moduleId, businessId);
        setSavedConfigs(configs);
      }
    } catch (error) {
      console.error('加载保存的配置失败:', error);
    }
  }, [exportService, moduleId, businessId]);

  // 组件挂载时加载配置
  React.useEffect(() => {
    loadSavedConfigs();
  }, [loadSavedConfigs]);

  // ============= 导出处理 =============

  const handleExport = useCallback(async (config: ExportConfig) => {
    console.log('🚀 [UniversalExportButton] 开始导出:', {
      configId: config.id,
      configName: config.name,
      format: config.format,
      fieldsCount: config.fields.length,
    });

    if (!exportService) {
      console.error('❌ [UniversalExportButton] 导出服务未初始化');
      onExportError?.('导出服务未初始化');
      return;
    }

    setIsExporting(true);
    setExportProgress(null);

    try {
      // 获取数据
      console.log('📊 [UniversalExportButton] 获取数据...');
      const data = await dataSource();
      console.log('✅ [UniversalExportButton] 数据获取成功:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
      });

      // 创建导出请求（不包含回调，因为客户端不支持）
      const request = {
        configId: config,
        dataSource: data, // 传递实际数据而不是函数
        queryParams: undefined,
        fieldMapping: undefined,
        filters: undefined,
        sortBy: undefined,
        pagination: undefined,
        customFileName: undefined,
      };

      console.log('📞 [UniversalExportButton] 调用导出服务...');
      const result = await exportService.exportData(request);

      console.log('✅ [UniversalExportButton] 导出成功:', {
        fileName: result.fileName,
        fileSize: result.fileSize,
        exportedRows: result.exportedRows,
      });

      // 由于客户端不支持进度回调，我们模拟一个完成状态
      const progress: ExportProgress = {
        exportId: result.exportId,
        status: 'completed',
        progress: 100,
        processedRows: result.exportedRows,
        totalRows: result.exportedRows,
        startTime: result.startTime,
        estimatedEndTime: result.endTime,
      };
      setExportProgress(progress);

      // 下载文件
      if (result.fileUrl) {
        console.log('📥 [UniversalExportButton] 从URL下载文件...');
        const link = document.createElement('a');
        link.href = result.fileUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ [UniversalExportButton] 文件下载完成');
      } else if (result.fileBlob) {
        console.log('📥 [UniversalExportButton] 从Blob下载文件...');
        const url = window.URL.createObjectURL(result.fileBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('✅ [UniversalExportButton] 文件下载完成');
      }

      // 延迟清除进度状态
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(null);
      }, 1000);

      onExportSuccess?.(result);
    } catch (error) {
      console.error('❌ [UniversalExportButton] 导出异常:', error);
      setIsExporting(false);
      setExportProgress(null);

      // 更好地处理错误信息
      let errorMessage = '导出失败';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('code' in error && 'message' in error) {
          errorMessage = (error.code) + ': ' + (error.message);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      onExportError?.(errorMessage);
    }
  }, [exportService, dataSource, onExportSuccess, onExportError]);

  const handleQuickExport = useCallback(async () => {
    if (defaultConfig) {
      await handleExport(defaultConfig);
    } else {
      // 创建默认配置
      const config: ExportConfig = {
        id: 'quick_export',
        name: '快速导出',
        description: '使用默认配置快速导出',
        format: 'csv',
        fields: availableFields.map((field, index) => ({
          ...field,
          enabled: true,
          sortOrder: index,
        })),
        fileNameTemplate: '导出数据_{date}',
        includeHeader: true,
        delimiter: ',',
        encoding: 'utf-8',
        addBOM: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        moduleId,
        businessId,
      };
      
      await handleExport(config);
    }
  }, [defaultConfig, availableFields, moduleId, businessId, handleExport]);

  // ============= 配置管理 =============

  const handleConfigSave = useCallback(async (config: ExportConfig) => {
    try {
      if (exportService) {
        const savedConfig = await exportService.createConfig(config);
        // 重新加载配置列表
        await loadSavedConfigs();
        onConfigSave?.(savedConfig);
      }
      setShowConfigEditor(false);
    } catch (error) {
      onExportError?.(error instanceof Error ? error.message : '保存配置失败');
    }
  }, [exportService, onConfigSave, onExportError, loadSavedConfigs]);

  // ============= 渲染进度 =============

  const renderProgress = () => {
    if (!exportProgress) return null;

    const { status, progress, processedRows, totalRows } = exportProgress;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[10]">
        <div className="flex items-center gap-3 mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            {status === 'processing' ? '正在导出...' : '导出完成'}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>进度: {progress}%</span>
            <span>{processedRows} / {totalRows} 行</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: (progress) + '%' }}
            />
          </div>
        </div>
      </div>
    );
  };

  // ============= 渲染下拉菜单 =============

  const renderDropdown = () => {
    if (!showDropdown) return null;

    return (
      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-[10] min-w-48">
        {/* 快速导出 */}
        <button
          onClick={() => {
            setShowDropdown(false);
            handleQuickExport();
          }}
          disabled={isExporting}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          快速导出
        </button>

        {/* 使用保存的配置 */}
        {savedConfigs.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-1" />
            {savedConfigs.map((config) => (
              <button
                key={config.id}
                onClick={() => {
                  setShowDropdown(false);
                  handleExport(config);
                }}
                disabled={isExporting}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {config.name}
              </button>
            ))}
          </>
        )}

        {/* 配置编辑器 */}
        <div className="border-t border-gray-200 my-1" />
        <button
          onClick={() => {
            setShowDropdown(false);
            setShowConfigEditor(true);
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          自定义配置
        </button>
      </div>
    );
  };

  // ============= 渲染组件 =============

  const buttonStyle = BUTTON_STYLES[variant][size];
  const baseClasses = 'inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ' + (buttonStyle);

  return (
    <div className={clsx('relative', className)}>
      {/* 主按钮 */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || isExporting}
        className={clsx(baseClasses, isExporting ? 'cursor-not-allowed' : '')}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? '导出中...' : buttonText}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* 下拉菜单 */}
      {renderDropdown()}

      {/* 进度显示 */}
      {renderProgress()}

      {/* 配置编辑器 */}
      <ExportConfigEditor
        moduleId={moduleId}
        businessId={businessId}
        availableFields={availableFields}
        onSave={handleConfigSave}
        onCancel={() => setShowConfigEditor(false)}
        visible={showConfigEditor}
        onConfigChange={loadSavedConfigs}
      />

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-[0]"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

