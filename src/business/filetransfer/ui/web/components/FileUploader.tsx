/**
 * FileUploader 组件
 * 
 * 提供文件上传功能的组件
 * 支持拖拽上传和点击上传
 * 显示上传进度和状态
 */

'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle, Plus } from 'lucide-react';
import type { FileTransfer } from '../../../domain/types';

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export function FileUploader({ 
  onUpload, 
  maxFileSize = 100 * 1024 * 1024, // 默认100MB
  allowedFileTypes = ['*'] 
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 验证文件
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `文件大小超过限制（最大 ${formatFileSize(maxFileSize)}）`;
    }
    
    if (allowedFileTypes[0] !== '*' && !allowedFileTypes.includes(file.type)) {
      return `不支持的文件类型：${file.type}`;
    }
    
    return null;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="w-full">
      {/* 拖拽上传区域 - Apple Design */}
      <div
        className={`
          relative border-2 border-dashed rounded-3xl p-12
          flex flex-col items-center justify-center
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-blue-400 bg-blue-50/80 backdrop-blur-xl scale-[1.02] shadow-xl shadow-blue-500/25' 
            : 'border-slate-300/60 hover:border-blue-300 hover:bg-blue-50/30'
          }
          ${isUploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}
          backdrop-blur-sm bg-white/40
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        
        {/* 上传图标 */}
        <div className={`
          w-20 h-20 rounded-2xl mb-6 flex items-center justify-center transition-all duration-300
          ${isDragging || isUploading
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30'
            : 'bg-gradient-to-br from-slate-100 to-slate-200 hover:from-blue-100 hover:to-indigo-100'
          }
        `}>
          {isUploading ? (
            <div className="relative">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <Upload className={`w-10 h-10 transition-colors duration-300 ${
              isDragging ? 'text-white' : 'text-slate-500'
            }`} />
          )}
        </div>
        
        {/* 上传文本 */}
        <div className="text-center space-y-3">
          <h3 className={`text-xl font-bold transition-colors duration-300 ${
            isUploading ? 'text-blue-600' : 'text-slate-900'
          }`}>
            {isUploading ? '正在上传文件...' : isDragging ? '松开鼠标上传文件' : '拖拽文件到此处'}
          </h3>
          
          <p className="text-slate-600 font-medium">
            或点击此区域选择文件
          </p>
          
          {/* 文件限制信息 */}
          <div className="mt-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-xl rounded-full border border-white/40">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-slate-600 font-medium">
                最大文件大小：{formatFileSize(maxFileSize)}
              </span>
            </div>
            
            {allowedFileTypes[0] !== '*' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-xl rounded-full border border-white/40 ml-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-600 font-medium">
                  支持格式：{allowedFileTypes.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 上传进度指示器 */}
        {isUploading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur-xl text-white rounded-full shadow-lg">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm font-medium">上传中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 - Apple Design */}
      {error && (
        <div className="mt-6 bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-800 font-semibold mb-1">上传失败</h4>
              <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="w-8 h-8 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 