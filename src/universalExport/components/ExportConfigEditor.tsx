/**
 * 导出配置编辑器组件
 * 
 * 提供可视化的导出字段配置编辑功能
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff, 
  MoveUp, 
  MoveDown, 
  Save, 
  X,
  FileText,
  Calendar,
  Hash,
  CheckSquare,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Group,
  GitMerge,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  Database
} from 'lucide-react';

import type { 
  ExportConfig, 
  ExportField, 
  FieldType, 
  FieldAlignment,
  ExportFormat,
  GroupingConfig,
  GroupingField,
  GroupingMode,
  GroupValueProcessing
} from '../types';

// ============= 类型定义 =============

export interface ExportConfigEditorProps {
  /** 初始配置 */
  initialConfig?: ExportConfig;
  /** 模块标识 */
  moduleId: string;
  /** 业务标识 */
  businessId?: string;
  /** 可用的字段定义 */
  availableFields: ExportField[];
  /** 保存配置回调 */
  onSave?: (config: ExportConfig) => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否显示 */
  visible?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 配置变化回调(新增/删除/更新) */
  onConfigChange?: () => void;
}

// ============= 字段类型图标映射 =============

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
  string: <Type className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  date: <Calendar className="w-4 h-4" />,
  boolean: <CheckSquare className="w-4 h-4" />,
  array: <FileText className="w-4 h-4" />,
  object: <FileText className="w-4 h-4" />,
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  string: '文本',
  number: '数字',
  date: '日期',
  boolean: '布尔',
  array: '数组',
  object: '对象',
};

const ALIGNMENT_ICONS: Record<FieldAlignment, React.ReactNode> = {
  left: <AlignLeft className="w-4 h-4" />,
  center: <AlignCenter className="w-4 h-4" />,
  right: <AlignRight className="w-4 h-4" />,
};

const ALIGNMENT_LABELS: Record<FieldAlignment, string> = {
  left: '左对齐',
  center: '居中对齐',
  right: '右对齐',
};

// ============= 分组相关标签 =============

const GROUPING_MODE_LABELS: Record<GroupingMode, string> = {
  merge: '合并模式',
  separate: '分离模式',
  nested: '嵌套模式',
};

const GROUPING_MODE_DESCRIPTIONS: Record<GroupingMode, string> = {
  merge: '同组数据合并显示，Excel支持单元格合并',
  separate: '每个分组独立显示，可添加分组头',
  nested: '支持多级嵌套分组',
};

const VALUE_PROCESSING_LABELS: Record<GroupValueProcessing, string> = {
  first: '取第一个值',
  last: '取最后一个值',
  concat: '连接所有值',
  sum: '求和',
  count: '计数',
  custom: '自定义处理',
};

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText className="w-4 h-4" />,
  excel: <FileSpreadsheet className="w-4 h-4" />,
  json: <Database className="w-4 h-4" />,
};

const FORMAT_DESCRIPTIONS: Record<ExportFormat, string> = {
  csv: '逗号分隔值文件，兼容性最好',
  excel: 'Excel表格文件，支持格式化和单元格合并',
  json: 'JSON数据文件，适合开发者使用',
};

// ============= 主组件 =============

export const ExportConfigEditor: React.FC<ExportConfigEditorProps> = ({
  initialConfig,
  moduleId,
  businessId,
  availableFields,
  onSave,
  onCancel,
  visible = false,
  className = '',
  onConfigChange,
}) => {
  // ============= 状态管理 =============
  
  const [config, setConfig] = useState<ExportConfig>(() => {
    if (initialConfig) {
      return { ...initialConfig };
    }
    
    // 创建默认配置
    return {
      id: '',
      name: '新建导出配置',
      description: '',
      format: 'csv',
      fields: availableFields.map((field, index) => ({
        ...field,
        enabled: true,
        sortOrder: index,
      })),
      grouping: {
        enabled: false,
        fields: [],
        preserveOrder: true,
        nullValueHandling: 'separate',
        nullGroupName: '未分组'
      },
      fileNameTemplate: '导出数据_{date}',
      includeHeader: true,
      delimiter: ',',
      encoding: 'utf-8',
      addBOM: true,
      maxRows: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      moduleId,
      businessId,
    };
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'grouping' | 'manage'>('basic');
  
  // 配置管理相关状态
  const [savedConfigs, setSavedConfigs] = useState<ExportConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null);

  // 加载已保存的配置
  const loadSavedConfigs = useCallback(async () => {
    if (!visible || activeTab !== 'manage') return;
    
    setLoadingConfigs(true);
    try {
      const params = new URLSearchParams({ moduleId });
      if (businessId) {
        params.set('businessId', businessId);
      }
      
      const response = await fetch('/api/universal-export/configs?' + (params.toString()));
      if (response.ok) {
        const data = await response.json();
        setSavedConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('加载配置异常:', error);
    } finally {
      setLoadingConfigs(false);
    }
  }, [visible, activeTab, moduleId, businessId]);

  // 删除配置
  const deleteConfig = useCallback(async (configId: string) => {
    setDeletingConfigId(configId);
    try {
      const response = await fetch('/api/universal-export/configs/' + (configId), {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedConfigs(prev => prev.filter(cfg => cfg.id !== configId));
        onConfigChange?.();
      }
    } catch (error) {
      console.error('删除配置失败:', error);
    } finally {
      setDeletingConfigId(null);
    }
  }, [onConfigChange]);

  // 加载配置到编辑器
  const loadConfigToEditor = useCallback((config: ExportConfig) => {
    setConfig(config);
    setActiveTab('basic');
  }, []);

  // 当切换到管理tab时加载配置
  useEffect(() => {
    if (activeTab === 'manage') {
      loadSavedConfigs();
    }
  }, [activeTab, loadSavedConfigs]);

  // 阻止背景滚动
  useEffect(() => {
    if (!visible) return;
    
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + (scrollY) + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onCancel]);

  // ============= 字段管理 =============

  const toggleFieldEnabled = useCallback((fieldKey: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.key === fieldKey
          ? { ...field, enabled: !field.enabled }
          : field
      ),
    }));
  }, []);

  const updateField = useCallback((fieldKey: string, updates: Partial<ExportField>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.key === fieldKey
          ? { ...field, ...updates }
          : field
      ),
    }));
  }, []);

  const moveField = useCallback((fieldKey: string, direction: 'up' | 'down') => {
    setConfig(prev => {
      const fields = [...prev.fields];
      const index = fields.findIndex(f => f.key === fieldKey);
      
      if (direction === 'up' && index > 0) {
        const temp = fields[index - 1]!;
        fields[index - 1] = fields[index]!;
        fields[index] = temp;
      } else if (direction === 'down' && index < fields.length - 1) {
        const temp = fields[index + 1]!;
        fields[index + 1] = fields[index]!;
        fields[index] = temp;
      }
      
      return {
        ...prev,
        fields: fields.map((field, idx) => ({ ...field, sortOrder: idx })),
      };
    });
  }, []);

  const removeField = useCallback((fieldKey: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.key !== fieldKey),
    }));
  }, []);

  // ============= 分组配置管理 =============

  const toggleGrouping = useCallback((enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      grouping: {
        ...prev.grouping!,
        enabled,
      },
    }));
  }, []);

  const addGroupingField = useCallback((fieldKey: string) => {
    const field = config.fields.find(f => f.key === fieldKey);
    if (!field) return;

    const groupField: GroupingField = {
      key: field.key,
      label: field.label,
      mode: 'merge',
      valueProcessing: 'first',
      showGroupHeader: false,
      mergeCells: true,
    };

    setConfig(prev => ({
      ...prev,
      grouping: {
        ...prev.grouping!,
        fields: [...prev.grouping!.fields, groupField],
      },
    }));
  }, [config.fields]);

  const removeGroupingField = useCallback((fieldKey: string) => {
    setConfig(prev => ({
      ...prev,
      grouping: {
        ...prev.grouping!,
        fields: prev.grouping!.fields.filter(f => f.key !== fieldKey),
      },
    }));
  }, []);

  const updateGroupingField = useCallback((fieldKey: string, updates: Partial<GroupingField>) => {
    setConfig(prev => ({
      ...prev,
      grouping: {
        ...prev.grouping!,
        fields: prev.grouping!.fields.map(field =>
          field.key === fieldKey
            ? { ...field, ...updates }
            : field
        ),
      },
    }));
  }, []);

  const moveGroupingField = useCallback((fieldKey: string, direction: 'up' | 'down') => {
    setConfig(prev => {
      const fields = [...prev.grouping!.fields];
      const index = fields.findIndex(f => f.key === fieldKey);
      
      if (direction === 'up' && index > 0) {
        const temp = fields[index - 1]!;
        fields[index - 1] = fields[index]!;
        fields[index] = temp;
      } else if (direction === 'down' && index < fields.length - 1) {
        const temp = fields[index + 1]!;
        fields[index + 1] = fields[index]!;
        fields[index] = temp;
      }
      
      return {
        ...prev,
        grouping: {
          ...prev.grouping!,
          fields,
        },
      };
    });
  }, []);

  const updateGroupingConfig = useCallback((updates: Partial<GroupingConfig>) => {
    setConfig(prev => ({
      ...prev,
      grouping: {
        ...prev.grouping!,
        ...updates,
      },
    }));
  }, []);

  // ============= 保存配置 =============

  const handleSave = useCallback(() => {
    if (!config.name.trim()) {
      alert('请输入配置名称');
      return;
    }

    const enabledFields = config.fields.filter(f => f.enabled);
    if (enabledFields.length === 0) {
      alert('至少需要启用一个字段');
      return;
    }

    const updatedConfig: ExportConfig = {
      ...config,
      updatedAt: new Date(),
    };

    onSave?.(updatedConfig);
    onConfigChange?.();
  }, [config, onSave, onConfigChange]);

  // ============= 渲染组件 =============

  if (!visible) {
    return null;
  }

  const tabs = [
    { id: 'basic' as const, label: '基本配置', icon: <Settings className="w-4 h-4" />, description: '配置名称、格式和基本选项' },
    { id: 'fields' as const, label: '字段设置', icon: <Type className="w-4 h-4" />, description: '选择和配置导出字段' },
    { id: 'grouping' as const, label: '分组设置', icon: <Group className="w-4 h-4" />, description: '配置数据分组和合并选项' },
    { id: 'manage' as const, label: '配置管理', icon: <Database className="w-4 h-4" />, description: '管理已保存的导出配置' },
  ];

  return (
    <div 
      className={clsx('fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50] p-4', className)}
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">导出配置编辑器</h2>
              <p className="text-sm text-gray-600">配置导出字段和格式选项</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab导航 */}
        <div className="border-b bg-gray-50 flex-shrink-0">
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx('flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors', activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900')}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab内容 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="bg-blue-50 border-b border-blue-100 p-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
              {tabs.find(t => t.id === activeTab)?.icon}
              {tabs.find(t => t.id === activeTab)?.description}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === 'basic' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">配置名称 *</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <label className="block text-sm font-medium text-gray-700">描述</label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                  <label className="block text-sm font-medium text-gray-700">导出格式</label>
                  <div className="space-y-3">
                    {(['csv', 'excel', 'json'] as ExportFormat[]).map((format) => (
                      <label key={format} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:border-blue-300">
                        <input
                          type="radio"
                          checked={config.format === format}
                          onChange={() => setConfig(prev => ({ ...prev, format }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            {FORMAT_ICONS[format]} {format.toUpperCase()}
                          </div>
                          <p className="text-sm text-gray-600">{FORMAT_DESCRIPTIONS[format]}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="space-y-4">
                {config.fields.map((field, index) => (
                  <div key={field.key} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                    <button onClick={() => toggleFieldEnabled(field.key)} className={field.enabled ? 'text-blue-600' : 'text-gray-400'}>
                      {field.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium">{field.label}</div>
                      <div className="text-xs text-gray-500">{field.key}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveField(field.key, 'up')} disabled={index === 0} className="disabled:opacity-30"><MoveUp className="w-4 h-4" /></button>
                      <button onClick={() => moveField(field.key, 'down')} disabled={index === config.fields.length - 1} className="disabled:opacity-30"><MoveDown className="w-4 h-4" /></button>
                      <button onClick={() => removeField(field.key)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'grouping' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2"><Group className="w-5 h-5 text-blue-600" /> 分组配置</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={config.grouping?.enabled} onChange={(e) => toggleGrouping(e.target.checked)} />
                    启用分组
                  </label>
                </div>
                {config.grouping?.enabled && (
                  <div className="space-y-4">
                    {config.grouping.fields.map((gf, index) => (
                      <div key={gf.key} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium text-blue-900">{gf.label}</span>
                          <button onClick={() => removeGroupingField(gf.key)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <select value={gf.mode} onChange={(e) => updateGroupingField(gf.key, { mode: e.target.value as GroupingMode })} className="border rounded p-2">
                            <option value="merge">合并模式</option>
                            <option value="separate">分离模式</option>
                            <option value="nested">嵌套模式</option>
                          </select>
                          <select value={gf.valueProcessing} onChange={(e) => updateGroupingField(gf.key, { valueProcessing: e.target.value as GroupValueProcessing })} className="border rounded p-2">
                            <option value="first">首值</option>
                            <option value="sum">求和</option>
                            <option value="count">计数</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    <select onChange={(e) => e.target.value && addGroupingField(e.target.value)} className="w-full border rounded p-2">
                      <option value="">添加分组字段...</option>
                      {config.fields.filter(f => f.enabled && !config.grouping?.fields.some(gf => gf.key === f.key)).map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="space-y-4">
                {loadingConfigs ? <div className="text-center py-10">加载中...</div> : savedConfigs.map(sc => (
                  <div key={sc.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{sc.name}</div>
                      <div className="text-sm text-gray-500">{sc.format}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadConfigToEditor(sc)} className="text-blue-600 px-3 py-1 border rounded">编辑</button>
                      <button onClick={() => deleteConfig(sc.id)} className="text-red-600 px-3 py-1 border rounded">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 border rounded">取消</button>
          {activeTab !== 'manage' && (
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
              <Save className="w-4 h-4" /> 保存配置
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

