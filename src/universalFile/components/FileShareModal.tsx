/**
 * 文件分享模态框组件
 * 支持生成分享链接、设置访问权限、过期时间等
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FileMetadata } from '../types';

export interface FileShareModalProps {
  /** 要分享的文件 */
  files: FileMetadata[];
  /** 关闭回调 */
  onClose: () => void;
  /** 分享成功回调 */
  onShareSuccess?: (shareInfo: ShareInfo) => void;
}

export interface ShareInfo {
  /** 分享链接 */
  shareUrl: string;
  /** 访问密码 */
  password?: string;
  /** 过期时间 */
  expiresAt?: Date;
  /** 访问权限 */
  permission: 'view' | 'download';
  /** 分享代码 */
  shareCode: string;
}

interface ShareOptions {
  /** 过期时间类型 */
  expireType: 'never' | '1hour' | '1day' | '7days' | '30days' | 'custom';
  /** 自定义过期时间 */
  customExpireTime?: Date;
  /** 是否需要密码 */
  requirePassword: boolean;
  /** 访问密码 */
  password: string;
  /** 访问权限 */
  permission: 'view' | 'download';
  /** 允许的下载次数 */
  downloadLimit?: number;
}

const FileShareModal: React.FC<FileShareModalProps> = ({
  files,
  onClose,
  onShareSuccess
}) => {
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    expireType: '7days',
    requirePassword: false,
    password: '',
    permission: 'view',
    downloadLimit: undefined
  });

  const [loading, setLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 生成随机密码
  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setShareOptions(prev => ({ ...prev, password }));
  }, []);

  // 计算过期时间
  const getExpiresAt = useCallback((): Date | undefined => {
    const now = new Date();
    switch (shareOptions.expireType) {
      case 'never':
        return undefined;
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '7days':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'custom':
        return shareOptions.customExpireTime;
      default:
        return undefined;
    }
  }, [shareOptions.expireType, shareOptions.customExpireTime]);

  // 创建分享
  const handleCreateShare = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const expiresAt = getExpiresAt();
      
      // 这里应该调用实际的分享API
      // const shareResult = await fileService.createShare({
      //   fileIds: files.map(f => f.id),
      //   password: shareOptions.requirePassword ? shareOptions.password : undefined,
      //   expiresAt,
      //   permission: shareOptions.permission,
      //   downloadLimit: shareOptions.downloadLimit
      // });

      // 模拟API调用
      const mockShareInfo: ShareInfo = {
        shareUrl: (window.location.origin) + '/share/' + (generateShareCode()),
        password: shareOptions.requirePassword ? shareOptions.password : undefined,
        expiresAt,
        permission: shareOptions.permission,
        shareCode: generateShareCode()
      };

      setShareInfo(mockShareInfo);
      
      if (onShareSuccess) {
        onShareSuccess(mockShareInfo);
      }

    } catch (error) {
      console.error('创建分享失败:', error);
      setError(error instanceof Error ? error.message : '创建分享失败');
    } finally {
      setLoading(false);
    }
  }, [files, shareOptions, getExpiresAt, onShareSuccess]);

  // 生成分享代码
  const generateShareCode = useCallback(() => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }, []);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以显示复制成功提示
      console.log('复制成功');
    } catch (error) {
      console.error('复制失败:', error);
      // 备用方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }, []);

  // 格式化文件列表
  const formatFileList = useCallback(() => {
    if (files.length === 0) return '0 个文件';
    if (files.length === 1 && files[0]) {
      return files[0].originalName;
    }
    return (files.length) + ' 个文件';
  }, [files]);

  // 渲染分享设置
  const renderShareSettings = () => {
    if (shareInfo) return null;

    return (
      <div className="space-y-6">
        {/* 文件信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">要分享的文件</h3>
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">{file.originalName}</span>
                <span className="text-gray-500 text-xs">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 过期时间设置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            过期时间
          </label>
          <select
            value={shareOptions.expireType}
            onChange={(e) => setShareOptions(prev => ({ 
              ...prev, 
              expireType: e.target.value as ShareOptions['expireType']
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="never">永不过期</option>
            <option value="1hour">1小时后</option>
            <option value="1day">1天后</option>
            <option value="7days">7天后</option>
            <option value="30days">30天后</option>
            <option value="custom">自定义时间</option>
          </select>

          {shareOptions.expireType === 'custom' && (
            <div className="mt-2">
              <input
                type="datetime-local"
                value={shareOptions.customExpireTime?.toISOString().slice(0, 16) || ''}
                onChange={(e) => setShareOptions(prev => ({
                  ...prev,
                  customExpireTime: e.target.value ? new Date(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        {/* 访问权限 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            访问权限
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="permission"
                value="view"
                checked={shareOptions.permission === 'view'}
                onChange={(e) => setShareOptions(prev => ({ 
                  ...prev, 
                  permission: e.target.value as 'view' | 'download'
                }))}
                className="mr-2"
              />
              <span className="text-sm">仅预览（不允许下载）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="permission"
                value="download"
                checked={shareOptions.permission === 'download'}
                onChange={(e) => setShareOptions(prev => ({ 
                  ...prev, 
                  permission: e.target.value as 'view' | 'download'
                }))}
                className="mr-2"
              />
              <span className="text-sm">允许下载</span>
            </label>
          </div>
        </div>

        {/* 访问密码 */}
        <div>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={shareOptions.requirePassword}
              onChange={(e) => setShareOptions(prev => ({
                ...prev,
                requirePassword: e.target.checked,
                password: e.target.checked ? prev.password : ''
              }))}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">设置访问密码</span>
          </label>

          {shareOptions.requirePassword && (
            <div className="flex space-x-2">
              <input
                type="text"
                value={shareOptions.password}
                onChange={(e) => setShareOptions(prev => ({ 
                  ...prev, 
                  password: e.target.value
                }))}
                placeholder="输入访问密码"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                maxLength={20}
              />
              <button
                type="button"
                onClick={generatePassword}
                className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                随机生成
              </button>
            </div>
          )}
        </div>

        {/* 下载次数限制 */}
        {shareOptions.permission === 'download' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              下载次数限制
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={shareOptions.downloadLimit !== undefined}
                onChange={(e) => setShareOptions(prev => ({
                  ...prev,
                  downloadLimit: e.target.checked ? 10 : undefined
                }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">限制下载次数</span>
              {shareOptions.downloadLimit !== undefined && (
                <input
                  type="number"
                  value={shareOptions.downloadLimit}
                  onChange={(e) => setShareOptions(prev => ({
                    ...prev,
                    downloadLimit: parseInt(e.target.value) || 1
                  }))}
                  min={1}
                  max={1000}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染分享结果
  const renderShareResult = () => {
    if (!shareInfo) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            分享链接已创建
          </h3>
          <p className="text-sm text-gray-600">
            {formatFileList()} 已成功创建分享链接
          </p>
        </div>

        {/* 分享链接 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分享链接
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={shareInfo.shareUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
            />
            <button
              onClick={() => copyToClipboard(shareInfo.shareUrl)}
              className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
            >
              复制链接
            </button>
          </div>
        </div>

        {/* 访问密码 */}
        {shareInfo.password && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              访问密码
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shareInfo.password}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
              />
              <button
                onClick={() => copyToClipboard(shareInfo.password!)}
                className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                复制密码
              </button>
            </div>
            <p className="text-xs text-yellow-800 mt-2">
              ⚠️ 请妥善保管访问密码，访问者需要此密码才能查看文件
            </p>
          </div>
        )}

        {/* 分享信息 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">分享信息</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div>
              <span className="font-medium">权限：</span>
              {shareInfo.permission === 'view' ? '仅预览' : '允许下载'}
            </div>
            {shareInfo.expiresAt && (
              <div>
                <span className="font-medium">过期时间：</span>
                {shareInfo.expiresAt.toLocaleString()}
              </div>
            )}
            <div>
              <span className="font-medium">分享代码：</span>
              {shareInfo.shareCode}
            </div>
          </div>
        </div>

        {/* 复制完整信息 */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const shareText = [
                '文件分享：' + (formatFileList()),
                '链接：' + (shareInfo.shareUrl),
                shareInfo.password ? '密码：' + (shareInfo.password) : '',
                shareInfo.expiresAt ? '过期时间：' + (shareInfo.expiresAt.toLocaleString()) : '永不过期'
              ].filter(Boolean).join('\n');
              
              copyToClipboard(shareText);
            }}
            className="flex-1 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            📋 复制完整信息
          </button>
          <button
            onClick={() => {
              // 生成二维码或其他分享方式
              console.log('其他分享方式');
            }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            🔗 其他分享方式
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">
            {shareInfo ? '分享成功' : '创建分享链接'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {renderShareSettings()}
          {renderShareResult()}
        </div>

        {/* 底部按钮 */}
        {!shareInfo && (
          <div className="flex items-center justify-end space-x-2 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleCreateShare}
              disabled={loading || (shareOptions.requirePassword && !shareOptions.password)}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  创建中...
                </span>
              ) : (
                '创建分享链接'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileShareModal; 