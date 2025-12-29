'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components';
import { EventType, RecurrencePattern, EventData, EventTypeService } from '../services/eventTypeService';
import { CalendarEvent, EventPriority } from '../types';

interface ImprovedEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: EventData) => Promise<void>;
  onDelete?: (eventId: number) => Promise<void>;
  event?: CalendarEvent | null;
  initialDate?: Date;
}

const ImprovedEventModal: React.FC<ImprovedEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
}) => {
  const [eventType, setEventType] = useState<EventType>(EventType.SINGLE);
  const [formData, setFormData] = useState({
    // 基础信息
    title: '',
    description: '',
    location: '',
    color: '#3b82f6',
    priority: EventPriority.NORMAL,
    allDay: false,
    
    // 单次事件
    startTime: '',
    endTime: '',
    
    // 多天事件
    startDate: '',
    endDate: '',
    dailyStartTime: '09:00',
    dailyEndTime: '17:00',
    
    // 重复事件
    recurrenceStartDate: '',
    recurrenceStartTime: '',
    recurrenceEndTime: '',
    recurrencePattern: RecurrencePattern.DAILY,
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceCount: 0,
    useEndDate: true, // true: 使用结束日期, false: 使用重复次数
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
      
      setEventType(EventType.SINGLE); // 默认为单次事件
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        color: event.color || '#3b82f6',
        priority: event.priority || EventPriority.NORMAL,
        allDay: event.allDay,
        startTime: formatDateTimeLocal(startDate),
        endTime: formatDateTimeLocal(endDate),
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
        dailyStartTime: formatTimeOnly(startDate),
        dailyEndTime: formatTimeOnly(endDate),
        recurrenceStartDate: formatDateOnly(startDate),
        recurrenceStartTime: formatDateTimeLocal(startDate),
        recurrenceEndTime: formatDateTimeLocal(endDate),
        recurrencePattern: RecurrencePattern.DAILY,
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        recurrenceCount: 0,
        useEndDate: true,
      });
    } else if (initialDate) {
      // 创建模式：使用初始日期
      const startDateTime = new Date(initialDate);
      startDateTime.setHours(9, 0, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(10, 0, 0, 0);
      
      setFormData(prev => ({
        ...prev,
        startTime: formatDateTimeLocal(startDateTime),
        endTime: formatDateTimeLocal(endDateTime),
        startDate: formatDateOnly(startDateTime),
        endDate: formatDateOnly(startDateTime),
        recurrenceStartDate: formatDateOnly(startDateTime),
        recurrenceStartTime: formatDateTimeLocal(startDateTime),
        recurrenceEndTime: formatDateTimeLocal(endDateTime),
      }));
    }
  }, [event, initialDate]);

  // 格式化函数
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeOnly = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 构建事件数据
  const buildEventData = (): EventData => {
    switch (eventType) {
      case EventType.SINGLE:
        return {
          type: EventType.SINGLE,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          color: formData.color,
          priority: formData.priority,
          allDay: formData.allDay,
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
        };

      case EventType.MULTI_DAY:
        return {
          type: EventType.MULTI_DAY,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          color: formData.color,
          priority: formData.priority,
          allDay: formData.allDay,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          startTime: formData.allDay ? undefined : formData.dailyStartTime,
          endTime: formData.allDay ? undefined : formData.dailyEndTime,
        };

      case EventType.RECURRING:
        return {
          type: EventType.RECURRING,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          color: formData.color,
          priority: formData.priority,
          allDay: formData.allDay,
          startDate: new Date(formData.recurrenceStartDate),
          startTime: new Date(formData.recurrenceStartTime),
          endTime: new Date(formData.recurrenceEndTime),
          recurrence: {
            pattern: formData.recurrencePattern,
            interval: formData.recurrenceInterval,
            endDate: formData.useEndDate && formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate) : undefined,
            count: !formData.useEndDate && formData.recurrenceCount > 0 ? formData.recurrenceCount : undefined,
          },
        };

      default:
        throw new Error(`不支持的事件类型: ${eventType}`);
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const eventData = buildEventData();
    const validationErrors = EventTypeService.validateEventData(eventData);
    
    const newErrors: Record<string, string> = {};
    validationErrors.forEach(error => {
      newErrors.general = error;
    });

    setErrors(newErrors);
    return validationErrors.length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const eventData = buildEventData();
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
    value: string | boolean | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除错误
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
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  // 渲染事件类型选择器
  const renderEventTypeSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-lg">🎯</span>
        <label className="text-base font-medium text-gray-900">
          选择事件类型
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setEventType(EventType.SINGLE)}
          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
            eventType === EventType.SINGLE
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-lg ring-2 ring-blue-200'
              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="text-center">
            <div className={`text-3xl mb-2 transition-transform duration-300 ${
              eventType === EventType.SINGLE ? 'scale-110' : 'group-hover:scale-110'
            }`}>
              📅
            </div>
            <div className={`font-semibold mb-1 ${
              eventType === EventType.SINGLE ? 'text-blue-700' : 'text-gray-900'
            }`}>
              单次事件
            </div>
            <div className="text-xs text-gray-500">
              一次性事件
            </div>
          </div>
          {eventType === EventType.SINGLE && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setEventType(EventType.MULTI_DAY)}
          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
            eventType === EventType.MULTI_DAY
              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-lg ring-2 ring-green-200'
              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="text-center">
            <div className={`text-3xl mb-2 transition-transform duration-300 ${
              eventType === EventType.MULTI_DAY ? 'scale-110' : 'group-hover:scale-110'
            }`}>
              🗓️
            </div>
            <div className={`font-semibold mb-1 ${
              eventType === EventType.MULTI_DAY ? 'text-green-700' : 'text-gray-900'
            }`}>
              多天事件
            </div>
            <div className="text-xs text-gray-500">
              连续多天
            </div>
          </div>
          {eventType === EventType.MULTI_DAY && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setEventType(EventType.RECURRING)}
          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
            eventType === EventType.RECURRING
              ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg ring-2 ring-purple-200'
              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="text-center">
            <div className={`text-3xl mb-2 transition-transform duration-300 ${
              eventType === EventType.RECURRING ? 'scale-110' : 'group-hover:scale-110'
            }`}>
              🔄
            </div>
            <div className={`font-semibold mb-1 ${
              eventType === EventType.RECURRING ? 'text-purple-700' : 'text-gray-900'
            }`}>
              重复事件
            </div>
            <div className="text-xs text-gray-500">
              周期性重复
            </div>
          </div>
          {eventType === EventType.RECURRING && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            </div>
          )}
        </button>
      </div>
      
      {/* 事件类型说明 */}
      <div className={`p-4 rounded-lg transition-all duration-300 ${
        eventType === EventType.SINGLE ? 'bg-blue-50 border border-blue-200' :
        eventType === EventType.MULTI_DAY ? 'bg-green-50 border border-green-200' :
        'bg-purple-50 border border-purple-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <span className="text-lg">
              {eventType === EventType.SINGLE ? '💡' :
               eventType === EventType.MULTI_DAY ? '📋' : '🔔'}
            </span>
          </div>
          <div>
            {eventType === EventType.SINGLE && (
              <>
                <h4 className="font-medium text-blue-800 mb-1">单次事件</h4>
                <p className="text-sm text-blue-700">
                  在指定的时间发生一次的事件，如会议、约会、面试等。适合一次性的活动安排。
                </p>
              </>
            )}
            {eventType === EventType.MULTI_DAY && (
              <>
                <h4 className="font-medium text-green-800 mb-1">多天事件</h4>
                <p className="text-sm text-green-700">
                  持续多天的单个事件，如培训课程、会议、假期等。例如：3天的培训课程或1周的假期。
                </p>
              </>
            )}
            {eventType === EventType.RECURRING && (
              <>
                <h4 className="font-medium text-purple-800 mb-1">重复事件</h4>
                <p className="text-sm text-purple-700">
                  按照规律重复发生的事件，如每天的晨会、每周的例会、每月的总结等。系统会自动创建多个事件实例。
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染基础信息表单
  const renderBasicForm = () => (
    <div className="space-y-6">
      {/* 事件标题 */}
      <div className="group">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
          <span className="text-lg">📝</span>
          <span>事件标题</span>
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white hover:border-gray-300"
            placeholder="为你的事件起个名字..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              formData.title.trim() ? 'bg-green-400' : 'bg-gray-300'
            }`}></div>
          </div>
        </div>
        {errors.title && (
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <p className="text-sm text-red-600">{errors.title}</p>
          </div>
        )}
      </div>

      {/* 事件描述 */}
      <div className="group">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
          <span className="text-lg">📄</span>
          <span>事件描述</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white hover:border-gray-300 resize-none"
          placeholder="描述一下这个事件的详细信息..."
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {formData.description.length > 0 && `已输入 ${formData.description.length} 个字符`}
          </div>
        </div>
      </div>

      {/* 地点 */}
      <div className="group">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
          <span className="text-lg">📍</span>
          <span>地点</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white hover:border-gray-300"
            placeholder="事件举办地点..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              formData.location.trim() ? 'bg-green-400' : 'bg-gray-300'
            }`}></div>
          </div>
        </div>
      </div>

      {/* 全天事件开关 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center space-x-3">
            <span className="text-lg">🌅</span>
            <div>
              <div className="text-sm font-medium text-gray-900">全天事件</div>
              <div className="text-xs text-gray-500">不设置具体时间，整天有效</div>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => handleInputChange('allDay', e.target.checked)}
              className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
              formData.allDay ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                formData.allDay ? 'translate-x-6' : 'translate-x-0.5'
              } translate-y-0.5`}></div>
            </div>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 颜色选择器 */}
        <div className="group">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
            <span className="text-lg">🎨</span>
            <span>事件颜色</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 shadow-sm"
                style={{ backgroundColor: formData.color }}
              >
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-8 h-8 border-none rounded-lg cursor-pointer opacity-0 absolute"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900" style={{ color: formData.color }}>
                  {formData.color.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500">点击色块选择颜色</div>
              </div>
            </div>
            
            {/* 预设颜色 */}
            <div className="flex space-x-2">
              {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  className={`w-8 h-8 rounded-lg border-2 hover:scale-105 transition-all duration-200 ${
                    formData.color === color ? 'border-gray-400 ring-2 ring-gray-200' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 优先级选择器 */}
        <div className="group">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
            <span className="text-lg">⭐</span>
            <span>优先级</span>
          </label>
          <div className="space-y-2">
            {[
              { value: EventPriority.LOW, label: '低', icon: '📘', color: 'text-blue-600 bg-blue-50 border-blue-200' },
              { value: EventPriority.NORMAL, label: '普通', icon: '📗', color: 'text-green-600 bg-green-50 border-green-200' },
              { value: EventPriority.HIGH, label: '高', icon: '📙', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
              { value: EventPriority.URGENT, label: '紧急', icon: '📕', color: 'text-red-600 bg-red-50 border-red-200' }
            ].map((priority) => (
              <label key={priority.value} className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={(e) => handleInputChange('priority', e.target.value as EventPriority)}
                  className="sr-only"
                />
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg border-2 transition-all duration-200 flex-1 ${
                  formData.priority === priority.value 
                    ? priority.color + ' ring-2 ring-opacity-20'
                    : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <span className="text-lg">{priority.icon}</span>
                  <span className="text-sm font-medium">{priority.label}</span>
                  {formData.priority === priority.value && (
                    <span className="ml-auto text-sm">✓</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染单次事件表单
  const renderSingleEventForm = () => (
    <div className="space-y-6">
      {!formData.allDay && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-medium text-blue-900 mb-3">
                <span className="text-lg">🕐</span>
                <span>开始时间</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white hover:border-blue-300"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-blue-500 text-sm">📅</span>
                </div>
              </div>
            </div>

            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-medium text-blue-900 mb-3">
                <span className="text-lg">🕕</span>
                <span>结束时间</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white hover:border-blue-300"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-blue-500 text-sm">📅</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 text-sm">💡</span>
              <div className="text-xs text-blue-700">
                <strong>提示：</strong>单次事件在指定的时间段内发生一次。请确保结束时间晚于开始时间。
              </div>
            </div>
          </div>
        </div>
      )}
      
      {formData.allDay && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌅</span>
            <div>
              <h4 className="font-medium text-amber-800">全天事件模式</h4>
              <p className="text-sm text-amber-700 mt-1">
                此事件将持续整天，无需设置具体时间。事件将在选定日期的全天显示。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染多天事件表单
  const renderMultiDayEventForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            开始日期 *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            结束日期 *
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {!formData.allDay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每日开始时间
            </label>
            <input
              type="time"
              value={formData.dailyStartTime}
              onChange={(e) => handleInputChange('dailyStartTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每日结束时间
            </label>
            <input
              type="time"
              value={formData.dailyEndTime}
              onChange={(e) => handleInputChange('dailyEndTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        <strong>示例</strong>：如果您要创建一个从21号到23号的培训课程，系统将在这三天内每天都创建一个事件实例。
      </div>
    </div>
  );

  // 渲染重复事件表单
  const renderRecurringEventForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          开始日期 *
        </label>
        <input
          type="date"
          value={formData.recurrenceStartDate}
          onChange={(e) => handleInputChange('recurrenceStartDate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {!formData.allDay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始时间 *
            </label>
            <input
              type="datetime-local"
              value={formData.recurrenceStartTime}
              onChange={(e) => handleInputChange('recurrenceStartTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束时间 *
            </label>
            <input
              type="datetime-local"
              value={formData.recurrenceEndTime}
              onChange={(e) => handleInputChange('recurrenceEndTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            重复模式 *
          </label>
          <select
            value={formData.recurrencePattern}
            onChange={(e) => handleInputChange('recurrencePattern', e.target.value as RecurrencePattern)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={RecurrencePattern.DAILY}>每天</option>
            <option value={RecurrencePattern.WEEKLY}>每周</option>
            <option value={RecurrencePattern.MONTHLY}>每月</option>
            <option value={RecurrencePattern.YEARLY}>每年</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            重复间隔
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={formData.recurrenceInterval}
            onChange={(e) => handleInputChange('recurrenceInterval', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 结束条件 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          结束条件
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={formData.useEndDate}
              onChange={() => handleInputChange('useEndDate', true)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">结束日期</span>
          </label>
          
          {formData.useEndDate && (
            <input
              type="date"
              value={formData.recurrenceEndDate}
              onChange={(e) => handleInputChange('recurrenceEndDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          <label className="flex items-center">
            <input
              type="radio"
              checked={!formData.useEndDate}
              onChange={() => handleInputChange('useEndDate', false)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">重复次数</span>
          </label>
          
          {!formData.useEndDate && (
            <input
              type="number"
              min="1"
              max="999"
              value={formData.recurrenceCount}
              onChange={(e) => handleInputChange('recurrenceCount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入重复次数"
            />
          )}
        </div>
      </div>

      <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
        <strong>示例</strong>：选择"每天重复3次"将创建3个独立的事件实例，分别在连续的3天发生。
      </div>
    </div>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} width="800px" height="auto">
        <div className="relative">
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">
                    {isEditMode ? '✏️' : '➕'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEditMode ? '编辑事件' : '创建新事件'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isEditMode ? '修改事件信息' : '填写事件详细信息'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-400 text-xl">×</span>
              </button>
            </div>
          </div>

          {/* 表单内容 */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 事件类型选择器 */}
              {!isEditMode && (
                <div className="bg-gray-50 rounded-lg p-4">
                  {renderEventTypeSelector()}
                </div>
              )}

              {/* 基础信息 */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
                </div>
                {renderBasicForm()}
              </div>

              {/* 时间设置 */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-gray-900">时间设置</h3>
                </div>
                {eventType === EventType.SINGLE && renderSingleEventForm()}
                {eventType === EventType.MULTI_DAY && renderMultiDayEventForm()}
                {eventType === EventType.RECURRING && renderRecurringEventForm()}
              </div>

              {/* 错误提示 */}
              {(errors.general || errors.submit) && (
                <div className="space-y-3">
                  {errors.general && (
                    <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-red-500 text-lg">⚠️</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-800">表单验证错误</h4>
                        <p className="text-sm text-red-600 mt-1">{errors.general}</p>
                      </div>
                    </div>
                  )}

                  {errors.submit && (
                    <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-red-500 text-lg">❌</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-800">保存失败</h4>
                        <p className="text-sm text-red-600 mt-1">{errors.submit}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* 底部操作栏 */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                {isEditMode && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="mr-2">🗑️</span>
                    删除事件
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={handleSubmit}
                  className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {isLoading && (
                    <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span className="mr-2">{isEditMode ? '💾' : '✨'}</span>
                  {isLoading ? '保存中...' : (isEditMode ? '更新事件' : '创建事件')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message="确定要删除这个事件吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        isLoading={isLoading}
      />
    </>
  );
};

export default ImprovedEventModal; 