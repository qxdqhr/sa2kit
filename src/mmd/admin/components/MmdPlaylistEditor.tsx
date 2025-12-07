/**
 * MMD 播放列表编辑器组件
 * 
 * 功能：
 * - 创建/编辑播放列表
 * - 添加/删除/排序播放节点
 * - 为每个节点配置资源（模型、动作、音频等）
 * - 预览配置
 * 
 * @package sa2kit/mmd/admin
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  X,
  GripVertical,
  Settings,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { MmdResourceSelector } from './MmdResourceSelector';
import type { PlaylistEditorProps, MmdPlaylistNodeDB } from '../types';

interface NodeFormData {
  id?: string;
  name: string;
  description?: string;
  loop: boolean;
  duration?: number;
  sortOrder: number;
  thumbnailFileId?: string;
  modelFileId: string;
  motionFileId?: string;
  cameraFileId?: string;
  audioFileId?: string;
  stageModelFileId?: string;
  additionalMotionFileIds?: string[];
}

/**
 * 播放列表编辑器
 */
export const MmdPlaylistEditor: React.FC<PlaylistEditorProps> = ({
  playlistId,
  fileService,
  userId,
  onSave,
  onCancel,
}) => {
  // 播放列表基本信息
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [loop, setLoop] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [preloadStrategy, setPreloadStrategy] = useState<'none' | 'next' | 'all'>('none');
  
  // 节点列表
  const [nodes, setNodes] = useState<NodeFormData[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([0]));
  
  // UI 状态
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 添加新节点
  const addNode = () => {
    const newNode: NodeFormData = {
      name: `节点 ${nodes.length + 1}`,
      description: '',
      loop: false,
      sortOrder: nodes.length,
      modelFileId: '',
    };
    
    setNodes([...nodes, newNode]);
    setExpandedNodes(new Set([...expandedNodes, nodes.length]));
  };

  // 删除节点
  const removeNode = (index: number) => {
    const newNodes = nodes.filter((_, i) => i !== index);
    // 重新排序
    newNodes.forEach((node, i) => {
      node.sortOrder = i;
    });
    setNodes(newNodes);
    
    // 更新展开状态
    const newExpanded = new Set<number>();
    expandedNodes.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedNodes(newExpanded);
  };

  // 移动节点
  const moveNode = (index: number, direction: 'up' | 'down') => {
    const newNodes = [...nodes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newNodes.length) return;
    
    // 交换位置
    [newNodes[index], newNodes[targetIndex]] = [newNodes[targetIndex], newNodes[index]];
    
    // 更新 sortOrder
    newNodes.forEach((node, i) => {
      node.sortOrder = i;
    });
    
    setNodes(newNodes);
    
    // 更新展开状态
    const newExpanded = new Set<number>();
    expandedNodes.forEach((i) => {
      if (i === index) newExpanded.add(targetIndex);
      else if (i === targetIndex) newExpanded.add(index);
      else newExpanded.add(i);
    });
    setExpandedNodes(newExpanded);
  };

  // 切换节点展开/折叠
  const toggleNode = (index: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedNodes(newExpanded);
  };

  // 更新节点
  const updateNode = (index: number, updates: Partial<NodeFormData>) => {
    const newNodes = [...nodes];
    newNodes[index] = { ...newNodes[index], ...updates };
    setNodes(newNodes);
  };

  // 验证表单
  const validateForm = (): boolean => {
    if (!playlistName.trim()) {
      alert('请输入播放列表名称');
      return false;
    }
    
    if (nodes.length === 0) {
      alert('请至少添加一个播放节点');
      return false;
    }
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.name.trim()) {
        alert(`节点 ${i + 1}: 请输入节点名称`);
        return false;
      }
      if (!node.modelFileId) {
        alert(`节点 ${i + 1}: 请选择模型文件`);
        return false;
      }
    }
    
    return true;
  };

  // 保存
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // 这里应该调用API保存数据
      // TODO: 实现API调用
      console.log('保存播放列表:', {
        name: playlistName,
        description: playlistDescription,
        loop,
        autoPlay,
        preloadStrategy,
        nodes,
      });
      
      alert('保存成功！');
      onSave?.(null as any); // 实际应该返回保存后的数据
    } catch (error) {
      console.error('保存失败:', error);
      alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {playlistId ? '编辑播放列表' : '创建播放列表'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            取消
          </button>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4 mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          基本信息
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            播放列表名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="输入播放列表名称..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            描述
          </label>
          <textarea
            value={playlistDescription}
            onChange={(e) => setPlaylistDescription(e.target.value)}
            placeholder="输入描述信息..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">列表循环</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">自动播放</span>
          </label>
        </div>

        {/* 高级选项 */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <Settings className="w-4 h-4" />
          高级选项
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                预加载策略
              </label>
              <select
                value={preloadStrategy}
                onChange={(e) => setPreloadStrategy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">不预加载</option>
                <option value="next">预加载下一个</option>
                <option value="all">预加载全部</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 播放节点列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            播放节点 ({nodes.length})
          </h3>
          <button
            onClick={addNode}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加节点
          </button>
        </div>

        {nodes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            暂无节点，请点击"添加节点"按钮开始
          </div>
        ) : (
          nodes.map((node, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* 节点头部 */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800">
                <button
                  className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="拖拽排序"
                >
                  <GripVertical className="w-5 h-5" />
                </button>

                <button
                  onClick={() => toggleNode(index)}
                  className="flex-1 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {index + 1}. {node.name || '未命名节点'}
                  </span>
                  {expandedNodes.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveNode(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                    title="上移"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => moveNode(index, 'down')}
                    disabled={index === nodes.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                    title="下移"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => removeNode(index)}
                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 节点内容 */}
              {expandedNodes.has(index) && (
                <div className="p-6 space-y-6 bg-white dark:bg-gray-900">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        节点名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={node.name}
                        onChange={(e) => updateNode(index, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        时长（秒）
                      </label>
                      <input
                        type="number"
                        value={node.duration || ''}
                        onChange={(e) => updateNode(index, { duration: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      描述
                    </label>
                    <textarea
                      value={node.description || ''}
                      onChange={(e) => updateNode(index, { description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={node.loop}
                      onChange={(e) => updateNode(index, { loop: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">单曲循环</span>
                  </label>

                  {/* 资源选择器 */}
                  <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <MmdResourceSelector
                      resourceType="model"
                      fileService={fileService}
                      userId={userId}
                      value={node.modelFileId}
                      onChange={(fileId) => updateNode(index, { modelFileId: fileId })}
                      required
                    />

                    <MmdResourceSelector
                      resourceType="motion"
                      fileService={fileService}
                      userId={userId}
                      value={node.motionFileId}
                      onChange={(fileId) => updateNode(index, { motionFileId: fileId })}
                    />

                    <MmdResourceSelector
                      resourceType="audio"
                      fileService={fileService}
                      userId={userId}
                      value={node.audioFileId}
                      onChange={(fileId) => updateNode(index, { audioFileId: fileId })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
