'use client';

import React, { useState, useEffect } from 'react';
import { EventFormData, EventColor, EventPriority, RecurrenceType } from '../types';

interface EventFormProps {
  /** 初始事件数据（编辑模式） */
  initialData?: Partial<EventFormData>;
  /** 是否为编辑模式 */
  isEdit?: boolean;
  /** 表单提交回调 */
  onSubmit: (data: EventFormData) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 是否正在加载 */
  loading?: boolean;
}

/**
 * 事件表单组件
 * 
 * 用于创建和编辑日历事件的表单组件
 * 支持基本信息、重复规则、提醒设置等功能
 */
export default function EventForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
  loading = false
}: EventFormProps) {
  // 表单状态
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 默认1小时后
    allDay: false,
    location: '',
    color: EventColor.BLUE,
    priority: EventPriority.NORMAL,
    recurrence: undefined,
    reminders: []
  });

  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        startTime: initialData.startTime || prev.startTime,
        endTime: initialData.endTime || prev.endTime
      }));
    }
  }, [initialData]);

  // 处理输入变化
  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '事件标题不能为空';
    }

    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // 格式化日期时间为本地输入格式
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 解析本地日期时间
  const parseDateTimeLocal = (value: string): Date => {
    return new Date(value);
  };

  // 颜色选项
  const colorOptions = [
    { value: EventColor.BLUE, label: '蓝色', class: 'bg-blue-500' },
    { value: EventColor.GREEN, label: '绿色', class: 'bg-green-500' },
    { value: EventColor.RED, label: '红色', class: 'bg-red-500' },
    { value: EventColor.PURPLE, label: '紫色', class: 'bg-purple-500' },
    { value: EventColor.YELLOW, label: '黄色', class: 'bg-yellow-500' },
    { value: EventColor.PINK, label: '粉色', class: 'bg-pink-500' },
    { value: EventColor.INDIGO, label: '靛蓝', class: 'bg-indigo-500' },
    { value: EventColor.GRAY, label: '灰色', class: 'bg-gray-500' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? '编辑事件' : '创建事件'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
          
          {/* 标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              事件标题 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="请输入事件标题"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              事件描述
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入事件描述（可选）"
            />
          </div>

          {/* 地点 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              地点
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入事件地点（可选）"
            />
          </div>
        </div>

        {/* 时间设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">时间设置</h3>
          
          {/* 全天事件 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => handleInputChange('allDay', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
              全天事件
            </label>
          </div>

          {/* 开始时间 */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              开始时间 *
            </label>
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              id="startTime"
              value={formData.allDay 
                ? formData.startTime.toISOString().split('T')[0]
                : formatDateTimeLocal(formData.startTime)
              }
              onChange={(e) => {
                const newDate = formData.allDay 
                  ? new Date(e.target.value + 'T00:00:00')
                  : parseDateTimeLocal(e.target.value);
                handleInputChange('startTime', newDate);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 结束时间 */}
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              结束时间 *
            </label>
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              id="endTime"
              value={formData.allDay 
                ? formData.endTime.toISOString().split('T')[0]
                : formatDateTimeLocal(formData.endTime)
              }
              onChange={(e) => {
                const newDate = formData.allDay 
                  ? new Date(e.target.value + 'T23:59:59')
                  : parseDateTimeLocal(e.target.value);
                handleInputChange('endTime', newDate);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.endTime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* 颜色选择 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">外观</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事件颜色
            </label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('color', option.value)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg border-2 transition-all
                    ${formData.color === option.value 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`w-4 h-4 rounded-full ${option.class} mr-2`} />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '保存中...' : (isEdit ? '更新事件' : '创建事件')}
          </button>
        </div>
      </form>
    </div>
  );
} 