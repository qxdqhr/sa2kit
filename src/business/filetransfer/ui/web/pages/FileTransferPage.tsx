/**
 * FileTransferPage 组件
 * 
 * 文件传输模块的主页面
 * 包含文件上传和传输列表功能
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CloudUpload, FileIcon, Lock, Shield, Sparkles, Zap } from 'lucide-react';
import { FileTransferCard } from '../components/FileTransferCard';
import { FileUploader } from '../components/FileUploader';
import { AuthGuard, UserMenu } from 'sa2kit/common/auth/components';
import { useAuthContext } from 'sa2kit/common/auth/react';
import type { FileTransfer } from '../../../domain/types';
import { fileTransferApiPath } from '../../../domain/fileTransferApiPath';

/**
 * FileTransfer 内容组件
 * 需要在AuthProvider包装器内使用
 */
function FileTransferContent() {
  const { isAuthenticated, user } = useAuthContext();
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载传输列表
  useEffect(() => {
    if (isAuthenticated) {
      loadTransfers();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(fileTransferApiPath('transfers'));
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('请先登录');
        }
        throw new Error('获取传输列表失败');
      }
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : payload.data;
      setTransfers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(fileTransferApiPath('transfers'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('请先登录');
        }
        throw new Error('上传失败');
      }
      
      const payload = await response.json();
      const newTransfer = payload.data ?? payload;
      setTransfers(prev => [newTransfer, ...prev]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '上传失败');
    }
  };

  // 处理文件下载
  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(fileTransferApiPath(`download/${id}`));
      if (!response.ok) throw new Error('下载失败');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = transfers.find(t => t.id === id)?.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载失败');
    }
  };

  // 处理文件删除
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(fileTransferApiPath(`transfers/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');
      
      setTransfers(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  // 未登录状态渲染 - Apple Design
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* 顶部导航栏 - 毛玻璃效果 */}
        <header className="backdrop-blur-xl bg-white/70 border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-4 py-3 rounded-full hover:bg-white/50 transition-all duration-200 backdrop-blur-sm"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline font-medium">返回</span>
              </button>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  文件中转站
                </h1>
              </div>
              
              <UserMenu />
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-5xl mx-auto px-6 py-20">
          {/* 主视觉区域 */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-8 shadow-2xl shadow-blue-500/25">
              <CloudUpload className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 leading-tight">
              安全便捷的<br />文件传输
            </h2>
            <p className="text-xl text-slate-600 mb-16 max-w-2xl mx-auto leading-relaxed">
              专业的文件中转站服务，为您提供快速、安全的文件传输体验。<br />
              让文件分享变得简单而优雅。
            </p>
          </div>

          {/* 功能特色 - 卡片式设计 */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl shadow-slate-200/50 hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/25">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">端到端加密</h3>
              <p className="text-slate-600 leading-relaxed">采用军用级加密技术，确保您的文件在传输过程中始终受到最高级别的安全保护。</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl shadow-slate-200/50 hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl mb-6 shadow-lg shadow-violet-500/25">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">智能识别</h3>
              <p className="text-slate-600 leading-relaxed">自动识别文件类型并进行智能分类，支持预览和批量处理，让文件管理更加便捷。</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl shadow-slate-200/50 hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-6 shadow-lg shadow-amber-500/25">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">极速传输</h3>
              <p className="text-slate-600 leading-relaxed">基于先进的传输协议，实现毫秒级响应和高速上传下载，让等待成为过去。</p>
            </div>
          </div>

          {/* 登录卡片 - 优雅的行动引导 */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/50 p-12 text-center border border-white/30">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-8 shadow-xl shadow-blue-500/30">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">开始您的文件之旅</h3>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              登录您的账户，解锁完整的文件传输功能，体验前所未有的便捷。
            </p>
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-full shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300">
              <Lock size={20} />
              <span>点击右上角登录按钮开始</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 已登录状态渲染 - Apple Design
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 顶部导航栏 - 毛玻璃效果 */}
      <header className="backdrop-blur-xl bg-white/70 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-4 py-3 rounded-full hover:bg-white/50 transition-all duration-200"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline font-medium">返回</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                文件中转站
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                欢迎回来，{String(user?.name ?? user?.phone ?? '')}！
              </p>
            </div>
            
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* 上传区域 - 优雅的卡片设计 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-white/30">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">上传文件</h2>
            <p className="text-slate-600">拖拽文件到下方区域或点击选择文件</p>
          </div>
          <FileUploader
            onUpload={handleUpload}
            maxFileSize={100 * 1024 * 1024} // 100MB
            allowedFileTypes={['*']}
          />
        </div>

        {/* 错误提示 - 优雅的警告设计 */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:bg-red-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 文件列表 - 现代化设计 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/30 overflow-hidden">
          <div className="p-8 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">我的文件</h2>
                <p className="text-slate-600">管理您的所有文件传输</p>
              </div>
              {transfers.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-slate-500">共 {transfers.length} 个文件</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin animation-delay-150"></div>
                </div>
                <p className="text-slate-600 font-medium">正在加载您的文件...</p>
              </div>
            ) : transfers.length > 0 ? (
              <div className="space-y-4">
                {transfers.map(transfer => (
                  <FileTransferCard
                    key={transfer.id}
                    transfer={transfer}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                  <FileIcon size={32} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">还没有文件</h3>
                  <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                    上传您的第一个文件，开始使用我们的文件中转站服务
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * FileTransferPage 主组件（带认证包装器）
 */
export default function FileTransferPage() {
  return (
    <AuthGuard requireAuth>
      <FileTransferContent />
    </AuthGuard>
  );
} 