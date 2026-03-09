/**
 * ShowMasterpiece模块 - 系统配置管理组件
 * 
 * 从全局configManager复制并适配，专门为showmasterpiece模块使用
 * 用于模块独立化准备
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Save, Edit, Eye, EyeOff, CheckCircle, AlertTriangle, Loader, RefreshCw, Database, Server, Trash2, Plus } from 'lucide-react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { AddConfigItemDialog } from './AddConfigItemDialog';
import { clearConfigCache } from '../../../service/client-business/fileService';

interface ConfigItem {
  id: string;
  key: string;
  displayName: string;
  description: string;
  value: string;
  defaultValue: string;
  type: 'string' | 'number' | 'boolean' | 'password';
  isRequired: boolean;
  isSensitive: boolean;
  validation: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type Environment = 'development' | 'production';

const isSuccessResponse = (result: any, fallback: boolean): boolean =>
  typeof result?.success === 'boolean' ? result.success : fallback;

const extractConfigItems = (result: any): ConfigItem[] => {
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data?.items)) return result.data.items;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
};

export const SystemConfigManager: React.FC = () => {
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [showSensitive, setShowSensitive] = useState<{ [key: string]: boolean }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('development');
  
  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    item: ConfigItem | null;
  }>({
    isOpen: false,
    item: null
  });

  // 新增配置项对话框状态
  const [addDialog, setAddDialog] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false
  });

  // 加载配置项 - 使用showmasterpiece专用API
  const loadConfigItems = async (environment?: Environment) => {
    const env = environment || currentEnvironment;
    setLoading(true);
    try {
      const response = await fetch(`/api/showmasterpiece/config/items?environment=${env}`);
      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data?.error || data?.message || '加载配置项失败'
        });
        return;
      }

      const items = extractConfigItems(data);
      if (Array.isArray(items)) {
        setConfigItems(items);
      } else {
        console.error('API响应格式错误:', data);
        setMessage({
          type: 'error',
          text: '加载配置项失败：响应格式错误'
        });
      }
    } catch (error) {
      console.error('加载配置项失败:', error);
      setMessage({
        type: 'error',
        text: '加载配置项时发生网络错误'
      });
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑
  const startEdit = (item: ConfigItem) => {
    setEditingItem(item.id);
    setEditValues({
      ...editValues,
      [item.id]: item.value
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  // 保存编辑
  const saveEdit = async (item: ConfigItem) => {
    const newValue = editValues[item.id];
    if (newValue === undefined) return;

    // 类型验证
    if (item.type === 'number' && isNaN(Number(newValue))) {
      setMessage({
        type: 'error',
        text: '请输入有效的数字'
      });
      return;
    }

    if (item.type === 'boolean' && !['true', 'false'].includes(newValue.toLowerCase())) {
      setMessage({
        type: 'error',
        text: '布尔值只能是 true 或 false'
      });
      return;
    }

    setSaving(item.id);
    try {
      const response = await fetch(`/api/showmasterpiece/config/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: newValue,
          environment: currentEnvironment,
        }),
      });

      const result = await response.json();

      if (isSuccessResponse(result, response.ok)) {
        setMessage({
          type: 'success',
          text: '配置项更新成功'
        });
        
        // 更新本地状态
        setConfigItems(prev => prev.map(config => 
          config.id === item.id 
            ? { ...config, value: newValue }
            : config
        ));
        
        // 如果是OSS相关配置，清除文件服务缓存
        if (item.key.includes('ALIYUN_OSS')) {
          console.log('🧹 [SystemConfigManager] OSS配置已更新，清除文件服务缓存');
          clearConfigCache();
        }
        
        setEditingItem(null);
        setEditValues({});
      } else {
        setMessage({
          type: 'error',
          text: result.error || '更新失败'
        });
      }
    } catch (error) {
      console.error('保存配置项失败:', error);
      setMessage({
        type: 'error',
        text: '保存时发生网络错误'
      });
    } finally {
      setSaving(null);
    }
  };

  // 删除配置项
  const handleDeleteItem = async (item: ConfigItem) => {
    setDeleteDialog({ isOpen: true, item });
  };

  // 确认删除
  const confirmDelete = async () => {
    const item = deleteDialog.item;
    if (!item) return;

    setDeleting(item.id);
    try {
      const response = await fetch(`/api/showmasterpiece/config/items/${item.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (isSuccessResponse(result, response.ok)) {
        setMessage({
          type: 'success',
          text: '配置项删除成功'
        });
        
        // 从本地状态中移除
        setConfigItems(prev => prev.filter(config => config.id !== item.id));
      } else {
        setMessage({
          type: 'error',
          text: result.error || '删除失败'
        });
      }
    } catch (error) {
      console.error('删除配置项失败:', error);
      setMessage({
        type: 'error',
        text: '删除时发生网络错误'
      });
    } finally {
      setDeleting(null);
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  // 切换环境
  const handleEnvironmentChange = (env: Environment) => {
    setCurrentEnvironment(env);
    loadConfigItems(env);
  };

  // 切换敏感信息显示
  const toggleSensitive = (itemId: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 过滤配置项
  const filteredItems = configItems.filter(item =>
    item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 获取状态图标
  const getStatusIcon = (item: ConfigItem) => {
    if (item.isRequired && !item.value) {
      return <AlertTriangle className="text-red-500" size={16} />;
    }
    if (item.value) {
      return <CheckCircle className="text-green-500" size={16} />;
    }
    return <AlertTriangle className="text-yellow-500" size={16} />;
  };

  // 获取类型显示
  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'string': return '文本';
      case 'number': return '数字';
      case 'boolean': return '布尔';
      case 'password': return '密码';
      default: return type;
    }
  };

  // 渲染值
  const renderValue = (item: ConfigItem) => {
    if (item.isSensitive && !showSensitive[item.id]) {
      return '••••••••';
    }
    
    if (!item.value) {
      return <span className="text-gray-400 italic">未设置</span>;
    }
    
    return item.value;
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadConfigItems();
  }, []);

  // 清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message]);

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 控制面板 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* 左侧控制 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* 环境切换 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">环境:</label>
              <select
                value={currentEnvironment}
                onChange={(e) => handleEnvironmentChange(e.target.value as Environment)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="development">开发环境</option>
                <option value="production">生产环境</option>
              </select>
            </div>

            {/* 搜索框 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="搜索配置项..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddDialog({ isOpen: true })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              新增配置
            </button>
            <button
              onClick={() => loadConfigItems()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 配置项统计 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Database className="text-blue-500" size={20} />
            <div>
              <p className="text-sm text-gray-600">总配置项</p>
              <p className="text-lg font-semibold text-gray-900">{configItems.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={20} />
            <div>
              <p className="text-sm text-gray-600">已配置</p>
              <p className="text-lg font-semibold text-gray-900">
                {configItems.filter(item => item.value).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={20} />
            <div>
              <p className="text-sm text-gray-600">待配置</p>
              <p className="text-lg font-semibold text-gray-900">
                {configItems.filter(item => item.isRequired && !item.value).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 配置项列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <Loader className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
            <p className="text-gray-600">加载配置项中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配置项</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前值</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(item)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.displayName}
                          {item.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                        <div className="text-xs text-gray-400 mt-1">Key: {item.key}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getTypeDisplay(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingItem === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type={item.type === 'password' ? 'password' : 'text'}
                            value={editValues[item.id] || ''}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={item.defaultValue}
                          />
                          <button
                            onClick={() => saveEdit(item)}
                            disabled={saving === item.id}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                          >
                            {saving === item.id ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">
                            {renderValue(item)}
                          </span>
                          {item.isSensitive && (
                            <button
                              onClick={() => toggleSensitive(item.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showSensitive[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {editingItem === item.id ? null : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              disabled={deleting === item.id}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              {deleting === item.id ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredItems.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-600">
                  {searchTerm ? '未找到匹配的配置项' : '暂无配置项'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        item={deleteDialog.item}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
      />

      {/* 新增配置项对话框 */}
      <AddConfigItemDialog
        isOpen={addDialog.isOpen}
        onSave={async (data) => {
          try {
            const response = await fetch('/api/showmasterpiece/config/items', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            });

            const result = await response.json();

            if (isSuccessResponse(result, response.ok)) {
              setMessage({
                type: 'success',
                text: '配置项创建成功'
              });
              await loadConfigItems();
            } else {
              setMessage({
                type: 'error',
                text: result.error || '创建失败'
              });
            }
          } catch (error) {
            console.error('创建配置项失败:', error);
            setMessage({
              type: 'error',
              text: '创建时发生网络错误'
            });
          }
          setAddDialog({ isOpen: false });
        }}
        onCancel={() => setAddDialog({ isOpen: false })}
      />
    </div>
  );
};
