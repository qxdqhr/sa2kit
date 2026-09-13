/**
 * FileTransferCard 组件
 * 
 * 用于显示单个文件传输任务的卡片组件
 * 包含文件信息、传输状态和操作按钮
 */

'use client';

import React from 'react';
import { File, Download, Trash2, Clock, CheckCircle2, AlertCircle, FileText, Image, Music, Video, Archive, Code } from 'lucide-react';
import type { FileTransfer } from '../../../domain/types';

interface FileTransferCardProps {
  transfer: FileTransfer;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FileTransferCard({ transfer, onDownload, onDelete }: FileTransferCardProps) {
  // 获取文件大小的人类可读格式
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 获取文件图标和颜色
  const getFileIcon = () => {
    const type = transfer.fileType.toLowerCase();
    
    if (type.startsWith('image/')) {
      return { icon: Image, bgColor: 'from-pink-400 to-rose-500', shadowColor: 'shadow-pink-500/25' };
    } else if (type.startsWith('video/')) {
      return { icon: Video, bgColor: 'from-purple-400 to-violet-500', shadowColor: 'shadow-purple-500/25' };
    } else if (type.startsWith('audio/')) {
      return { icon: Music, bgColor: 'from-emerald-400 to-teal-500', shadowColor: 'shadow-emerald-500/25' };
    } else if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) {
      return { icon: Archive, bgColor: 'from-amber-400 to-orange-500', shadowColor: 'shadow-amber-500/25' };
    } else if (type.includes('javascript') || type.includes('json') || type.includes('css') || type.includes('html')) {
      return { icon: Code, bgColor: 'from-cyan-400 to-blue-500', shadowColor: 'shadow-cyan-500/25' };
    } else if (type.includes('text') || type.includes('pdf')) {
      return { icon: FileText, bgColor: 'from-slate-400 to-slate-500', shadowColor: 'shadow-slate-500/25' };
    } else {
      return { icon: File, bgColor: 'from-indigo-400 to-blue-500', shadowColor: 'shadow-indigo-500/25' };
    }
  };

  // 获取状态信息
  const getStatusInfo = () => {
    switch (transfer.status) {
      case 'completed':
        return { 
          icon: CheckCircle2, 
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          text: '已完成',
          dotColor: 'bg-emerald-500'
        };
      case 'failed':
        return { 
          icon: AlertCircle, 
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          text: '失败',
          dotColor: 'bg-red-500'
        };
      case 'pending':
        return { 
          icon: Clock, 
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          text: '处理中',
          dotColor: 'bg-amber-500'
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          text: '未知',
          dotColor: 'bg-slate-500'
        };
    }
  };

  const { icon: FileIcon, bgColor: fileBgColor, shadowColor } = getFileIcon();
  const { icon: StatusIcon, color: statusColor, bgColor: statusBgColor, text: statusText, dotColor } = getStatusInfo();

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 p-6 border border-white/50 hover:shadow-xl hover:shadow-slate-300/50 hover:scale-[1.02] transition-all duration-300 group">
      <div className="flex items-start gap-4">
        {/* 文件图标 */}
        <div className="flex-shrink-0">
          <div className={`w-14 h-14 bg-gradient-to-br ${fileBgColor} rounded-2xl flex items-center justify-center shadow-lg ${shadowColor} group-hover:scale-110 transition-transform duration-300`}>
            <FileIcon className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* 文件信息 */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                {transfer.fileName}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500 font-medium">{formatFileSize(transfer.fileSize)}</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <span className="text-sm text-slate-500">{new Date(transfer.createdAt).toLocaleDateString('zh-CN')}</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <span className="text-sm text-slate-500">{new Date(transfer.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            {/* 状态标签 */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${statusBgColor} rounded-full ml-4`}>
              <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
              <span className={`text-sm font-semibold ${statusColor}`}>
                {statusText}
              </span>
            </div>
          </div>

          {/* 进度条 */}
          {transfer.status === 'pending' && (
            <div className="mt-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">上传进度</span>
                <span className="text-xs text-slate-600 font-bold">{transfer.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${transfer.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 下载统计 */}
          {transfer.downloadCount > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                <Download className="w-3 h-3" />
                已下载 {transfer.downloadCount} 次
              </span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex-shrink-0 flex gap-2">
          {transfer.status === 'completed' && (
            <button
              onClick={() => onDownload(transfer.id)}
              className="group/btn w-11 h-11 bg-blue-50 hover:bg-blue-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
              title="下载文件"
            >
              <Download className="w-5 h-5 text-blue-600 group-hover/btn:text-white transition-colors duration-300" />
            </button>
          )}
          <button
            onClick={() => onDelete(transfer.id)}
            className="group/btn w-11 h-11 bg-red-50 hover:bg-red-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30"
            title="删除文件"
          >
            <Trash2 className="w-5 h-5 text-red-600 group-hover/btn:text-white transition-colors duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
} 