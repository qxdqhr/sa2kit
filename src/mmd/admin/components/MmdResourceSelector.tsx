/**
 * MMD 资源选择器组件
 * 
 * 集成 UniversalFile 文件上传组件，支持：
 * - 文件上传到OSS
 * - 文件列表浏览
 * - 文件选择
 * - 文件预览
 * 
 * @package sa2kit/mmd/admin
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  CheckCircle2,
  Search,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';

import { MMD_RESOURCE_TYPE_CONFIGS } from '../types';
import type { ResourceSelectorProps, MmdResourceOptionDB } from '../types';
import type { FileMetadata } from '../../../universalFile/types';

/**
 * MMD资源选择器
 */
export const MmdResourceSelector: React.FC<ResourceSelectorProps> = ({
  resourceType,
  fileService,
  userId,
  value,
  onChange,
  required = false,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(value);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [zipValidationError, setZipValidationError] = useState<string | null>(null);

  // 从配置获取资源类型信息
  const config = MMD_RESOURCE_TYPE_CONFIGS[resourceType];

  // 防御性检查（理论上不会发生，因为 resourceType 为受控枚举）
  if (!config) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        未找到资源类型配置：{resourceType}
      </div>
    );
  }

  // 获取文件图标
  const getFileIcon = () => {
    switch (resourceType) {
      case 'model':
      case 'stage':
        return <Film className="w-5 h-5" />;
      case 'motion':
      case 'camera':
        return <FileText className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    if (!fileService || !config) return;

    setLoading(true);
    try {
      const result = await fileService.queryFiles({
        moduleId: config.moduleId,
        pageSize: 50,
        page: 1,
        sortBy: 'uploadTime',
        sortOrder: 'desc',
      });

      setFiles(result.items || []);
    } catch (error) {
      console.error('加载文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [fileService, config]);

  // 初始加载
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // 加载选中的文件信息
  useEffect(() => {
    if (selectedFileId && fileService) {
      fileService
        .getFileMetadata(selectedFileId)
        .then((file: FileMetadata) => setSelectedFile(file))
        .catch((error: any) => console.error('加载文件信息失败:', error));
    } else {
      setSelectedFile(null);
    }
  }, [selectedFileId, fileService]);

  // 处理文件选择
  const handleFileSelect = (file: FileMetadata) => {
    setSelectedFileId(file.id);
    setSelectedFile(file);
    
    // 获取文件URL并回调
    fileService
      .getFileUrl(file.id)
      .then((url: string) => onChange(file.id, url))
      .catch((error: any) => console.error('获取文件URL失败:', error));
  };

  const validateZipContents = async (buffer: ArrayBuffer, type: 'model' | 'stage') => {
    const zip = await JSZip.loadAsync(buffer);
    const entries = Object.keys(zip.files);

    if (!entries.length) {
      throw new Error('压缩包为空，请检查文件内容');
    }

    const hasModel =
      entries.some((name) => /\.[pP][mM][xX]$/.test(name)) ||
      (type === 'stage' && entries.some((name) => /\.[pP][mM][dD]$/.test(name)));

    const hasAssets = entries.some((name) =>
      /\.(png|jpg|jpeg|bmp|tga|dds|spa|sph)$/i.test(name),
    );

    if (!hasModel) {
      throw new Error(type === 'stage' ? '压缩包中未找到 PMX/PMD 舞台模型文件' : '压缩包中未找到 PMX 模型文件');
    }

    if (!hasAssets) {
      throw new Error('压缩包中未发现贴图文件，请确认是否包含 texture 目录');
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!fileService) return;

    setUploading(true);
    setZipValidationError(null);
    try {
      if (resourceType === 'model' || resourceType === 'stage') {
        const arrayBuffer = await file.arrayBuffer();
        await validateZipContents(arrayBuffer, resourceType);
      }

      const fileMetadata = await fileService.uploadFile({
        file,
        moduleId: config.moduleId,
        businessId: userId,
        permission: 'public',
      });

      // 刷新文件列表
      await loadFiles();

      // 自动选择刚上传的文件
      handleFileSelect(fileMetadata);
      setShowUploader(false);
    } catch (error) {
      console.error('文件上传失败:', error);
      const message = error instanceof Error ? error.message : '未知错误';
      setZipValidationError(message);
      alert(`上传失败: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  // 过滤文件列表
  const filteredFiles = files.filter((file) =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 标题和上传按钮 */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {getFileIcon()}
          {config.description}
          {required && <span className="text-red-500">*</span>}
        </label>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          上传新文件
        </button>
      </div>

      {/* 当前选中的文件 */}
      {selectedFile && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedFile.originalName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedFileId(undefined);
              setSelectedFile(null);
              onChange('', '');
            }}
            className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 文件上传区域 */}
      {showUploader && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 space-y-1">
            <p>支持的文件类型: {config.acceptedTypes.join(', ')}</p>
            <p>最大文件大小: {config.maxFileSize}MB</p>
            {config.hint && (
              <p className="text-xs text-amber-600 dark:text-amber-400">{config.hint}</p>
            )}
          </div>
          
          <input
            type="file"
            accept={config.acceptedTypes.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // 验证文件大小
                if (file.size > config.maxFileSize * 1024 * 1024) {
                  alert(`文件大小超过限制（最大 ${config.maxFileSize}MB）`);
                  return;
                }
                handleFileUpload(file);
              }
            }}
            disabled={uploading}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />

          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              上传中...
            </div>
          )}
          {zipValidationError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {zipValidationError}
            </div>
          )}
        </div>
      )}

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索文件..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 文件列表 */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            加载中...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? '没有找到匹配的文件' : '暂无文件，请上传'}
          </div>
        ) : (
          filteredFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => handleFileSelect(file)}
              className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                selectedFileId === file.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {new Date(file.uploadTime).toLocaleDateString()}
                  </div>
                </div>
                {selectedFileId === file.id && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* 提示信息 */}
      {required && !selectedFileId && (
        <div className="text-sm text-red-600 dark:text-red-400">
          请选择一个{config.description}
        </div>
      )}
    </div>
  );
};

