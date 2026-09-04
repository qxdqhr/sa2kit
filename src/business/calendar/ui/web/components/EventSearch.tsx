'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, EventPriority } from '../types';

interface EventSearchProps {
  events: CalendarEvent[];
  onFiltered: (filteredEvents: CalendarEvent[]) => void;
  className?: string;
}

interface SearchFilters {
  keyword: string;
  priority: EventPriority | 'all';
  dateRange: {
    start: string;
    end: string;
  };
  colorFilter: string[];
  isAllDay: 'all' | 'yes' | 'no';
}

const EventSearch: React.FC<EventSearchProps> = ({
  events,
  onFiltered,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    priority: 'all',
    dateRange: {
      start: '',
      end: '',
    },
    colorFilter: [],
    isAllDay: 'all',
  });

  // 获取所有可用的颜色
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    events.forEach(event => {
      if (event.color) colors.add(event.color);
    });
    return Array.from(colors);
  }, [events]);

  // 过滤事件
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 关键词搜索
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchTitle = event.title.toLowerCase().includes(keyword);
        const matchDescription = event.description?.toLowerCase().includes(keyword) || false;
        const matchLocation = event.location?.toLowerCase().includes(keyword) || false;
        
        if (!matchTitle && !matchDescription && !matchLocation) {
          return false;
        }
      }

      // 优先级过滤
      if (filters.priority !== 'all' && event.priority !== filters.priority) {
        return false;
      }

      // 日期范围过滤
      if (filters.dateRange.start || filters.dateRange.end) {
        const eventDate = new Date(event.startTime).toISOString().split('T')[0];
        
        if (filters.dateRange.start && eventDate < filters.dateRange.start) {
          return false;
        }
        
        if (filters.dateRange.end && eventDate > filters.dateRange.end) {
          return false;
        }
      }

      // 颜色过滤
      if (filters.colorFilter.length > 0 && !filters.colorFilter.includes(event.color || '#3b82f6')) {
        return false;
      }

      // 全天事件过滤
      if (filters.isAllDay !== 'all') {
        const isEventAllDay = event.allDay;
        if (filters.isAllDay === 'yes' && !isEventAllDay) return false;
        if (filters.isAllDay === 'no' && isEventAllDay) return false;
      }

      return true;
    });
  }, [events, filters]);

  // 更新过滤结果
  React.useEffect(() => {
    onFiltered(filteredEvents);
  }, [filteredEvents, onFiltered]);

  // 处理过滤器变化
  const handleFilterChange = useCallback((
    key: keyof SearchFilters,
    value: string | string[] | { start: string; end: string }
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 重置过滤器
  const resetFilters = useCallback(() => {
    setFilters({
      keyword: '',
      priority: 'all',
      dateRange: { start: '', end: '' },
      colorFilter: [],
      isAllDay: 'all',
    });
  }, []);

  // 检查是否有活跃的过滤器
  const hasActiveFilters = useMemo(() => {
    return filters.keyword !== '' ||
           filters.priority !== 'all' ||
           filters.dateRange.start !== '' ||
           filters.dateRange.end !== '' ||
           filters.colorFilter.length > 0 ||
           filters.isAllDay !== 'all';
  }, [filters]);

  // 获取优先级显示文本
  const getPriorityText = (priority: EventPriority) => {
    const priorityMap = {
      [EventPriority.LOW]: '低',
      [EventPriority.NORMAL]: '普通',
      [EventPriority.HIGH]: '高',
      [EventPriority.URGENT]: '紧急',
    };
    return priorityMap[priority];
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 搜索头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* 关键词搜索 */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索事件标题、描述或位置..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 展开/收起按钮 */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasActiveFilters 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>过滤器</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {Object.values(filters).filter(v => 
                    v !== '' && v !== 'all' && 
                    (Array.isArray(v) ? v.length > 0 : true) &&
                    (typeof v === 'object' && !Array.isArray(v) ? v.start !== '' || v.end !== '' : true)
                  ).length}
                </span>
              )}
            </div>
          </button>

          {/* 重置按钮 */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
            >
              重置
            </button>
          )}
        </div>

        {/* 搜索结果统计 */}
        <div className="mt-3 text-sm text-gray-600">
          共找到 <span className="font-medium text-gray-900">{filteredEvents.length}</span> 个事件
          {filteredEvents.length !== events.length && (
            <span className="text-gray-500">（共 {events.length} 个）</span>
          )}
        </div>
      </div>

      {/* 高级过滤器 */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 优先级过滤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value as EventPriority | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">全部优先级</option>
                <option value={EventPriority.LOW}>{getPriorityText(EventPriority.LOW)}</option>
                <option value={EventPriority.NORMAL}>{getPriorityText(EventPriority.NORMAL)}</option>
                <option value={EventPriority.HIGH}>{getPriorityText(EventPriority.HIGH)}</option>
                <option value={EventPriority.URGENT}>{getPriorityText(EventPriority.URGENT)}</option>
              </select>
            </div>

            {/* 全天事件过滤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事件类型
              </label>
              <select
                value={filters.isAllDay}
                onChange={(e) => handleFilterChange('isAllDay', e.target.value as 'all' | 'yes' | 'no')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">全部类型</option>
                <option value="yes">全天事件</option>
                <option value="no">定时事件</option>
              </select>
            </div>

            {/* 颜色过滤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                颜色标签
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      const newColors = filters.colorFilter.includes(color)
                        ? filters.colorFilter.filter(c => c !== color)
                        : [...filters.colorFilter, color];
                      handleFilterChange('colorFilter', newColors);
                    }}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      filters.colorFilter.includes(color)
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`颜色: ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* 日期范围过滤 */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日期范围
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-gray-500">至</span>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSearch; 