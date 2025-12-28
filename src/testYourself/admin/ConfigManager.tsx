/**
 * 测测你是什么 - 配置管理后台组件
 * Test Yourself - Configuration Manager Component
 * 
 * 支持创建、编辑、管理多套测试配置
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Upload as UploadIcon,
  Download,
  Copy,
  Star,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import type { SavedConfig, TestConfig, TestResult } from '../types';
import { ConfigService } from '../server/ConfigService';
import { DEFAULT_RESULTS } from '../data/defaultResults';

export interface ConfigManagerProps {
  /** 配置服务实例 */
  configService: ConfigService;
  /** 配置变化回调 */
  onConfigChange?: (configs: SavedConfig[]) => void;
  /** 自定义样式 */
  className?: string;
  /** 图片上传处理函数 */
  onImageUpload?: (file: File) => Promise<string>;
}

interface EditingResult extends TestResult {
  _tempId?: string;
}

/**
 * 配置管理器组件
 */
export const ConfigManager: React.FC<ConfigManagerProps> = ({
  configService,
  onConfigChange,
  className = '',
  onImageUpload,
}) => {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SavedConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    gameTitle: '',
    gameDescription: '',
    buttonText: '长按开始测试',
    longPressDuration: 2000,
    results: [] as EditingResult[],
  });

  // 加载配置列表
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const allConfigs = await configService.getAllConfigs();
      setConfigs(allConfigs);
      onConfigChange?.(allConfigs);
    } catch (err: any) {
      setError(`加载配置失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [configService, onConfigChange]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // 开始创建新配置
  const handleStartCreate = () => {
    setEditForm({
      name: '新配置',
      description: '',
      gameTitle: '测测你是什么',
      gameDescription: '长按按钮，发现你的专属属性',
      buttonText: '长按开始测试',
      longPressDuration: 2000,
      results: [],
    });
    setIsCreating(true);
    setIsEditing(true);
    setSelectedConfig(null);
  };

  // 开始编辑配置
  const handleStartEdit = (config: SavedConfig) => {
    setEditForm({
      name: config.name,
      description: config.description || '',
      gameTitle: config.config.gameTitle,
      gameDescription: config.config.gameDescription || '',
      buttonText: config.config.buttonText || '长按开始测试',
      longPressDuration: config.config.longPressDuration || 2000,
      results: config.config.results,
    });
    setIsCreating(false);
    setIsEditing(true);
    setSelectedConfig(config);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedConfig(null);
    setError(null);
  };

  // 保存配置
  const handleSave = async () => {
    try {
      setError(null);

      // 验证
      if (!editForm.name.trim()) {
        setError('请输入配置名称');
        return;
      }
      if (!editForm.gameTitle.trim()) {
        setError('请输入游戏标题');
        return;
      }
      if (editForm.results.length === 0) {
        setError('请至少添加一个结果项');
        return;
      }

      const testConfig: TestConfig = {
        gameTitle: editForm.gameTitle,
        gameDescription: editForm.gameDescription,
        buttonText: editForm.buttonText,
        longPressDuration: editForm.longPressDuration,
        results: editForm.results,
      };

      if (isCreating) {
        await configService.createConfig(
          editForm.name,
          testConfig,
          editForm.description
        );
        setSuccess('创建配置成功！');
      } else if (selectedConfig) {
        await configService.updateConfig(selectedConfig.id, {
          name: editForm.name,
          description: editForm.description,
          config: testConfig,
        });
        setSuccess('更新配置成功！');
      }

      await loadConfigs();
      handleCancelEdit();

      // 3秒后清除成功提示
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`保存失败: ${err.message}`);
    }
  };

  // 删除配置
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return;

    try {
      await configService.deleteConfig(id);
      await loadConfigs();
      setSuccess('删除成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`删除失败: ${err.message}`);
    }
  };

  // 复制配置
  const handleDuplicate = async (id: string) => {
    try {
      await configService.duplicateConfig(id);
      await loadConfigs();
      setSuccess('复制成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`复制失败: ${err.message}`);
    }
  };

  // 设置默认配置
  const handleSetDefault = async (id: string) => {
    try {
      await configService.setDefaultConfig(id);
      await loadConfigs();
      setSuccess('设置默认配置成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`设置失败: ${err.message}`);
    }
  };

  // 导出配置
  const handleExport = async (id: string) => {
    try {
      const jsonString = await configService.exportConfig(id);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config_${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('导出成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`导出失败: ${err.message}`);
    }
  };

  // 导入配置
  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await configService.importConfig(text);
        await loadConfigs();
        setSuccess('导入成功！');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(`导入失败: ${err.message}`);
      }
    };
    input.click();
  };

  // 添加结果项
  const handleAddResult = () => {
    const newResult: EditingResult = {
      id: `temp_${Date.now()}`,
      _tempId: `temp_${Date.now()}`,
      title: '新结果',
      description: '这是一个新的结果描述',
      image: '🎉',
      imageType: 'emoji',
    };
    setEditForm({
      ...editForm,
      results: [...editForm.results, newResult],
    });
  };

  // 删除结果项
  const handleDeleteResult = (index: number) => {
    const newResults = [...editForm.results];
    newResults.splice(index, 1);
    setEditForm({ ...editForm, results: newResults });
  };

  // 更新结果项
  const handleUpdateResult = (index: number, updates: Partial<TestResult>) => {
    const newResults = [...editForm.results];
    newResults[index] = { ...newResults[index], ...updates } as EditingResult;
    setEditForm({ ...editForm, results: newResults });
  };

  // 图片上传处理
  const handleResultImageUpload = async (index: number, file: File) => {
    try {
      if (!onImageUpload) {
        // 如果没有提供上传函数，使用 Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          handleUpdateResult(index, {
            image: base64,
            imageType: 'url',
          });
        };
        reader.readAsDataURL(file);
      } else {
        // 使用提供的上传函数
        const url = await onImageUpload(file);
        handleUpdateResult(index, {
          image: url,
          imageType: 'url',
        });
      }
    } catch (err: any) {
      setError(`上传图片失败: ${err.message}`);
    }
  };

  // 使用默认结果
  const handleUseDefaultResults = () => {
    if (confirm('确定要使用默认的45个结果吗？这将替换当前的所有结果。')) {
      setEditForm({ ...editForm, results: DEFAULT_RESULTS });
    }
  };

  // 渲染配置列表
  const renderConfigList = () => (
    <div className="space-y-4">
      {configs.map((config) => (
        <div
          key={config.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {config.name}
                </h3>
                {config.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Star className="w-3 h-3" />
                    默认
                  </span>
                )}
              </div>
              {config.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {config.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>结果数: {config.config.results.length}</span>
                <span>创建: {new Date(config.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetDefault(config.id)}
                disabled={config.isDefault}
                className="p-2 text-gray-600 hover:text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="设为默认"
              >
                <Star className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleStartEdit(config)}
                className="p-2 text-gray-600 hover:text-blue-600"
                title="编辑"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDuplicate(config.id)}
                className="p-2 text-gray-600 hover:text-green-600"
                title="复制"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleExport(config.id)}
                className="p-2 text-gray-600 hover:text-purple-600"
                title="导出"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(config.id)}
                className="p-2 text-gray-600 hover:text-red-600"
                title="删除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 渲染结果编辑器
  const renderResultEditor = (result: EditingResult, index: number) => (
    <div
      key={result._tempId || result.id}
      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          结果 #{index + 1}
        </h4>
        <button
          onClick={() => handleDeleteResult(index)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标题
          </label>
          <input
            type="text"
            value={result.title}
            onChange={(e) => handleUpdateResult(index, { title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="例如: 可爱的猫咪"
          />
        </div>

        {/* 图片/Emoji */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            图片/Emoji
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result.image}
              onChange={(e) => handleUpdateResult(index, { image: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="🎉 或 URL"
            />
            <label className="cursor-pointer inline-flex items-center justify-center px-3 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800">
              <ImageIcon className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResultImageUpload(index, file);
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        <textarea
          value={result.description}
          onChange={(e) => handleUpdateResult(index, { description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="这个结果的详细描述..."
        />
      </div>

      {/* 预览 */}
      {result.image && (
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
          <span className="text-sm text-gray-500 dark:text-gray-400">预览:</span>
          {result.imageType === 'emoji' ? (
            <span className="text-2xl">{result.image}</span>
          ) : (
            <img src={result.image} alt={result.title} className="w-8 h-8 object-cover rounded" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {result.title}
          </span>
        </div>
      )}
    </div>
  );

  // 渲染编辑表单
  const renderEditForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isCreating ? '创建新配置' : '编辑配置'}
        </h2>
        <button
          onClick={handleCancelEdit}
          className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          基本信息
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              配置名称 *
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="例如: 动物主题测试"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              游戏标题 *
            </label>
            <input
              type="text"
              value={editForm.gameTitle}
              onChange={(e) => setEditForm({ ...editForm, gameTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="例如: 测测你是什么动物"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            配置描述
          </label>
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="简要描述这个配置的用途..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            游戏描述
          </label>
          <input
            type="text"
            value={editForm.gameDescription}
            onChange={(e) => setEditForm({ ...editForm, gameDescription: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="例如: 长按按钮，发现你的专属属性"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              按钮文本
            </label>
            <input
              type="text"
              value={editForm.buttonText}
              onChange={(e) => setEditForm({ ...editForm, buttonText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              长按时间 (毫秒)
            </label>
            <input
              type="number"
              value={editForm.longPressDuration}
              onChange={(e) =>
                setEditForm({ ...editForm, longPressDuration: parseInt(e.target.value) || 2000 })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="500"
              step="100"
            />
          </div>
        </div>
      </div>

      {/* 结果列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            结果列表 ({editForm.results.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleUseDefaultResults}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-200 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800"
            >
              使用默认结果
            </button>
            <button
              onClick={handleAddResult}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
              添加结果
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {editForm.results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>还没有添加任何结果</p>
              <p className="text-sm mt-2">点击"添加结果"或"使用默认结果"开始</p>
            </div>
          ) : (
            editForm.results.map((result, index) => renderResultEditor(result, index))
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleCancelEdit}
          className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="w-5 h-5" />
          保存配置
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* 消息提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {isEditing ? (
        renderEditForm()
      ) : (
        <>
          {/* 头部操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">配置管理</h1>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <UploadIcon className="w-5 h-5" />
                导入
              </button>
              <button
                onClick={handleStartCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                创建配置
              </button>
            </div>
          </div>

          {/* 配置列表 */}
          {configs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">还没有任何配置</p>
              <button
                onClick={handleStartCreate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                创建第一个配置
              </button>
            </div>
          ) : (
            renderConfigList()
          )}
        </>
      )}
    </div>
  );
};

export default ConfigManager;





