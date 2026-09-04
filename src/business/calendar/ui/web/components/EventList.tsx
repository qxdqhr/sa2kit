'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { SearchBox } from 'sa2kit/common/ui/patterns';
import { Button, Loading, Modal } from 'sa2kit/common/ui';
import { 
  CalendarEvent, 
  EventListProps, 
  EventListDisplayMode, 
  EventSortField, 
  SortDirection, 
  EventPriority 
} from '../types';
import { getEventSurfaceClasses, getPriorityLabel } from '../utils/eventDisplay';
import MapNavigationPickerModal from './MapNavigationPickerModal';
import {
  openMapNavigation,
  type MapNavigationProviderId,
} from '../utils/mapNavigation';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import { formatTimeForSettings } from '../utils/calendarSettingsCore';
import {
  cal,
  modalActionsClass,
  segmentedBtnClass,
  sortBtnClass,
} from '../calendarStyles';
import { cn } from '../utils/cn';

/**
 * 事件列表组件
 * 支持列表/网格显示模式、排序、批量选择和批量删除
 */
export default function EventList({
  events,
  config,
  onConfigChange,
  onEventEdit,
  onEventDelete,
  onBatchDelete,
  enableBatchActions = true,
  loading = false,
  className = ''
}: EventListProps) {
  const { settings } = useCalendarSettings();

  const formatEventDateTime = (event: CalendarEvent) => {
    const datePart = event.startTime.toLocaleDateString(settings.language);
    if (event.allDay) return datePart;
    return `${datePart} ${formatTimeForSettings(event.startTime, settings)}`;
  };
  
  // 批量选择状态
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<string | null>(null);
  
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

    if (config.filter.month) {
      const [yearStr, monthStr] = config.filter.month.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        filteredEvents = filteredEvents.filter((event) => {
          const d = event.startTime;
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
      }
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

  const handleMonthFilterChange = (month: string) => {
    onConfigChange({
      ...config,
      filter: {
        ...config.filter,
        month: month || undefined,
      },
      currentPage: 1,
    });
  };

  const clearMonthFilter = () => {
    if (!config.filter.month) return;
    const { month: _removed, ...rest } = config.filter;
    onConfigChange({
      ...config,
      filter: rest,
      currentPage: 1,
    });
  };
  
  // 渲染排序按钮
  const renderSortButton = (field: EventSortField, label: string) => {
    const isActive = config.sort.field === field;
    const isAsc = isActive && config.sort.direction === SortDirection.ASC;
    
    return (
      <button
        onClick={() => handleSortChange(field)}
        className={sortBtnClass(isActive)}
      >
        {label}
        <svg 
          className={`ml-1 w-4 h-4 transition-transform ${
            isActive ? (isAsc ? 'rotate-180' : '') : 'opacity-50'
          }`} 
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
        className={cal.checkbox}
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
        className={cal.checkbox}
      />
    );
  };
  
  // 渲染可点击的地点（弹出地图选择器）
  const renderLocation = (location: string, truncate = false, inGrid = false) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setNavigationDestination(location);
      }}
      className={cn(cal.locationLink, truncate && 'max-w-full', inGrid && cal.locationLinkGrid)}
      title="选择地图应用导航"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className={truncate ? 'truncate' : ''}>{location}</span>
    </button>
  );

  // 渲染列表模式
  const renderListMode = () => (
    <div className="space-y-4">
      {paginatedEvents.map((event) => {
        const priorityDisplay = getPriorityLabel(event.priority);
        const isSelected = selectedEventIds.has(event.id);
        
        return (
          <div
            key={event.id}
            className={cn(
              cal.eventCard,
              getEventSurfaceClasses(event.color),
              isSelected && cal.selectedRing,
            )}
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
                    <h3 className={`${cal.textHeading} text-lg`}>{event.title}</h3>
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${priorityDisplay.className}`}>
                      {priorityDisplay.text}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className={`${cal.textBody} mb-2 line-clamp-2`}>{event.description}</p>
                  )}
                  
                  <div className={`${cal.textMuted} flex items-center gap-4 text-sm`}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatEventDateTime(event)}</span>
                    </div>
                    
                    {event.location && renderLocation(event.location)}
                  </div>
                </div>
              </div>
              
              {/* 操作按钮 */}
              {!isSelectionMode && (
                <div className="ml-4 flex items-center gap-2">
                  <Button
                    type="text"
                    size="small"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onEventEdit(event);
                    }}
                    title="编辑事件"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onEventDelete(event.id);
                    }}
                    title="删除事件"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
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
    <div className={cal.eventGrid}>
      {paginatedEvents.map((event) => {
        const priorityDisplay = getPriorityLabel(event.priority);
        const isSelected = selectedEventIds.has(event.id);
        
        return (
          <div
            key={event.id}
            className={cn(
              cal.eventCard,
              cal.eventCardGrid,
              getEventSurfaceClasses(event.color),
              isSelected && cal.selectedRing,
            )}
          >
            <div className={cal.eventCardGridHead}>
              {isSelectionMode && (
                <div className={cal.eventCardGridCheck}>
                  {renderCheckbox(event.id)}
                </div>
              )}
              <h3 className={cal.eventCardTitle}>{event.title}</h3>
              <span className={cn(cal.eventCardPriority, priorityDisplay.className)}>
                {priorityDisplay.text}
              </span>
            </div>
            
            {event.description && (
              <p className={cal.eventCardDesc}>{event.description}</p>
            )}
            
            <div className={cal.eventCardMeta}>
              <div className={cal.eventCardMetaRow}>
                <svg className={cal.eventCardMetaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{formatEventDateTime(event)}</span>
              </div>
              
              {event.location && (
                <div className={cal.eventCardMetaRow}>
                  {renderLocation(event.location, true, true)}
                </div>
              )}
            </div>
            
            {!isSelectionMode && (
              <div className={cal.eventCardGridActions}>
                <Button
                  type="text"
                  size="small"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEventEdit(event);
                  }}
                  title="编辑事件"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <Button
                  type="text"
                  size="small"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEventDelete(event.id);
                  }}
                  title="删除事件"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {/* 固定工具栏 */}
      <div className={cn(cal.panel, cal.listToolbar, 'shrink-0')}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* 搜索框 */}
          <div className="max-w-md flex-1">
            <SearchBox
              searchQuery={config.filter.searchText || ''}
              onSearchChange={handleSearchChange}
              placeholder="搜索事件标题、描述或位置..."
              size="medium"
            />
          </div>
          
          {/* 批量操作和显示模式 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 月份筛选 */}
            <div className="flex items-center gap-2">
              <span className={`${cal.textBody} text-sm whitespace-nowrap`}>月份:</span>
              <input
                type="month"
                value={config.filter.month ?? ''}
                onChange={(e) => handleMonthFilterChange(e.target.value)}
                className={cn(cal.input, 'h-9 w-[140px] py-1.5 text-sm')}
                aria-label="按月份筛选"
              />
              {config.filter.month && (
                <button
                  type="button"
                  onClick={clearMonthFilter}
                  className="whitespace-nowrap text-xs font-semibold text-[#11a89b] hover:text-[#19c8b9]"
                >
                  清除
                </button>
              )}
            </div>

            {/* 批量操作按钮 */}
            {enableBatchActions && onBatchDelete && (
              <>
                {!isSelectionMode ? (
                  <Button
                    type="default"
                    size="small"
                    onClick={toggleSelectionMode}
                    className="whitespace-nowrap"
                    icon={
                      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    批量操作
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button type="default" size="small" onClick={exitSelectionMode}>
                      取消
                    </Button>

                    {selectedEventIds.size > 0 && (
                      <Button
                        type="danger-primary"
                        size="small"
                        loading={batchDeleteLoading}
                        onClick={() => setShowBatchDeleteConfirm(true)}
                        className="whitespace-nowrap"
                      >
                        删除选中({selectedEventIds.size})
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* 显示模式切换 */}
            <div className="flex items-center gap-2">
              <span className={`${cal.textBody} mr-2 text-sm whitespace-nowrap`}>显示模式:</span>
              <div className={cal.segmented}>
                <button
                  onClick={() => handleDisplayModeChange(EventListDisplayMode.LIST)}
                  className={segmentedBtnClass(
                    config.displayMode === EventListDisplayMode.LIST,
                    true,
                  )}
                >
                  列表
                </button>
                <button
                  onClick={() => handleDisplayModeChange(EventListDisplayMode.GRID)}
                  className={segmentedBtnClass(
                    config.displayMode === EventListDisplayMode.GRID,
                    true,
                  )}
                >
                  网格
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 选择模式信息栏 */}
        {isSelectionMode && (
          <div className={`${cal.dividerTop} mt-4 flex items-center justify-between pt-4`}>
            <div className="flex items-center gap-3">
              <label className={`${cal.label} flex items-center gap-2 text-sm`}>
                {renderSelectAllCheckbox()}
                全选当前页
              </label>
              <span className={`${cal.textMuted} text-sm`}>
                已选择 {selectedEventIds.size} 个事件
              </span>
            </div>
          </div>
        )}
        
        {/* 排序选项 */}
        {!isSelectionMode && (
          <div className={`${cal.dividerTop} mt-4 flex flex-wrap items-center gap-2 pt-4`}>
            <span className={`${cal.textBody} mr-2 text-sm`}>排序:</span>
            {renderSortButton(EventSortField.START_TIME, '日期')}
            {renderSortButton(EventSortField.TITLE, '标题')}
            {renderSortButton(EventSortField.PRIORITY, '优先级')}
            {renderSortButton(EventSortField.CREATED_AT, '创建时间')}
            {renderSortButton(EventSortField.UPDATED_AT, '更新时间')}
          </div>
        )}
      </div>
      
      {/* 可滚动内容区 */}
      <div className={cn(cal.scrollY, cal.scrollHidden, 'mt-3 min-h-0 flex-1')}>
        {/* 事件统计 */}
        <div className="mb-3 flex items-center justify-between">
          <div className={cal.stats}>
            共 {sortedAndFilteredEvents.length} 个事件
            {config.filter.searchText && ` (搜索: "${config.filter.searchText}")`}
            {config.filter.month && ` (月份: ${config.filter.month})`}
          </div>
        </div>
        
        {/* 加载状态 */}
        {loading && (
          <div className={cal.loadingWrap}>
            <Loading active />
          </div>
        )}
        
        {/* 事件列表 */}
        {!loading && paginatedEvents.length > 0 && (
          <>
            {config.displayMode === EventListDisplayMode.LIST ? renderListMode() : renderGridMode()}
            
            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6">
                <div className={cal.stats}>
                  第 {config.currentPage} 页，共 {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(config.currentPage - 1)}
                    disabled={config.currentPage === 1}
                    className={cal.paginationBtn}
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => handlePageChange(config.currentPage + 1)}
                    disabled={config.currentPage === totalPages}
                    className={cal.paginationBtn}
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
          <div className={cal.empty}>
            <h3 className={`${cal.textHeading} mb-2 text-lg`}>暂无事件</h3>
            <p className={cal.textMuted}>
              {config.filter.searchText || config.filter.priority || config.filter.color || config.filter.dateRange || config.filter.month
                ? '没有找到符合条件的事件'
                : '还没有创建任何事件'
              }
            </p>
          </div>
        )}
      </div>
      
      {/* 批量删除确认弹窗 */}
      <Modal
        open={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        title="确认批量删除"
        typewriter={false}
        footer={
          <div className={modalActionsClass()}>
            <Button type="default" size="small" onClick={() => setShowBatchDeleteConfirm(false)}>
              取消
            </Button>
            <Button
              type="danger-primary"
              size="small"
              loading={batchDeleteLoading}
              onClick={() => void handleBatchDelete()}
            >
              删除
            </Button>
          </div>
        }
      >
        确定要删除选中的 {selectedEventIds.size} 个事件吗？此操作无法撤销。
      </Modal>

      <MapNavigationPickerModal
        isOpen={navigationDestination !== null}
        destination={navigationDestination ?? ''}
        onClose={() => setNavigationDestination(null)}
        onSelect={(provider: MapNavigationProviderId) => {
          if (navigationDestination) {
            openMapNavigation(provider, navigationDestination);
          }
          setNavigationDestination(null);
        }}
      />
    </div>
  );
} 
