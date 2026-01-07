/**
 * 测测你是什么 - 配置列表组件
 * Test Yourself - Configuration List Component
 * 
 * 用于展示和选择配置
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  Download,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import type { ConfigListItem } from '../types';
import { ConfigService } from '../server/ConfigService';

export interface ConfigListProps {
  /** 配置服务实例 */
  configService: ConfigService;
  /** 选择配置回调 */
  onSelect?: (id: string) => void;
  /** 编辑配置回调 */
  onEdit?: (id: string) => void;
  /** 删除配置回调 */
  onDelete?: (id: string) => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否显示预览链接 */
  showPreviewLink?: boolean;
  /** 预览基础URL */
  previewBaseUrl?: string;
  /** 自定义样式 */
  className?: string;
  /** 每页显示数量 */
  pageSize?: number;
}

/**
 * 配置列表组件
 */
export const ConfigList: React.FC<ConfigListProps> = ({
  configService,
  onSelect,
  onEdit,
  onDelete,
  showActions = true,
  showPreviewLink = false,
  previewBaseUrl = '/test-yourself',
  className = '',
  pageSize = 10,
}) => {
  const [configs, setConfigs] = useState<ConfigListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // 加载配置列表
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const list = await configService.getConfigList();
      setConfigs(list);
    } catch (error) {
      console.error('加载配置列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [configService]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // 处理刷新
  const handleRefresh = () => {
    loadConfigs();
  };

  // 处理选择
  const handleSelect = (id: string) => {
    onSelect?.(id);
  };

  // 处理编辑
  const handleEdit = (id: string) => {
    onEdit?.(id);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return;
    
    try {
      await configService.deleteConfig(id);
      await loadConfigs();
      onDelete?.(id);
    } catch (error) {
      console.error('删除配置失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 处理复制
  const handleDuplicate = async (id: string) => {
    try {
      await configService.duplicateConfig(id);
      await loadConfigs();
    } catch (error) {
      console.error('复制配置失败:', error);
      alert('复制失败，请重试');
    }
  };

  // 处理设置默认
  const handleSetDefault = async (id: string) => {
    try {
      await configService.setDefaultConfig(id);
      await loadConfigs();
    } catch (error) {
      console.error('设置默认配置失败:', error);
      alert('设置失败，请重试');
    }
  };

  // 处理导出
  const handleExport = async (id: string) => {
    try {
      const jsonString = await configService.exportConfig(id);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config_${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出配置失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 生成预览链接
  const getPreviewUrl = (id: string) => {
    return `${previewBaseUrl}?configId=${id}`;
  };

  // 过滤配置
  const filteredConfigs = configs.filter(config => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      config.name.toLowerCase().includes(term) ||
      config.description?.toLowerCase().includes(term)
    );
  });

  // 分页
  const totalPages = Math.ceil(filteredConfigs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentConfigs = filteredConfigs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 头部 */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索配置..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          title="刷新"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* 配置列表 */}
      {currentConfigs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? '没有找到匹配的配置' : '还没有任何配置'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentConfigs.map((config) => (
            <div
              key={config.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* 配置信息 */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSelect(config.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {config.name}
                    </h3>
                    {config.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Star className="w-3 h-3" />
                        默认
                      </span>
                    )}
                  </div>
                  {config.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {config.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>结果数: {config.resultCount}</span>
                    <span>创建: {new Date(config.createdAt).toLocaleDateString()}</span>
                    {config.updatedAt !== config.createdAt && (
                      <span>更新: {new Date(config.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                {showActions && (
                  <div className="flex items-center gap-1">
                    {showPreviewLink && (
                      <a
                        href={getPreviewUrl(config.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        title="预览"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleSetDefault(config.id)}
                      disabled={config.isDefault}
                      className="p-2 text-gray-600 hover:text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="设为默认"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(config.id)}
                      className="p-2 text-gray-600 hover:text-blue-600"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(config.id)}
                      className="p-2 text-gray-600 hover:text-green-600"
                      title="复制"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExport(config.id)}
                      className="p-2 text-gray-600 hover:text-purple-600"
                      title="导出"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="p-2 text-gray-600 hover:text-red-600"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            显示 {startIndex + 1} - {Math.min(endIndex, filteredConfigs.length)} 共{' '}
            {filteredConfigs.length} 个配置
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigList;









