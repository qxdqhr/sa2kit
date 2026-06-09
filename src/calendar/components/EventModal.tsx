'use client';

import React, { useState, useEffect } from 'react';
import { useCalendarUi } from '../ui/context';
import { CalendarEvent, CreateEventRequest, UpdateEventRequest, EventPriority } from '../types';
import { toLocalISOString } from '../utils/dateUtils';
import { clsx } from 'clsx';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  onDelete?: (eventId: number) => Promise<void>; // 删除事件回调
  event?: CalendarEvent | null; // 如果传入event，则为编辑模式
  initialDate?: Date; // 创建事件时的初始日期
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
}) => {
  const { Modal, ConfirmModal } = useCalendarUi();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    color: '#3b82f6',
    priority: EventPriority.NORMAL,
    isAllDay: false,
    categoryId: null as string | null,
    // 重复事件相关
    isRecurring: false,
    recurrenceType: undefined as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined,
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceCount: 0,
    // 提醒相关
    hasReminder: false,
    reminderTime: 15, // 提前15分钟提醒
    reminderType: 'notification' as 'notification' | 'email',
    reminderMinutes: undefined as number | undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditMode = !!event;

  // 初始化表单数据
  useEffect(() => {
    if (event) {
      // 编辑模式：使用现有事件数据
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      setFormData({
        title: event.title,
        description: event.description || '',
        startTime: formatDateTimeLocal(startDate),
        endTime: formatDateTimeLocal(endDate),
        location: event.location || '',
        color: event.color || '#3b82f6',
        priority: event.priority || EventPriority.NORMAL,
        isAllDay: event.allDay,
        categoryId: null, // CalendarEvent doesn't have categoryId
        // 重复事件相关
        isRecurring: false,
        recurrenceType: undefined as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined,
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        recurrenceCount: 0,
        // 提醒相关
        hasReminder: false,
        reminderTime: 15,
        reminderType: 'notification' as 'notification' | 'email',
        reminderMinutes: undefined as number | undefined,
      });
    } else if (initialDate) {
      // 创建模式：使用初始日期
      const startDateTime = new Date(initialDate);
      startDateTime.setHours(9, 0, 0, 0); // 默认上午9点
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(10, 0, 0, 0); // 默认1小时后
      
      setFormData(prev => ({
        ...prev,
        startTime: formatDateTimeLocal(startDateTime),
        endTime: formatDateTimeLocal(endDateTime),
      }));
    }
  }, [event, initialDate]);

  // 格式化日期时间为datetime-local输入格式
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return (year) + '-' + (month) + '-' + (day) + 'T' + (hours) + ':' + (minutes);
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '事件标题不能为空';
    }

    if (!formData.startTime) {
      newErrors.startTime = '开始时间不能为空';
    }

    if (!formData.endTime) {
      newErrors.endTime = '结束时间不能为空';
    }

    if (formData.startTime && formData.endTime) {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      
      if (endDate <= startDate) {
        newErrors.endTime = '结束时间必须晚于开始时间';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startTime: toLocalISOString(new Date(formData.startTime)),
        endTime: toLocalISOString(new Date(formData.endTime)),
        location: formData.location.trim() || undefined,
        color: formData.color,
        priority: formData.priority,
        allDay: formData.isAllDay,
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('保存事件失败:', error);
      setErrors({ submit: '保存事件失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean | number | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理事件删除
  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('删除事件失败:', error);
      setErrors({ submit: '删除事件失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      color: '#3b82f6',
      priority: EventPriority.NORMAL,
      isAllDay: false,
      categoryId: null,
      // 重复事件相关
      isRecurring: false,
      recurrenceType: undefined as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined,
      recurrenceInterval: 1,
      recurrenceEndDate: '',
      recurrenceCount: 0,
      // 提醒相关
      hasReminder: false,
      reminderTime: 15,
      reminderType: 'notification' as 'notification' | 'email',
      reminderMinutes: undefined as number | undefined,
    });
    setErrors({});
    setShowDeleteConfirm(false);
  };

  // 处理弹窗关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? '编辑事件' : '创建事件'}
      width={600}
      maskClosable={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 事件标题 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            事件标题 *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={clsx('w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none', errors.title ? 'border-red-500' : 'border-gray-300')}
            placeholder="输入事件标题"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* 全天事件开关 */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAllDay"
            checked={formData.isAllDay}
            onChange={(e) => handleInputChange('isAllDay', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-700">
            全天事件
          </label>
        </div>

        {/* 时间选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              开始时间 *
            </label>
            <input
              type={formData.isAllDay ? 'date' : 'datetime-local'}
              id="startTime"
              value={formData.isAllDay ? formData.startTime.split('T')[0] : formData.startTime}
              onChange={(e) => {
                const value = formData.isAllDay 
                  ? (e.target.value) + 'T00:00' 
                  : e.target.value;
                handleInputChange('startTime', value);
              }}
              className={clsx('w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none', errors.startTime ? 'border-red-500' : 'border-gray-300')}
            />
            {errors.startTime && (
              <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              结束时间 *
            </label>
            <input
              type={formData.isAllDay ? 'date' : 'datetime-local'}
              id="endTime"
              value={formData.isAllDay ? formData.endTime.split('T')[0] : formData.endTime}
              onChange={(e) => {
                const value = formData.isAllDay 
                  ? (e.target.value) + 'T23:59' 
                  : e.target.value;
                handleInputChange('endTime', value);
              }}
              className={clsx('w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none', errors.endTime ? 'border-red-500' : 'border-gray-300')}
            />
            {errors.endTime && (
              <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* 位置 */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            位置
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="输入事件位置"
          />
        </div>

        {/* 描述 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            描述
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="输入事件描述"
          />
        </div>

        {/* 优先级选择 */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            优先级
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value as EventPriority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value={EventPriority.LOW}>低</option>
            <option value={EventPriority.NORMAL}>普通</option>
            <option value={EventPriority.HIGH}>高</option>
            <option value={EventPriority.URGENT}>紧急</option>
          </select>
        </div>

        {/* 颜色选择 */}
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            颜色标签
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              id="color"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600">{formData.color}</span>
          </div>
        </div>

        {/* 重复设置 */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">🔄 重复设置</h4>
          
          {/* 重复类型 */}
          <div>
            <label htmlFor="recurrenceType" className="block text-sm font-medium text-gray-700 mb-1">
              重复频率
            </label>
            <select
              id="recurrenceType"
              value={formData.recurrenceType || 'none'}
              onChange={(e) => {
                const value = e.target.value === 'none' ? undefined : e.target.value;
                handleInputChange('recurrenceType', value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="none">不重复</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="yearly">每年</option>
            </select>
          </div>

          {/* 重复间隔 - 只有选择了重复类型才显示 */}
          {formData.recurrenceType && (
            <div className="mt-3">
              <label htmlFor="recurrenceInterval" className="block text-sm font-medium text-gray-700 mb-1">
                重复间隔
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">每</span>
                <input
                  type="number"
                  id="recurrenceInterval"
                  min="1"
                  max="365"
                  value={formData.recurrenceInterval || 1}
                  onChange={(e) => handleInputChange('recurrenceInterval', parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                />
                <span className="text-sm text-gray-600">
                  {formData.recurrenceType === 'daily' && '天'}
                  {formData.recurrenceType === 'weekly' && '周'}
                  {formData.recurrenceType === 'monthly' && '月'}
                  {formData.recurrenceType === 'yearly' && '年'}
                </span>
              </div>
            </div>
          )}

          {/* 重复结束设置 - 只有选择了重复类型才显示 */}
          {formData.recurrenceType && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重复结束
              </label>
              
              <div className="space-y-2">
                {/* 永不结束 */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrenceEnd"
                    checked={!formData.recurrenceEndDate && !formData.recurrenceCount}
                    onChange={() => {
                      handleInputChange('recurrenceEndDate', '');
                      handleInputChange('recurrenceCount', 0);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">永不结束</span>
                </label>

                {/* 指定结束日期 */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrenceEnd"
                    checked={!!formData.recurrenceEndDate}
                    onChange={() => {
                      const endDate = new Date();
                      endDate.setMonth(endDate.getMonth() + 1);
                      handleInputChange('recurrenceEndDate', endDate.toISOString().split('T')[0]);
                      handleInputChange('recurrenceCount', 0);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">结束于:</span>
                  <input
                    type="date"
                    value={formData.recurrenceEndDate || ''}
                    onChange={(e) => {
                      handleInputChange('recurrenceEndDate', e.target.value);
                      handleInputChange('recurrenceCount', 0);
                    }}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={!formData.recurrenceEndDate}
                  />
                </label>

                {/* 指定重复次数 */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrenceEnd"
                    checked={!!formData.recurrenceCount && formData.recurrenceCount > 0}
                    onChange={() => {
                      handleInputChange('recurrenceCount', 10);
                      handleInputChange('recurrenceEndDate', '');
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">重复</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={formData.recurrenceCount || ''}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      handleInputChange('recurrenceCount', count);
                      if (count > 0) {
                        handleInputChange('recurrenceEndDate', '');
                      }
                    }}
                    className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={!formData.recurrenceCount || formData.recurrenceCount === 0}
                  />
                  <span className="ml-2 text-sm text-gray-700">次</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 提醒设置 */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">🔔 提醒设置</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提醒时间
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderMinutes === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('reminderMinutes', 0);
                    } else {
                      handleInputChange('reminderMinutes', undefined);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">事件开始时</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderMinutes === 15}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('reminderMinutes', 15);
                    } else {
                      handleInputChange('reminderMinutes', undefined);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">提前15分钟</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderMinutes === 30}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('reminderMinutes', 30);
                    } else {
                      handleInputChange('reminderMinutes', undefined);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">提前30分钟</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderMinutes === 60}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('reminderMinutes', 60);
                    } else {
                      handleInputChange('reminderMinutes', undefined);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">提前1小时</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderMinutes === 1440}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('reminderMinutes', 1440);
                    } else {
                      handleInputChange('reminderMinutes', undefined);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">提前1天</span>
              </label>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          {/* 左侧删除按钮（仅编辑模式显示） */}
          <div>
            {isEditMode && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                disabled={isLoading}
              >
                删除事件
              </button>
            )}
          </div>

          {/* 右侧主要操作按钮 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '保存中...' : (isEditMode ? '更新事件' : '创建事件')}
            </button>
          </div>
        </div>

      </form>
      
      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message={'确定要删除事件"' + (formData.title) + '"吗？此操作无法撤销。'}
        confirmText="删除"
        cancelText="取消"
        isLoading={isLoading}
      />
    </Modal>
  );
};

export default EventModal; 