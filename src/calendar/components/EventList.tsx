'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { SearchBox } from '../../components/SearchBox';
import { ConfirmModal } from '@/components';
import { clsx } from 'clsx';
import { 
  CalendarEvent, 
  EventListProps, 
  EventListDisplayMode, 
  EventSortField, 
  SortDirection, 
  EventPriority 
} from '../types';

/**
 * 事件列表组件
 * 支持列表/网格显示模式、排序、批量选择和批量删除
 */
export default function EventList({
  events,
  config,
  onConfigChange,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onBatchDelete,
  enableBatchActions = true,
  loading = false,
  className = ''
}: EventListProps) {
  
  // 批量选择状态
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  
  // 排序和过滤事件
  const sortedAndFilteredEvents = useMemo(() => {
    let filteredEvents = [...events];
    
    // 应用过滤条件
    if (config.filter.priority) {
      filteredEvents = filteredEvents.filter(event => event.priority === config.filter.priority);
    }
    
    if (config.filter.color) {
      filteredEvents = filteredEvents.filter(event => event.color === config.filter.color);
    }
    
    if (config.filter.searchText) {
      const searchText = config.filter.searchText.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(searchText) ||
        (event.description && event.description.toLowerCase().includes(searchText)) ||
        (event.location && event.location.toLowerCase().includes(searchText))
      );
    }
    
    if (config.filter.dateRange) {
      filteredEvents = filteredEvents.filter(event => 
        event.startTime >= config.filter.dateRange!.startDate &&
        event.startTime <= config.filter.dateRange!.endDate
      );
    }
    
    // 应用排序
    filteredEvents.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (config.sort.field) {
        case EventSortField.START_TIME:
          aValue = a.startTime.getTime();
          bValue = b.startTime.getTime();
          break;
        case EventSortField.TITLE:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case EventSortField.PRIORITY:
          const priorityOrder = { 
            [EventPriority.URGENT]: 4, 
            [EventPriority.HIGH]: 3, 
            [EventPriority.NORMAL]: 2, 
            [EventPriority.LOW]: 1 
          };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case EventSortField.CREATED_AT:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case EventSortField.UPDATED_AT:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        default:
          aValue = a.startTime.getTime();
          bValue = b.startTime.getTime();
      }
      
      if (aValue < bValue) return config.sort.direction === SortDirection.ASC ? -1 : 1;
      if (aValue > bValue) return config.sort.direction === SortDirection.ASC ? 1 : -1;
      return 0;
    });
    
    return filteredEvents;
  }, [events, config]);
  
  // 分页数据
  const paginatedEvents = useMemo(() => {
    const startIndex = (config.currentPage - 1) * config.pageSize;
    const endIndex = startIndex + config.pageSize;
    return sortedAndFilteredEvents.slice(startIndex, endIndex);
  }, [sortedAndFilteredEvents, config.currentPage, config.pageSize]);
  
  const totalPages = Math.ceil(sortedAndFilteredEvents.length / config.pageSize);
  
  // 批量选择逻辑
  const handleSelectEvent = useCallback((eventId: number, selected: boolean) => {
    setSelectedEventIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(eventId);
      } else {
        newSet.delete(eventId);
      }
      return newSet;
    });
  }, []);
  
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedEventIds(new Set(paginatedEvents.map(event => event.id)));
    } else {
      setSelectedEventIds(new Set());
    }
  }, [paginatedEvents]);
  
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEventIds(new Set());
  }, [isSelectionMode]);
  
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedEventIds(new Set());
  }, []);
  
  // 批量删除处理
  const handleBatchDelete = useCallback(async () => {
    if (!onBatchDelete || selectedEventIds.size === 0) return;
    
    setBatchDeleteLoading(true);
    try {
      await onBatchDelete(Array.from(selectedEventIds));
      setSelectedEventIds(new Set());
      setIsSelectionMode(false);
      setShowBatchDeleteConfirm(false);
    } catch (error) {
      console.error('批量删除失败:', error);
    } finally {
      setBatchDeleteLoading(false);
    }
  }, [onBatchDelete, selectedEventIds]);
  
  // 检查是否全选
  const isAllSelected = useMemo(() => {
    return paginatedEvents.length > 0 && paginatedEvents.every(event => selectedEventIds.has(event.id));
  }, [paginatedEvents, selectedEventIds]);
  
  // 检查是否部分选中
  const isPartiallySelected = useMemo(() => {
    return selectedEventIds.size > 0 && !isAllSelected;
  }, [selectedEventIds.size, isAllSelected]);
  
  // 获取优先级显示
  const getPriorityDisplay = (priority: EventPriority) => {
    switch (priority) {
      case EventPriority.URGENT:
        return { text: '紧急', color: 'bg-red-100 text-red-800 border-red-200' };
      case EventPriority.HIGH:
        return { text: '高', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case EventPriority.NORMAL:
        return { text: '普通', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case EventPriority.LOW:
        return { text: '低', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      default:
        return { text: '普通', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };
  
  // 获取事件颜色类名
  const getEventColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3B82F6': 'border-blue-500 bg-blue-50',
      '#10B981': 'border-green-500 bg-green-50',
      '#8B5CF6': 'border-purple-500 bg-purple-50',
      '#EF4444': 'border-red-500 bg-red-50',
      '#F59E0B': 'border-yellow-500 bg-yellow-50',
      '#EC4899': 'border-pink-500 bg-pink-50',
      '#6366F1': 'border-indigo-500 bg-indigo-50',
      '#6B7280': 'border-gray-500 bg-gray-50',
    };
    return colorMap[color] || 'border-gray-500 bg-gray-50';
  };
  
  // 处理排序变更
  const handleSortChange = (field: EventSortField) => {
    const newDirection = config.sort.field === field && config.sort.direction === SortDirection.ASC 
      ? SortDirection.DESC 
      : SortDirection.ASC;
    
    onConfigChange({
      ...config,
      sort: { field, direction: newDirection }
    });
  };
  
  // 处理显示模式切换
  const handleDisplayModeChange = (mode: EventListDisplayMode) => {
    onConfigChange({
      ...config,
      displayMode: mode
    });
  };
  
  // 处理页面变更
  const handlePageChange = (page: number) => {
    onConfigChange({
      ...config,
      currentPage: page
    });
  };
  
  // 处理搜索
  const handleSearchChange = (searchText: string) => {
    onConfigChange({
      ...config,
      filter: {
        ...config.filter,
        searchText
      },
      currentPage: 1 // 重置到第一页
    });
  };
  
  // 渲染排序按钮
  const renderSortButton = (field: EventSortField, label: string) => {
    const isActive = config.sort.field === field;
    const isAsc = isActive && config.sort.direction === SortDirection.ASC;
    
    return (
      <button
        onClick={() => handleSortChange(field)}
        className={clsx('flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors', isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100')}
      >
        {label}
        <svg 
          className={clsx('ml-1 w-4 h-4 transition-transform', isActive ? (isAsc ? 'rotate-180' : '') : 'opacity-50')} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  };
  
  // 渲染复选框
  const renderCheckbox = (eventId: number) => {
    const isChecked = selectedEventIds.has(eventId);
    
    return (
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => {
          e.stopPropagation();
          handleSelectEvent(eventId, e.target.checked);
        }}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
    );
  };
  
  // 渲染全选复选框
  const renderSelectAllCheckbox = () => {
    return (
      <input
        type="checkbox"
        checked={isAllSelected}
        ref={(input) => {
          if (input) input.indeterminate = isPartiallySelected;
        }}
        onChange={(e) => handleSelectAll(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
    );
  };
  
  // 渲染列表模式
  const renderListMode = () => (
    <div className="space-y-4">
      {paginatedEvents.map((event) => {
        const priorityDisplay = getPriorityDisplay(event.priority);
        const isSelected = selectedEventIds.has(event.id);
        
        return (
          <div
            key={event.id}
            className={clsx('p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all', getEventColorClass(event.color), isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : '')}
            onClick={() => !isSelectionMode && onEventClick(event)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* 选择框 */}
                {isSelectionMode && (
                  <div className="pt-1">
                    {renderCheckbox(event.id)}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <span className={clsx('px-2 py-1 text-xs font-medium rounded border', priorityDisplay.color)}>
                      {priorityDisplay.text}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {event.startTime.toLocaleDateString('zh-CN')} {
                          !event.allDay && event.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                        }
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 操作按钮 */}
              {!isSelectionMode && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventEdit(event);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑事件"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventDelete(event.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除事件"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
  
  // 渲染网格模式
  const renderGridMode = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {paginatedEvents.map((event) => {
        const priorityDisplay = getPriorityDisplay(event.priority);
        const isSelected = selectedEventIds.has(event.id);
        
        return (
          <div
            key={event.id}
            className={clsx('p-4 rounded-lg border cursor-pointer hover:shadow-lg transition-all', getEventColorClass(event.color), 'border-l-4', isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : '')}
            onClick={() => !isSelectionMode && onEventClick(event)}
          >
            <div className="flex items-start justify-between mb-3">
              {/* 选择框 */}
              {isSelectionMode && (
                <div className="pt-1 mr-2">
                  {renderCheckbox(event.id)}
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">{event.title}</h3>
              <span className={clsx('px-2 py-1 text-xs font-medium rounded border flex-shrink-0', priorityDisplay.color)}>
                {priorityDisplay.text}
              </span>
            </div>
            
            {event.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">{event.description}</p>
            )}
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate">
                  {event.startTime.toLocaleDateString('zh-CN')} {
                    !event.allDay && event.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                  }
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
            
            {!isSelectionMode && (
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventEdit(event);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="编辑事件"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventDelete(event.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="删除事件"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  
  return (
    <div className={clsx('space-y-6', className)}>
      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 搜索框 */}
          <div className="flex-1 max-w-md">
            <SearchBox
              searchQuery={config.filter.searchText || ''}
              onSearchChange={handleSearchChange}
              placeholder="搜索事件标题、描述或位置..."
              size="medium"
            />
          </div>
          
          {/* 批量操作和显示模式 */}
          <div className="flex items-center gap-3">
            {/* 批量操作按钮 */}
            {enableBatchActions && onBatchDelete && (
              <>
                {!isSelectionMode ? (
                  <button
                    onClick={toggleSelectionMode}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    批量操作
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exitSelectionMode}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    
                    {selectedEventIds.size > 0 && (
                      <button
                        onClick={() => setShowBatchDeleteConfirm(true)}
                        disabled={batchDeleteLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {batchDeleteLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        删除选中({selectedEventIds.size})
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* 显示模式切换 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 mr-2">显示模式:</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleDisplayModeChange(EventListDisplayMode.LIST)}
                  className={clsx('px-3 py-1.5 text-sm font-medium rounded-md transition-colors', config.displayMode === EventListDisplayMode.LIST
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900')}
                >
                  列表
                </button>
                <button
                  onClick={() => handleDisplayModeChange(EventListDisplayMode.GRID)}
                  className={clsx('px-3 py-1.5 text-sm font-medium rounded-md transition-colors', config.displayMode === EventListDisplayMode.GRID
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900')}
                >
                  网格
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 选择模式信息栏 */}
        {isSelectionMode && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {renderSelectAllCheckbox()}
                全选当前页
              </label>
              <span className="text-sm text-gray-600">
                已选择 {selectedEventIds.size} 个事件
              </span>
            </div>
          </div>
        )}
        
        {/* 排序选项 */}
        {!isSelectionMode && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-700 mr-2">排序:</span>
            {renderSortButton(EventSortField.START_TIME, '日期')}
            {renderSortButton(EventSortField.TITLE, '标题')}
            {renderSortButton(EventSortField.PRIORITY, '优先级')}
            {renderSortButton(EventSortField.CREATED_AT, '创建时间')}
            {renderSortButton(EventSortField.UPDATED_AT, '更新时间')}
          </div>
        )}
      </div>
      
      {/* 事件统计 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          共 {sortedAndFilteredEvents.length} 个事件
          {config.filter.searchText && ' (搜索: "' + (config.filter.searchText) + '")'}
        </div>
      </div>
      
      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* 事件列表 */}
      {!loading && paginatedEvents.length > 0 && (
        <>
          {config.displayMode === EventListDisplayMode.LIST ? renderListMode() : renderGridMode()}
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-gray-600">
                第 {config.currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(config.currentPage - 1)}
                  disabled={config.currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => handlePageChange(config.currentPage + 1)}
                  disabled={config.currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* 空状态 */}
      {!loading && paginatedEvents.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无事件</h3>
          <p className="text-gray-600">
            {config.filter.searchText || config.filter.priority || config.filter.color || config.filter.dateRange
              ? '没有找到符合条件的事件'
              : '还没有创建任何事件'
            }
          </p>
        </div>
      )}
      
      {/* 批量删除确认弹窗 */}
      <ConfirmModal
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="确认批量删除"
        message={'确定要删除选中的 ' + (selectedEventIds.size) + ' 个事件吗？此操作无法撤销。'}
        confirmText="删除"
        cancelText="取消"
        isLoading={batchDeleteLoading}
      />
    </div>
  );
} 