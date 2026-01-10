/**
 * MMD 后台管理面板 - 主入口组件
 * 
 * 功能：
 * - 播放列表管理（列表、创建、编辑、删除）
 * - 预设项管理
 * - 资源选项管理
 * - 统计信息展示
 * 
 * @package sa2kit/mmd/admin
 */

'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  List,
  Plus,
  Settings,
  Database,
  BarChart3,
} from 'lucide-react';

import { MmdPlaylistEditor } from './MmdPlaylistEditor';
import type { MmdAdminPanelProps } from '../types';

type TabType = 'playlists' | 'presets' | 'resources' | 'stats';

/**
 * MMD后台管理面板
 */
export const MmdAdminPanel: React.FC<MmdAdminPanelProps> = ({
  fileService,
  userId,
  apiBaseUrl = '/api/mmd',
  showAdvancedOptions = true,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('playlists');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | undefined>();

  // 标签页配置
  const tabs = [
    { id: 'playlists' as const, label: '播放列表', icon: List },
    { id: 'presets' as const, label: '预设项', icon: Database },
    { id: 'resources' as const, label: '资源管理', icon: Settings },
    ...(showAdvancedOptions ? [{ id: 'stats' as const, label: '统计', icon: BarChart3 }] : []),
  ];

  // 创建新播放列表
  const handleCreatePlaylist = () => {
    setEditingPlaylistId(undefined);
    setShowEditor(true);
  };

  // 编辑播放列表
  const handleEditPlaylist = (playlistId: string) => {
    setEditingPlaylistId(playlistId);
    setShowEditor(true);
  };

  // 关闭编辑器
  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingPlaylistId(undefined);
  };

  // 保存成功
  const handleSaveSuccess = (playlist: any) => {
    console.log('保存成功:', playlist);
    handleCloseEditor();
    // 刷新列表...
  };

  if (showEditor) {
    return (
      <MmdPlaylistEditor
        playlistId={editingPlaylistId}
        fileService={fileService}
        userId={userId}
        onSave={handleSaveSuccess}
        onCancel={handleCloseEditor}
      />
    );
  }

  return (
    <div className={clsx('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              MMD 后台管理
            </h1>
            
            {activeTab === 'playlists' && (
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建播放列表
              </button>
            )}
          </div>

          {/* 标签导航 */}
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx('flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors', activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300')}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'playlists' && (
          <div className="space-y-4">
            <div className="text-center py-12 text-gray-500">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>播放列表管理功能开发中...</p>
              <p className="text-sm mt-2">点击右上角"创建播放列表"按钮开始</p>
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="text-center py-12 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>预设项管理功能开发中...</p>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="text-center py-12 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>资源管理功能开发中...</p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>统计功能开发中...</p>
          </div>
        )}
      </div>
    </div>
  );
};

