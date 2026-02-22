/**
 * 通用图片上传组件
 * 使用通用文件服务，支持阿里云OSS存储
 * 可在画集封面和作品图片之间复用
 *
 * 修复记录：
 * - 2026-01-19: 修复封面图片上传覆盖问题
 *   为封面图片生成唯一文件夹路径（包含时间戳和随机ID），避免新画集覆盖历史画集的封面图片
 * - 2026-01-19: 修复图片链接过期问题
 *   为封面图片路径添加文件扩展名，确保被正确识别为图片文件，避免生成带过期时间的签名URL
 */

'use client';

import React, { useState, useEffect } from 'react';

interface UniversalImageUploadProps {
  /** 当前图片值（URL） */
  value?: string;
  /** 通用文件服务的文件ID */
  fileId?: string;
  /** 值变化回调，返回包含image和fileId的对象 */
  onChange: (data: { image?: string; fileId?: string }) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 标签文本 */
  label?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 业务类型：cover(封面) 或 artwork(作品) */
  businessType?: 'cover' | 'artwork';
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  /** 是否显示测试按钮 */
  showTestButton?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

export const UniversalImageUpload: React.FC<UniversalImageUploadProps> = ({
  value,
  fileId,
  onChange,
  placeholder = "上传图片",
  label = "图片",
  disabled = false,
  businessType = 'cover',
  showDebugInfo = false,
  showTestButton = false,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [inputId] = useState(() => `universal-image-upload-${Math.random().toString(36).substr(2, 9)}`);

  // 组件挂载时的初始化
  useEffect(() => {
    // 组件初始化逻辑（已移除调试信息）
  }, [inputId, businessType]);

  // 处理通用文件服务上传
  const handleUniversalUpload = async (file: File) => {
    setUploading(true);
    try {
      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('moduleId', 'showmasterpiece');
      formData.append('businessId', businessType);

      // 为封面图片生成唯一的文件夹路径，避免覆盖历史文件
      // 路径包含文件扩展名，确保被正确识别为图片文件
      if (businessType === 'cover') {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        // 获取文件扩展名，默认为.jpg
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        formData.append('folderPath', `showmasterpiece/cover/${timestamp}_${randomId}.${extension}`);
      }

      formData.append('needsProcessing', 'true');
      
      // 调用通用文件上传API
      const response = await fetch('/api/universal-file/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '上传失败');
      }
      
      // 更新状态为使用新的文件服务
      onChange({
        image: result.data.accessUrl, // 使用访问URL
        fileId: result.data.fileId
      });
      
    } catch (error) {
      // 上传失败时的友好提示
      alert(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    await handleUniversalUpload(file);
  };

  // 渲染文件上传界面
  const renderUploadArea = () => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    const handleTestClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.click();
      }
    };

    const handleDivClick = (e: React.MouseEvent) => {
      // 处理div点击事件
    };

    return (
      <div 
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
        onClick={handleDivClick}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* 文件选择器 */}
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled || uploading}
          id={inputId}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            opacity: 0, 
            cursor: 'pointer',
            zIndex: 10
          }}
        />
        
        {/* 显示内容 */}
        <div className="text-slate-500 pointer-events-none">
          {uploading ? (
            <>
              <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm font-medium">正在上传到云存储...</p>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-semibold text-slate-700 mb-2">{placeholder}</p>
              <p className="text-sm text-slate-600 mb-1">支持 JPG、PNG、GIF、WebP 格式</p>
              <p className="text-xs text-blue-600">
                自动上传到云存储，享受CDN加速
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  // 渲染预览
  const renderPreview = () => {
    if (!value && !fileId) {
      return null;
    }

    const imageUrl = value || (fileId ? `/api/universal-file/${fileId}` : '');

    return (
      <div className="mt-4">
        <div className="relative inline-block group">
          <img
            src={imageUrl}
            alt={`${businessType === 'cover' ? '封面' : '作品'}预览`}
            className="max-w-full h-auto max-h-64 rounded-xl border-2 border-slate-200 shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={() => onChange({ image: undefined, fileId: undefined })}
            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
            title="删除图片"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-3">
          {label}
        </label>
      )}
      
      {/* 上传状态指示 */}
      {fileId && (
        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>图片已上传到云存储</span>
        </div>
        </div>
      )}
      
      {/* 上传区域 */}
      {renderUploadArea()}
      
      {/* 预览区域 */}
      {renderPreview()}
      
      {/* 说明文字 */}
      <div className="mt-3 text-xs text-slate-500">
        {businessType === 'cover' ? '封面图片' : '作品图片'}将自动上传到云存储并通过CDN分发，提供更好的性能和用户体验
      </div>
    </div>
  );
}; 