/**
 * 通用文件管理组件
 * 支持文件列表、预览、批量操作、搜索筛选等功能
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileMetadata, FileQueryOptions, PaginatedResult, ProcessorType } from '../types';

// 文件管理相关类型定义
export interface FileManagerProps {
  /** 模块ID，限制显示特定模块的文件 */
  moduleId?: string;
  /** 业务ID，限制显示特定业务的文件 */
  businessId?: string;
  /** 显示模式 */
  mode?: 'grid' | 'list' | 'table';
  /** 是否允许上传 */
  allowUpload?: boolean;
  /** 是否允许下载 */
  allowDownload?: boolean;
  /** 是否允许删除 */
  allowDelete?: boolean;
  /** 是否允许批量操作 */
  allowBatch?: boolean;
  /** 是否显示预览 */
  showPreview?: boolean;
  /** 是否显示搜索 */
  showSearch?: boolean;
  /** 是否显示筛选器 */
  showFilters?: boolean;
  /** 每页显示数量 */
  pageSize?: number;
  /** 自定义操作按钮 */
  customActions?: Array<{
    key: string;
    label: string;
    icon?: string;
    onClick: (files: FileMetadata[]) => void;
    disabled?: (files: FileMetadata[]) => boolean;
  }>;
  /** 文件选择回调 */
  onFileSelect?: (files: FileMetadata[]) => void;
  /** 上传完成回调 */
  onUploadComplete?: (files: FileMetadata[]) => void;
}

export interface FileManagerState {
  files: FileMetadata[];
  selectedFiles: Set<string>;
  loading: boolean;
  uploading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    mimeType: string;
    dateRange: { start: Date | null; end: Date | null };
    sizeRange: { min: number; max: number };
  };
  sortBy: keyof FileMetadata;
  sortOrder: 'asc' | 'desc';
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  previewFile: FileMetadata | null;
  showUploadModal: boolean;
}

const MIME_TYPE_CATEGORIES = {
  'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  'video': ['video/mp4', 'video/avi', 'video/mov', 'video/webm'],
  'audio': ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],
  'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'archive': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
};

export const UniversalFileManager: React.FC<FileManagerProps> = ({
  moduleId,
  businessId,
  mode = 'grid',
  allowUpload = true,
  allowDownload = true,
  allowDelete = false,
  allowBatch = true,
  showPreview = true,
  showSearch = true,
  showFilters = true,
  pageSize = 20,
  customActions = [],
  onFileSelect,
  onUploadComplete
}) => {
  const [state, setState] = useState<FileManagerState>({
    files: [],
    selectedFiles: new Set(),
    loading: false,
    uploading: false,
    error: null,
    searchQuery: '',
    filters: {
      mimeType: '',
      dateRange: { start: null, end: null },
      sizeRange: { min: 0, max: Number.MAX_SAFE_INTEGER }
    },
    sortBy: 'uploadTime',
    sortOrder: 'desc',
    pagination: {
      page: 1,
      pageSize,
      total: 0,
      totalPages: 0
    },
    previewFile: null,
    showUploadModal: false
  });

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const queryOptions: FileQueryOptions = {
        moduleId,
        businessId,
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      };

      // 添加搜索查询
      if (state.searchQuery) {
        // 这里应该调用文件服务的搜索API
        // queryOptions.search = state.searchQuery;
      }

      // 添加筛选条件
      if (state.filters.mimeType) {
        queryOptions.mimeType = state.filters.mimeType;
      }
      if (state.filters.dateRange.start) {
        queryOptions.startTime = state.filters.dateRange.start;
      }
      if (state.filters.dateRange.end) {
        queryOptions.endTime = state.filters.dateRange.end;
      }

      // 这里应该调用实际的文件服务API
      // const result = await fileService.queryFiles(queryOptions);
      
      // 模拟API调用
      const mockResult: PaginatedResult<FileMetadata> = {
        items: [],
        total: 0,
        page: queryOptions.page || 1,
        pageSize: queryOptions.pageSize || 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };

      setState(prev => ({
        ...prev,
        files: mockResult.items,
        pagination: {
          page: mockResult.page,
          pageSize: mockResult.pageSize,
          total: mockResult.total,
          totalPages: mockResult.totalPages
        },
        loading: false
      }));

    } catch (error) {
      console.error('加载文件列表失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载文件列表失败'
      }));
    }
  }, [moduleId, businessId, state.searchQuery, state.filters, state.sortBy, state.sortOrder, state.pagination.page, state.pagination.pageSize]);

  // 初始加载
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // 文件选择处理
  const handleFileSelect = useCallback((fileId: string, selected: boolean) => {
    setState(prev => {
      const newSelectedFiles = new Set(prev.selectedFiles);
      if (selected) {
        newSelectedFiles.add(fileId);
      } else {
        newSelectedFiles.delete(fileId);
      }

      const selectedFileList = prev.files.filter(file => newSelectedFiles.has(file.id));
      
      if (onFileSelect) {
        onFileSelect(selectedFileList);
      }

      return {
        ...prev,
        selectedFiles: newSelectedFiles
      };
    });
  }, [onFileSelect, state.files]);

  // 全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    setState(prev => {
      const newSelectedFiles = selected 
        ? new Set(prev.files.map(file => file.id))
        : new Set<string>();

      const selectedFileList = selected ? prev.files : [];
      
      if (onFileSelect) {
        onFileSelect(selectedFileList);
      }

      return {
        ...prev,
        selectedFiles: newSelectedFiles
      };
    });
  }, [onFileSelect, state.files]);

  // 删除文件
  const handleDeleteFiles = useCallback(async (fileIds: string[]) => {
    if (!window.confirm(`确定要删除选中的 ${fileIds.length} 个文件吗？`)) {
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // 这里应该调用实际的删除API
      // await fileService.deleteFiles(fileIds);
      
      console.log('删除文件:', fileIds);
      
      // 重新加载文件列表
      await loadFiles();
      
      setState(prev => ({
        ...prev,
        selectedFiles: new Set(),
        loading: false
      }));

    } catch (error) {
      console.error('删除文件失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '删除文件失败'
      }));
    }
  }, [loadFiles]);

  // 下载文件
  const handleDownloadFile = useCallback(async (file: FileMetadata) => {
    try {
      // 这里应该调用实际的下载API
      // const downloadUrl = await fileService.getDownloadUrl(file.id);
      // window.open(downloadUrl, '_blank');
      
      console.log('下载文件:', file.originalName);
      
    } catch (error) {
      console.error('下载文件失败:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '下载文件失败'
      }));
    }
  }, []);

  // 预览文件
  const handlePreviewFile = useCallback((file: FileMetadata) => {
    setState(prev => ({
      ...prev,
      previewFile: file
    }));
  }, []);

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      previewFile: null
    }));
  }, []);

  // 搜索处理
  const handleSearch = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  // 筛选处理
  const handleFilterChange = useCallback((filterType: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: value
      },
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  // 排序处理
  const handleSort = useCallback((field: keyof FileMetadata) => {
    setState(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  // 分页处理
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  }, []);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 获取文件类型图标
  const getFileTypeIcon = useCallback((mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    if (mimeType.includes('powerpoint')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  }, []);

  // 获取文件类型标签
  const getFileTypeLabel = useCallback((mimeType: string): string => {
    for (const [category, types] of Object.entries(MIME_TYPE_CATEGORIES)) {
      if (types.some(type => mimeType.includes(type))) {
        return category;
      }
    }
    return 'other';
  }, []);

  // 判断文件是否可预览
  const isPreviewable = useCallback((file: FileMetadata): boolean => {
    return file.mimeType.startsWith('image/') || 
           file.mimeType.startsWith('video/') || 
           file.mimeType.startsWith('audio/') ||
           file.mimeType.includes('pdf');
  }, []);

  // 渲染文件项
  const renderFileItem = useCallback((file: FileMetadata) => {
    const isSelected = state.selectedFiles.has(file.id);
    const typeIcon = getFileTypeIcon(file.mimeType);
    const typeLabel = getFileTypeLabel(file.mimeType);
    
    return (
      <div
        key={file.id}
        className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleFileSelect(file.id, !isSelected)}
      >
        {/* 选择复选框 */}
        {allowBatch && (
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleFileSelect(file.id, e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 文件图标和信息 */}
        <div className="flex flex-col items-center space-y-2">
          <div className="text-4xl">{typeIcon}</div>
          
          <div className="text-center w-full">
            <h3 className="font-medium text-sm text-gray-900 truncate" title={file.originalName}>
              {file.originalName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(file.size)}
            </p>
            <p className="text-xs text-blue-600 capitalize">
              {typeLabel}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(file.uploadTime).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            {showPreview && isPreviewable(file) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewFile(file);
                }}
                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-white rounded"
                title="预览"
              >
                👁️
              </button>
            )}
            
            {allowDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadFile(file);
                }}
                className="p-1 text-gray-600 hover:text-green-600 hover:bg-white rounded"
                title="下载"
              >
                ⬇️
              </button>
            )}
            
            {allowDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFiles([file.id]);
                }}
                className="p-1 text-gray-600 hover:text-red-600 hover:bg-white rounded"
                title="删除"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    state.selectedFiles,
    allowBatch,
    allowDownload,
    allowDelete,
    showPreview,
    handleFileSelect,
    handlePreviewFile,
    handleDownloadFile,
    handleDeleteFiles,
    getFileTypeIcon,
    getFileTypeLabel,
    formatFileSize,
    isPreviewable
  ]);

  // 渲染搜索栏
  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索文件名..."
            value={state.searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染筛选器
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">筛选器</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 文件类型筛选 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              文件类型
            </label>
            <select
              value={state.filters.mimeType}
              onChange={(e) => handleFilterChange('mimeType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="image/">图片</option>
              <option value="video/">视频</option>
              <option value="audio/">音频</option>
              <option value="application/pdf">PDF</option>
              <option value="application/">文档</option>
            </select>
          </div>

          {/* 日期范围筛选 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              上传时间
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={state.filters.dateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...state.filters.dateRange,
                  start: e.target.value ? new Date(e.target.value) : null
                })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={state.filters.dateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...state.filters.dateRange,
                  end: e.target.value ? new Date(e.target.value) : null
                })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 清除筛选器 */}
          <div className="flex items-end">
            <button
              onClick={() => setState(prev => ({
                ...prev,
                filters: {
                  mimeType: '',
                  dateRange: { start: null, end: null },
                  sizeRange: { min: 0, max: Number.MAX_SAFE_INTEGER }
                }
              }))}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              清除筛选
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染工具栏
  const renderToolbar = () => {
    const selectedCount = state.selectedFiles.size;
    const hasSelection = selectedCount > 0;

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* 全选按钮 */}
          {allowBatch && state.files.length > 0 && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCount === state.files.length && state.files.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                全选 ({selectedCount}/{state.files.length})
              </span>
            </label>
          )}

          {/* 批量操作按钮 */}
          {hasSelection && (
            <div className="flex items-center space-x-2">
              {allowDelete && (
                <button
                  onClick={() => handleDeleteFiles(Array.from(state.selectedFiles))}
                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  删除选中 ({selectedCount})
                </button>
              )}

              {/* 自定义操作 */}
              {customActions.map(action => {
                const selectedFileList = state.files.filter(file => state.selectedFiles.has(file.id));
                const isDisabled = action.disabled?.(selectedFileList) || false;
                
                return (
                  <button
                    key={action.key}
                    onClick={() => action.onClick(selectedFileList)}
                    disabled={isDisabled}
                    className={`px-3 py-1 text-sm border rounded ${
                      isDisabled
                        ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {action.icon && <span className="mr-1">{action.icon}</span>}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* 排序选择 */}
          <select
            value={`${state.sortBy}-${state.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [keyof FileMetadata, 'asc' | 'desc'];
              setState(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="uploadTime-desc">最新上传</option>
            <option value="uploadTime-asc">最早上传</option>
            <option value="originalName-asc">文件名 A-Z</option>
            <option value="originalName-desc">文件名 Z-A</option>
            <option value="size-desc">文件大小 大-小</option>
            <option value="size-asc">文件大小 小-大</option>
          </select>

          {/* 上传按钮 */}
          {allowUpload && (
            <button
              onClick={() => setState(prev => ({ ...prev, showUploadModal: true }))}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              ⬆️ 上传文件
            </button>
          )}
        </div>
      </div>
    );
  };

  // 渲染分页
  const renderPagination = () => {
    if (state.pagination.totalPages <= 1) return null;

    const { page, totalPages } = state.pagination;
    const pages = [];
    
    // 计算显示的页码范围
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          显示第 {(page - 1) * state.pagination.pageSize + 1} - {Math.min(page * state.pagination.pageSize, state.pagination.total)} 项，
          共 {state.pagination.total} 项
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>

          {pages.map(pageNum => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-1 text-sm border rounded ${
                pageNum === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 错误提示 */}
      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{state.error}</p>
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            关闭
          </button>
        </div>
      )}

      {/* 搜索栏 */}
      {renderSearchBar()}

      {/* 筛选器 */}
      {renderFilters()}

      {/* 工具栏 */}
      {renderToolbar()}

      {/* 文件列表 */}
      <div className="min-h-96">
        {state.loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>加载中...</p>
            </div>
          </div>
        ) : state.files.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <p className="text-4xl mb-2">📁</p>
              <p>暂无文件</p>
              {allowUpload && (
                <button
                  onClick={() => setState(prev => ({ ...prev, showUploadModal: true }))}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  点击上传第一个文件
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            mode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-1'
          }`}>
            {state.files.map(renderFileItem)}
          </div>
        )}
      </div>

      {/* 分页 */}
      {renderPagination()}

      {/* 文件预览模态框 */}
      {state.previewFile && showPreview && (
        <FilePreviewModal
          file={state.previewFile}
          onClose={handleClosePreview}
        />
      )}

      {/* 上传模态框 */}
      {state.showUploadModal && allowUpload && (
        <UploadModal
          moduleId={moduleId}
          businessId={businessId}
          onClose={() => setState(prev => ({ ...prev, showUploadModal: false }))}
          onUploadComplete={(files) => {
            setState(prev => ({ ...prev, showUploadModal: false }));
            if (onUploadComplete) {
              onUploadComplete(files);
            }
            loadFiles(); // 重新加载文件列表
          }}
        />
      )}
    </div>
  );
};

// 文件预览模态框组件
export interface FilePreviewModalProps {
  file: FileMetadata;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const renderPreviewContent = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <img
          src={file.cdnUrl || `/api/files/${file.id}/download`}
          alt={file.originalName}
          className="max-w-full max-h-full object-contain"
        />
      );
    }

    if (file.mimeType.startsWith('video/')) {
      return (
        <video
          src={file.cdnUrl || `/api/files/${file.id}/download`}
          controls
          className="max-w-full max-h-full"
        >
          您的浏览器不支持视频播放
        </video>
      );
    }

    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-6xl">🎵</div>
          <audio
            src={file.cdnUrl || `/api/files/${file.id}/download`}
            controls
            className="w-full max-w-md"
          >
            您的浏览器不支持音频播放
          </audio>
        </div>
      );
    }

    if (file.mimeType.includes('pdf')) {
      return (
        <iframe
          src={`${file.cdnUrl || `/api/files/${file.id}/download`}#toolbar=0`}
          className="w-full h-full min-h-96"
          title={file.originalName}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-4xl mb-4">📄</div>
        <p>此文件类型暂不支持预览</p>
        <a
          href={file.cdnUrl || `/api/files/${file.id}/download`}
          download={file.originalName}
          className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
        >
          下载文件
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium truncate" title={file.originalName}>
            {file.originalName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* 预览内容 */}
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
          {renderPreviewContent()}
        </div>

        {/* 底部信息 */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">文件大小：</span>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <div>
              <span className="font-medium">上传时间：</span>
              {new Date(file.uploadTime).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">文件类型：</span>
              {file.mimeType}
            </div>
            <div>
              <span className="font-medium">访问次数：</span>
              {file.accessCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 上传模态框组件
export interface UploadModalProps {
  moduleId?: string;
  businessId?: string;
  onClose: () => void;
  onUploadComplete: (files: FileMetadata[]) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  moduleId,
  businessId,
  onClose,
  onUploadComplete
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">上传文件</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            这里将集成UniversalFileUploader组件
          </p>
          
          {/* 这里应该集成 UniversalFileUploader 组件 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📁</div>
            <p>拖拽文件到此处或点击选择文件</p>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                // 模拟上传完成
                console.log('选择文件:', e.target.files);
                onUploadComplete([]);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalFileManager; 