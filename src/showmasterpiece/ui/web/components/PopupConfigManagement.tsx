/**
 * ShowMasterpiece 模块 - 弹窗配置管理组件
 * 
 * 提供弹窗配置的创建、编辑、删除和启用/禁用功能
 * 
 * @fileoverview 弹窗配置管理组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Clock, AlertTriangle, Settings, Save, X } from 'lucide-react';
import { Modal } from '@/components';
import type { PopupConfig, NewPopupConfig } from '../../../types/popup';

/**
 * 弹窗配置管理组件属性
 */
interface PopupConfigManagementProps {
}

const isSuccessResponse = (result: any, fallback: boolean): boolean =>
  typeof result?.success === 'boolean' ? result.success : fallback;

const extractPopupConfigs = (result: any): PopupConfig[] => {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.configs)) return result.configs;
  if (Array.isArray(result?.data?.configs)) return result.data.configs;
  if (Array.isArray(result)) return result;
  return [];
};

/**
 * 弹窗配置管理组件
 */
export const PopupConfigManagement: React.FC<PopupConfigManagementProps> = () => {
  const [configs, setConfigs] = useState<PopupConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PopupConfig | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'deadline',
    enabled: false,
    triggerConfig: {
      deadlineTime: '',
      advanceMinutes: 0,
      triggerType: 'after_deadline' as 'after_deadline' | 'before_deadline' | 'always',
    },
    contentConfig: {
      title: '',
      message: '',
      confirmText: '确定',
      cancelText: '取消',
      showCancel: true,
      theme: 'warning' as 'warning' | 'info' | 'error' | 'success',
    },
    displayConfig: {
      width: 400,
      height: 'auto' as number | string,
      maskClosable: true,
      autoCloseSeconds: 0,
    },
    blockProcess: false,
    businessModule: 'showmasterpiece',
    businessScene: 'cart_checkout',
    sortOrder: '0',
  });

  /**
   * 加载弹窗配置列表
   */
  const loadConfigs = async () => {
    try {
      console.log('🔄 [PopupConfigManagement] 开始加载弹窗配置...');
      setLoading(true);
      setError(null);

      const url = '/api/showmasterpiece/popup-configs';
      
      console.log('📡 [PopupConfigManagement] 请求URL:', url);
      const response = await fetch(url);
      console.log('📡 [PopupConfigManagement] API响应状态:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📊 [PopupConfigManagement] API响应数据:', result);

      if (isSuccessResponse(result, response.ok)) {
        const nextConfigs = extractPopupConfigs(result);
        console.log('✅ [PopupConfigManagement] 配置加载成功，数量:', nextConfigs.length);
        setConfigs(nextConfigs);
      } else {
        console.error('❌ [PopupConfigManagement] API返回失败:', result.error);
        setError(result?.error || result?.message || '加载配置失败');
      }
    } catch (err) {
      console.error('❌ [PopupConfigManagement] 加载弹窗配置失败:', err);
      setError('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadConfigs();
  }, []);

  /**
   * 重置表单
   */
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'deadline',
      enabled: false,
      triggerConfig: {
        deadlineTime: '',
        advanceMinutes: 0,
        triggerType: 'after_deadline',
      },
      contentConfig: {
        title: '',
        message: '',
        confirmText: '确定',
        cancelText: '取消',
        showCancel: true,
        theme: 'warning',
      },
      displayConfig: {
        width: 400,
        height: 'auto',
        maskClosable: true,
        autoCloseSeconds: 0,
      },
      blockProcess: false,
      businessModule: 'showmasterpiece',
      businessScene: 'cart_checkout',
      sortOrder: '0',
    });
  };

  /**
   * 打开创建弹窗
   */
  const handleCreate = () => {
    resetForm();
    setEditingConfig(null);
    setShowCreateModal(true);
  };

  /**
   * 打开编辑弹窗
   */
  const handleEdit = (config: PopupConfig) => {
    setFormData({
      name: config.name,
      description: config.description || '',
      type: config.type,
      enabled: config.enabled ?? false,
      triggerConfig: {
        deadlineTime: config.triggerConfig.deadlineTime || '',
        advanceMinutes: config.triggerConfig.advanceMinutes || 0,
        triggerType: config.triggerConfig.triggerType,
      },
      contentConfig: {
        title: config.contentConfig.title,
        message: config.contentConfig.message,
        confirmText: config.contentConfig.confirmText || '确定',
        cancelText: config.contentConfig.cancelText || '取消',
        showCancel: config.contentConfig.showCancel ?? true,
        theme: config.contentConfig.theme || 'warning',
      },
      displayConfig: {
        width: config.displayConfig?.width || 400,
        height: config.displayConfig?.height || 'auto',
        maskClosable: config.displayConfig?.maskClosable ?? true,
        autoCloseSeconds: config.displayConfig?.autoCloseSeconds || 0,
      },
      blockProcess: config.blockProcess ?? false,
      businessModule: config.businessModule,
      businessScene: config.businessScene,
      sortOrder: config.sortOrder || '0',
    });
    setEditingConfig(config);
    setShowCreateModal(true);
  };

  /**
   * 保存配置
   */
  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.contentConfig.title.trim() || !formData.contentConfig.message.trim()) {
        alert('请填写必要信息：名称、弹窗标题和内容');
        return;
      }

      const url = editingConfig 
        ? `/api/showmasterpiece/popup-configs/${editingConfig.id}`
        : '/api/showmasterpiece/popup-configs';
      
      const method = editingConfig ? 'PUT' : 'POST';

      const requestData = {
        ...formData,
      };
      
      console.log('💾 [PopupConfigManagement] 保存弹窗配置:', { requestData });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (isSuccessResponse(result, response.ok)) {
        await loadConfigs();
        setShowCreateModal(false);
        resetForm();
        setEditingConfig(null);
      } else {
        alert(result?.error || result?.message || '保存失败');
      }
    } catch (err) {
      console.error('保存配置失败:', err);
      alert('保存失败');
    }
  };

  /**
   * 删除配置
   */
  const handleDelete = async (config: PopupConfig) => {
    if (!confirm(`确定要删除配置"${config.name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/showmasterpiece/popup-configs/${config.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (isSuccessResponse(result, response.ok)) {
        await loadConfigs();
      } else {
        alert(result?.error || result?.message || '删除失败');
      }
    } catch (err) {
      console.error('删除配置失败:', err);
      alert('删除失败');
    }
  };

  /**
   * 切换启用状态
   */
  const handleToggle = async (config: PopupConfig) => {
    try {
      const requestBody = {
        enabled: !config.enabled,
      };

      console.log('🔄 [PopupConfigManagement] 切换弹窗配置状态:', {
        configId: config.id,
        configName: config.name,
        currentEnabled: config.enabled,
        newEnabled: !config.enabled,
        requestBody
      });

      const response = await fetch(`/api/showmasterpiece/popup-configs/${config.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (isSuccessResponse(result, response.ok)) {
        await loadConfigs();
      } else {
        alert(result?.error || result?.message || '操作失败');
      }
    } catch (err) {
      console.error('切换状态失败:', err);
      alert('操作失败');
    }
  };

  /**
   * 格式化时间显示
   */
  const formatDeadlineTime = (triggerConfig: any) => {
    if (!triggerConfig.deadlineTime) return '无';
    return new Date(triggerConfig.deadlineTime).toLocaleString('zh-CN');
  };

  /**
   * 获取触发类型显示文本
   */
  const getTriggerTypeText = (triggerType: string) => {
    switch (triggerType) {
      case 'after_deadline':
        return '超过截止时间';
      case 'before_deadline':
        return '截止时间前';
      case 'always':
        return '总是显示';
      default:
        return triggerType;
    }
  };

  /**
   * 获取主题显示文本
   */
  const getThemeText = (theme: string) => {
    switch (theme) {
      case 'warning':
        return '警告';
      case 'info':
        return '信息';
      case 'error':
        return '错误';
      case 'success':
        return '成功';
      default:
        return theme;
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">弹窗配置管理</h2>
          <p className="text-sm text-slate-600 mt-1">管理购物车提交时的限时提醒弹窗</p>
          {/* 调试信息 */}
          <div className="mt-2 text-xs text-slate-500">
            状态: {loading ? '加载中' : '已加载'} | 配置数量: {configs.length} | 
            {error ? `错误: ${error}` : '正常'}
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          创建配置
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 配置列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {configs.length === 0 ? (
            <div className="text-center py-8">
              <Settings size={40} className="text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">暂无配置</h3>
              <p className="text-slate-600 mb-4">点击"创建配置"开始设置弹窗</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      配置信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      触发条件
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      弹窗内容
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      流程控制
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {configs.map((config) => (
                    <tr key={config.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {config.name}
                          </div>
                          {config.description && (
                            <div className="text-sm text-slate-500">
                              {config.description}
                            </div>
                          )}
                          <div className="text-xs text-slate-400 mt-1">
                            {config.businessModule} / {config.businessScene}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {getTriggerTypeText(config.triggerConfig.triggerType)}
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDeadlineTime(config.triggerConfig)}
                        </div>
                        {(config.triggerConfig.advanceMinutes || 0) > 0 && (
                          <div className="text-xs text-slate-400">
                            提前 {config.triggerConfig.advanceMinutes} 分钟
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {config.contentConfig.title}
                          </div>
                          <div className="text-sm text-slate-500 max-w-xs truncate">
                            {config.contentConfig.message}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            主题: {getThemeText(config.contentConfig.theme || 'warning')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          config.blockProcess
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {config.blockProcess ? (
                            <>
                              <AlertTriangle size={12} />
                              阻断提交
                            </>
                          ) : (
                            <>
                              <Clock size={12} />
                              仅提醒
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggle(config)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            config.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {config.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                          {config.enabled ? '启用' : '禁用'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(config)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
            setEditingConfig(null);
          }}
          title={editingConfig ? '编辑弹窗配置' : '创建弹窗配置'}
          width={600}
          maskClosable={false}
          overlayClassName="bg-black/45 backdrop-blur-[1px]"
        >
          <div
            className="space-y-6 max-h-[76vh] overflow-y-auto overscroll-contain pr-1"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">基本信息</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  配置名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入配置名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  配置描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入配置描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  业务场景 *
                </label>
                <select
                  value={formData.businessScene}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessScene: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cart_checkout">购物车提交</option>
                  <option value="homepage_visit">主页访问</option>
                  <option value="collection_view">画集浏览</option>
                  <option value="artwork_detail">作品详情</option>
                </select>
                <div className="text-xs text-slate-500 mt-1">
                  选择弹窗在哪个场景下触发显示
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-slate-700">
                  启用此配置
                </label>
              </div>
            </div>

            {/* 触发条件 */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">触发条件</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  触发类型
                </label>
                <select
                  value={formData.triggerConfig.triggerType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    triggerConfig: {
                      ...prev.triggerConfig,
                      triggerType: e.target.value as any,
                    }
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="after_deadline">超过截止时间后显示</option>
                  <option value="before_deadline">截止时间前显示</option>
                  <option value="always">总是显示</option>
                </select>
              </div>

              {formData.triggerConfig.triggerType !== 'always' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    截止时间
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.triggerConfig.deadlineTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      triggerConfig: {
                        ...prev.triggerConfig,
                        deadlineTime: e.target.value,
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formData.triggerConfig.triggerType === 'before_deadline' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    提前分钟数
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.triggerConfig.advanceMinutes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      triggerConfig: {
                        ...prev.triggerConfig,
                        advanceMinutes: parseInt(e.target.value) || 0,
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="在截止时间前多少分钟显示"
                  />
                </div>
              )}
            </div>

            {/* 弹窗内容 */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">弹窗内容</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  弹窗标题 *
                </label>
                <input
                  type="text"
                  value={formData.contentConfig.title}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentConfig: {
                      ...prev.contentConfig,
                      title: e.target.value,
                    }
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入弹窗标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  弹窗内容 *
                </label>
                <textarea
                  value={formData.contentConfig.message}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentConfig: {
                      ...prev.contentConfig,
                      message: e.target.value,
                    }
                  }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入弹窗内容"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    确认按钮文本
                  </label>
                  <input
                    type="text"
                    value={formData.contentConfig.confirmText}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contentConfig: {
                        ...prev.contentConfig,
                        confirmText: e.target.value,
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    取消按钮文本
                  </label>
                  <input
                    type="text"
                    value={formData.contentConfig.cancelText}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contentConfig: {
                        ...prev.contentConfig,
                        cancelText: e.target.value,
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  弹窗主题
                </label>
                <select
                  value={formData.contentConfig.theme}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentConfig: {
                      ...prev.contentConfig,
                      theme: e.target.value as any,
                    }
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="warning">警告</option>
                  <option value="info">信息</option>
                  <option value="error">错误</option>
                  <option value="success">成功</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showCancel"
                  checked={formData.contentConfig.showCancel}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentConfig: {
                      ...prev.contentConfig,
                      showCancel: e.target.checked,
                    }
                  }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showCancel" className="text-sm font-medium text-slate-700">
                  显示取消按钮
                </label>
              </div>
            </div>

            {/* 显示设置 */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">显示设置</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    弹窗宽度 (px)
                  </label>
                  <input
                    type="number"
                    min="200"
                    max="800"
                    value={formData.displayConfig.width}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      displayConfig: {
                        ...prev.displayConfig,
                        width: parseInt(e.target.value) || 400,
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    自动关闭 (秒，0=不关闭)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.displayConfig.autoCloseSeconds}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      displayConfig: {
                        ...prev.displayConfig,
                        autoCloseSeconds: parseInt(e.target.value) || 0,
                      }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="maskClosable"
                  checked={formData.displayConfig.maskClosable}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    displayConfig: {
                      ...prev.displayConfig,
                      maskClosable: e.target.checked,
                    }
                  }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="maskClosable" className="text-sm font-medium text-slate-700">
                  允许点击遮罩关闭
                </label>
              </div>
            </div>
          </div>

          {/* 流程控制设置 */}
          <div>
            <h4 className="text-sm font-medium text-slate-800 mb-3">流程控制</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="blockProcess"
                  checked={formData.blockProcess}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    blockProcess: e.target.checked,
                  }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="blockProcess" className="text-sm font-medium text-slate-700">
                  阻断流程
                </label>
              </div>
              <div className="text-xs text-slate-500 pl-6">
                • 启用时：弹窗显示后阻止用户继续提交，只有关闭弹窗才能停止操作<br/>
                • 禁用时：弹窗仅作为提醒，用户可以选择继续提交或取消
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setEditingConfig(null);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              {editingConfig ? '更新' : '创建'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PopupConfigManagement;
