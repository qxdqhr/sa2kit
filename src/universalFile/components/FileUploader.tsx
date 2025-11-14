/**
 * 通用文件上传组件
 * Universal File Uploader Component
 *
 * 支持拖拽上传、进度显示、多文件上传等功能
 * 使用 Tailwind CSS 样式，支持暗色模式
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileText,
  Image,
  Film,
  Music,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import type {
  FileMetadata,
  UploadProgress,
  UploadFileInfo,
  ProcessingOptions,
} from '../types';
import type { UniversalFileService } from '../server/UniversalFileService';

// ============= 类型定义 =============

export interface FileUploaderProps {
  /** 文件服务实例 */
  fileService: UniversalFileService;
  /** 模块标识 */
  moduleId: string;
  /** 业务标识 */
  businessId?: string;
  /** 允许的文件类型 */
  acceptedTypes?: string[];
  /** 最大文件大小(MB) */
  maxFileSize?: number;
  /** 最大文件数量 */
  maxFiles?: number;
  /** 是否支持多文件上传 */
  multiple?: boolean;
  /** 是否启用文件处理 */
  enableProcessing?: boolean;
  /** 默认处理选项 */
  defaultProcessingOptions?: ProcessingOptions;
  /** 上传成功回调 */
  onUploadSuccess?: (files: FileMetadata[]) => void;
  /** 上传失败回调 */
  onUploadError?: (error: string) => void;
  /** 上传进度回调 */
  onProgress?: (progress: UploadProgress[]) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 显示模式 */
  mode?: 'compact' | 'normal' | 'detailed';
}

export interface UploadingFile {
  id: string;
  file: File;
  progress: UploadProgress;
  metadata?: FileMetadata;
  error?: string;
}

// ============= 主组件 =============

export const FileUploader: React.FC<FileUploaderProps> = ({
  fileService,
  moduleId,
  businessId,
  acceptedTypes = [],
  maxFileSize = 100, // 100MB
  maxFiles = 10,
  multiple = true,
  enableProcessing = false,
  defaultProcessingOptions,
  onUploadSuccess,
  onUploadError,
  onProgress,
  className = '',
  disabled = false,
  mode = 'normal',
}) => {
  // ============= 状态管理 =============

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [completedFiles, setCompletedFiles] = useState<FileMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============= 文件类型图标 =============

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Film className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  // ============= 文件验证 =============

  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxFileSize}MB`;
    }

    // 检查文件类型
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}`;
    }

    return null;
  };

  // ============= 文件上传逻辑 =============

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 验证文件
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        return;
      }

      // 初始化上传进度
      const initialProgress: UploadProgress = {
        fileId,
        status: 'pending',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        speed: 0,
        remainingTime: 0,
      };

      const uploadingFile: UploadingFile = {
        id: fileId,
        file,
        progress: initialProgress,
      };

      setUploadingFiles((prev) => [...prev, uploadingFile]);

      try {
        // 构建上传文件信息
        const uploadInfo: UploadFileInfo = {
          file,
          moduleId,
          businessId,
          permission: 'public',
          needsProcessing: enableProcessing,
          processingOptions: defaultProcessingOptions,
        };

        // 开始上传
        const result = await fileService.uploadFile(
          uploadInfo,
          undefined, // 使用默认存储类型
          (progress) => {
            setUploadingFiles((prev) =>
              prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
            );

            // 调用外部进度回调
            const allProgress = uploadingFiles.map((f) => f.progress);
            onProgress?.(allProgress);
          }
        );

        // 上传成功，result直接是FileMetadata
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
        setCompletedFiles((prev) => [...prev, result]);
        onUploadSuccess?.([result]);
      } catch (error) {
        console.error('文件上传失败:', error);

        const errorMessage = error instanceof Error ? error.message : '上传失败';

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, error: errorMessage } : f))
        );

        onUploadError?.(errorMessage);
      }
    },
    [
      fileService,
      moduleId,
      businessId,
      enableProcessing,
      defaultProcessingOptions,
      maxFileSize,
      acceptedTypes,
      onUploadSuccess,
      onUploadError,
      onProgress,
      uploadingFiles,
    ]
  );

  // ============= 文件选择处理 =============

  const handleFileSelect = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // 检查文件数量限制
      if (completedFiles.length + uploadingFiles.length + fileArray.length > maxFiles) {
        onUploadError?.(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      // 逐个上传文件
      fileArray.forEach(uploadFile);
    },
    [completedFiles.length, uploadingFiles.length, maxFiles, onUploadError, uploadFile]
  );

  // ============= 事件处理 =============

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const removeCompletedFile = (fileId: string) => {
    setCompletedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // ============= 渲染辅助函数 =============

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatProgress = (progress: UploadProgress): string => {
    switch (progress.status) {
      case 'pending':
        return '准备中...';
      case 'uploading':
        return `上传中 ${progress.progress.toFixed(1)}%`;
      case 'processing':
        return '处理中...';
      case 'completed':
        return '完成';
      case 'failed':
        return '失败';
      default:
        return '未知状态';
    }
  };

  // ============= 样式计算 =============

  const containerClasses = `
    border-2 border-dashed rounded-lg transition-all duration-200
    ${
      isDragOver
        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-300 dark:border-gray-600'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 cursor-pointer'}
    ${className}
  `;

  const uploadAreaClasses = `
    p-6 text-center
    ${mode === 'compact' ? 'p-4' : mode === 'detailed' ? 'p-8' : 'p-6'}
  `;

  // ============= 渲染 =============

  return (
    <div className="w-full space-y-4">
      {/* 文件上传区域 */}
      <div
        className={containerClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className={uploadAreaClasses}>
          <Upload
            className={`mx-auto mb-4 text-gray-400 ${mode === 'compact' ? 'w-8 h-8 mb-2' : 'w-12 h-12'}`}
          />

          {mode === 'compact' ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">点击上传或拖拽文件到这里</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                上传文件
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">点击选择文件或拖拽文件到这里</p>
              {mode === 'detailed' && (
                <div className="text-sm text-gray-500 space-y-1">
                  {acceptedTypes.length > 0 && <p>支持格式: {acceptedTypes.join(', ')}</p>}
                  <p>
                    最大大小: {maxFileSize}MB | 最多文件: {maxFiles}个
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* 上传进度列表 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            上传中 ({uploadingFiles.length})
          </h4>

          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {/* 文件图标 */}
              <div className="flex-shrink-0">
                {uploadingFile.progress.status === 'failed' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : uploadingFile.progress.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {uploadingFile.file.name}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(uploadingFile.file.size)}
                  </span>
                </div>

                {uploadingFile.error ? (
                  <p className="text-xs text-red-500">{uploadingFile.error}</p>
                ) : (
                  <>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatProgress(uploadingFile.progress)}
                    </p>
                  </>
                )}
              </div>

              {/* 移除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeUploadingFile(uploadingFile.id);
                }}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 已完成文件列表 */}
      {completedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            已完成 ({completedFiles.length})
          </h4>

          {completedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              {/* 文件图标 */}
              <div className="flex-shrink-0">{getFileIcon(file.mimeType)}</div>

              {/* 文件信息 */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {file.originalName}
                  </p>
                  <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  上传成功 • {new Date(file.uploadTime).toLocaleTimeString()}
                </p>
              </div>

              {/* 移除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCompletedFile(file.id);
                }}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {mode === 'detailed' && (completedFiles.length > 0 || uploadingFiles.length > 0) && (
        <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>总计: {completedFiles.length + uploadingFiles.length} 文件</span>
          <span>
            大小:{' '}
            {formatFileSize(
              [
                ...completedFiles.map((f) => f.size),
                ...uploadingFiles.map((f) => f.file.size),
              ].reduce((total, size) => total + size, 0)
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;

