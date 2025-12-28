'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings, Calendar, List, Cog, User } from 'lucide-react';
import { 
  CalendarViewType, 
  EventColor,
  EventFormData,
  CreateEventRequest,
  UpdateEventRequest,
  EventListDisplayMode,
  EventSortField,
  SortDirection,
  EventPriority,
  EventListConfig,
  formatDate,
  getMonthViewDates,
  getWeekViewDates,
  isToday,
  isSameMonth,
  isSameWeek,
  addDays,
  addWeeks,
  useEvents,
  getWeekdayName
} from '../index';
import EventModal from '../components/EventModal';
import EventList from '../components/EventList';
import { useEnhancedEvents } from '../hooks/useEnhancedEvents';
import { EventData } from '../services/eventTypeService';
import ImprovedEventModal from '../components/ImprovedEventModal';
import DraggableMonthView from '../components/DraggableMonthView';
import CalendarSettings from '../components/CalendarSettings';
import type { CalendarSettings as CalendarSettingsType } from '../components/CalendarSettings';

interface CalendarPageProps {
  /** 当前登录用户信息 */
  user?: { id: number; name?: string; [key: string]: any } | null;
  /** 是否已认证 */
  isAuthenticated?: boolean;
  /** 触发登录的回调 */
  onShowLogin?: () => void;
  /** 自定义页头操作区域（例如用户菜单） */
  headerActions?: React.ReactNode;
}

/**
 * 基础日历页面组件
 * 
 * 这是一个简化版本的日历页面，用于在实验田中展示基本功能
 * 包含了基本的月历视图和事件显示
 */
export function CalendarPage({ 
  user, 
  isAuthenticated = true, 
  onShowLogin,
  headerActions
}: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>(CalendarViewType.MONTH);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'events' | 'settings'>('calendar');
  
  // 日历设置状态
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettingsType | null>(null);
  
  // 事件列表配置
  const [eventListConfig, setEventListConfig] = useState<EventListConfig>({
    displayMode: EventListDisplayMode.LIST,
    sort: {
      field: EventSortField.START_TIME,
      direction: SortDirection.ASC
    },
    filter: {},
    pageSize: 10,
    currentPage: 1
  });
  
  // 使用事件 management Hook
  const { 
    events, 
    loading, 
    error, 
    createEvent, 
    createEnhancedEvent,
    updateEvent,
    updateEventTime,
    deleteEvent,
    batchDeleteEvents,
    fetchEvents, 
    clearError 
  } = useEnhancedEvents();

  // 获取当前月份的日期数组
  const monthDates = useMemo(() => getMonthViewDates(currentDate), [currentDate]);

  // 加载当前月份的事件（包含月视图中显示的相邻月份日期）
  useEffect(() => {
    // 获取月视图显示的所有日期范围（包括上月末和下月初）
    const viewDates = getMonthViewDates(currentDate);
    const viewStart = viewDates[0]; // 第一个日期
    const viewEnd = viewDates[viewDates.length - 1]; // 最后一个日期
    
    if (viewStart && viewEnd) {
      console.log('📅 加载月视图事件范围:', {
        currentMonth: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
        viewStart: formatDate(viewStart),
        viewEnd: formatDate(viewEnd),
        totalDays: viewDates.length
      });
      
      fetchEvents(viewStart, viewEnd).catch(err => {
        console.error('加载事件失败:', err);
      });
    }
  }, [currentDate, fetchEvents]);

  // 示例事件数据 - 当没有实际事件时显示
  const sampleEvents = useMemo(() => [
    { date: '2024-12-15', title: '团队会议', color: 'blue' },
    { date: '2024-12-20', title: '项目评审', color: 'green' },
    { date: '2024-12-25', title: '圣诞节', color: 'red' },
    { date: '2024-12-31', title: '年终总结', color: 'purple' },
  ], []);

  // 向前导航
  const goToPrevious = () => {
    switch (viewType) {
      case CalendarViewType.MONTH:
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        break;
      case CalendarViewType.WEEK:
        setCurrentDate(addDays(currentDate, -7));
        break;
      case CalendarViewType.DAY:
        setCurrentDate(addDays(currentDate, -1));
        break;
    }
  };

  // 向后导航
  const goToNext = () => {
    switch (viewType) {
      case CalendarViewType.MONTH:
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        break;
      case CalendarViewType.WEEK:
        setCurrentDate(addDays(currentDate, 7));
        break;
      case CalendarViewType.DAY:
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  // 切换到今天
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 获取月份名称
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  };

  // 获取视图标题
  const getViewTitle = () => {
    switch (viewType) {
      case CalendarViewType.MONTH:
        return getMonthName(currentDate);
      case CalendarViewType.WEEK:
        const weekDates = getWeekViewDates(currentDate);
        const weekStart = weekDates[0];
        const weekEnd = weekDates[6];
        if (!weekStart || !weekEnd) {
          return getMonthName(currentDate);
        }
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月 第${Math.ceil(weekStart.getDate() / 7)}周`;
        } else {
          return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
        }
      case CalendarViewType.DAY:
        return currentDate.toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        });
      default:
        return getMonthName(currentDate);
    }
  };

  // 检查日期是否有事件（优先使用真实事件，其次使用示例事件）
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    
    // 首先查找真实事件
    const realEvents = events.filter(event => {
      const eventDateStr = formatDate(event.startTime);
      return eventDateStr === dateStr;
    });
    
    // 如果有真实事件，返回真实事件，否则返回示例事件
    if (realEvents.length > 0) {
      return realEvents.map(event => ({
        title: event.title,
        color: event.color,
        id: event.id,
        isRealEvent: true
      }));
    }
    
    // 为了演示效果，显示示例事件
    return sampleEvents.filter(event => event.date === dateStr).map(event => ({
      title: event.title,
      color: event.color,
      id: undefined,
      isRealEvent: false
    }));
  };

  // 获取事件颜色类名
  const getEventColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-200',
      '#10B981': 'bg-green-100 text-green-800 border-green-200',
      '#EF4444': 'bg-red-100 text-red-800 border-red-200',
      '#8B5CF6': 'bg-purple-100 text-purple-800 border-purple-200',
      '#F59E0B': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 处理日期点击事件
  const handleDateClick = (date: Date) => {
    if (!isAuthenticated && onShowLogin) {
      onShowLogin();
      return;
    }
    setSelectedDate(date);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  // 处理事件点击（用于编辑）
  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡到日期点击
    if (!isAuthenticated && onShowLogin) {
      onShowLogin();
      return;
    }
    setEditingEvent(event);
    setSelectedDate(null);
    setIsEventModalOpen(true);
  };

  // 处理事件保存（创建或更新）
  const handleEventSave = async (eventData: CreateEventRequest | UpdateEventRequest) => {
    if (!isAuthenticated && onShowLogin) {
      onShowLogin();
      return;
    }
    
    try {
      if (!eventData.title || !eventData.startTime || !eventData.endTime) {
        throw new Error('缺少必需的事件信息');
      }
      
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          title: eventData.title,
          description: eventData.description,
          startTime: new Date(eventData.startTime),
          endTime: new Date(eventData.endTime),
          allDay: eventData.allDay || false,
          location: eventData.location,
          color: eventData.color || EventColor.BLUE,
          priority: eventData.priority || EventPriority.NORMAL,
        });
      } else {
        await createEvent({
          title: eventData.title,
          description: eventData.description,
          startTime: new Date(eventData.startTime),
          endTime: new Date(eventData.endTime),
          allDay: eventData.allDay || false,
          location: eventData.location,
          color: eventData.color || EventColor.BLUE,
          priority: eventData.priority || EventPriority.NORMAL,
        });
      }
      
      setIsEventModalOpen(false);
      setSelectedDate(null);
      setEditingEvent(null);
    } catch (error) {
      console.error(editingEvent ? '更新事件失败:' : '创建事件失败:', error);
    }
  };

  // 处理事件删除
  const handleEventDelete = async (eventId: number) => {
    if (!isAuthenticated && onShowLogin) {
      onShowLogin();
      return;
    }
    
    try {
      await deleteEvent(eventId);
      setIsEventModalOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('删除事件失败:', error);
    }
  };

  // 处理批量删除事件
  const handleBatchDelete = async (eventIds: number[]) => {
    if (!isAuthenticated && onShowLogin) {
      onShowLogin();
      return;
    }
    
    try {
      await batchDeleteEvents(eventIds);
    } catch (error) {
      console.error('批量删除事件失败:', error);
      throw error;
    }
  };

  // 处理事件列表中的事件点击
  const handleEventListClick = (event: any) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  // 处理事件列表中的事件编辑
  const handleEventListEdit = (event: any) => {
    if (!isAuthenticated && onShowLogin) {
      onShowLogin();
      return;
    }
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  // 处理事件列表配置变更
  const handleEventListConfigChange = (config: EventListConfig) => {
    setEventListConfig(config);
  };

  // 关闭模态框
  const handleModalClose = () => {
    setIsEventModalOpen(false);
    setSelectedDate(null);
    setEditingEvent(null);
    clearError();
  };

  // 处理设置变更
  const handleSettingsChange = (newSettings: CalendarSettingsType) => {
    setCalendarSettings(newSettings);
    console.log('📝 日历设置已更新:', newSettings);
  };

  // 渲染不同的日历视图
  const renderCalendarView = () => {
    switch (viewType) {
      case CalendarViewType.MONTH:
        return (
          <DraggableMonthView
            events={events}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onEventClick={(event) => {
              setEditingEvent(event);
              setIsEventModalOpen(true);
            }}
            onDateClick={handleDateClick}
            onEventUpdate={updateEventTime}
          />
        );
      case CalendarViewType.WEEK:
        return renderWeekView();
      case CalendarViewType.DAY:
        return renderDayView();
      default:
        return (
          <DraggableMonthView
            events={events}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onEventClick={(event) => {
              setEditingEvent(event);
              setIsEventModalOpen(true);
            }}
            onDateClick={handleDateClick}
            onEventUpdate={updateEventTime}
          />
        );
    }
  };

  // 渲染周视图
  const renderWeekView = () => {
    const weekDates = getWeekViewDates(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-gray-50">
              {weekDates.map((date, index) => {
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <th 
                    key={index} 
                    className={`p-3 text-center border-b border-gray-200 ${
                      index < 6 ? 'border-r border-gray-200' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      isWeekend ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {getWeekdayName(date, 'zh-CN', 'short')}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDates.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isTodayDate = isToday(date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <td
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`
                      h-56 border-b border-gray-200 relative cursor-pointer
                      ${index < 6 ? 'border-r border-gray-200' : ''}
                      hover:bg-gray-50 transition-colors
                      ${isTodayDate ? 'bg-blue-50' : 'bg-white'}
                    `}
                  >
                    <div className="flex flex-col h-full p-3">
                      <div className="flex flex-col items-center mb-3">
                        <div className={`flex items-center justify-center text-lg font-bold w-10 h-10 rounded-full ${
                          isTodayDate ? 'bg-blue-600 text-white shadow-md' : 
                          isWeekend ? 'text-red-600 bg-red-50' : 'text-gray-900 hover:bg-gray-100'
                        } transition-colors`}>
                          {date.getDate()}
                        </div>
                        {(index === 0 || date.getDate() === 1) && (
                          <div className="text-xs text-gray-500 mt-1 font-medium">
                            {date.getMonth() + 1}月
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        {dayEvents.length > 0 ? (
                          <>
                            <div className="text-center mb-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                                dayEvents.length > 5 ? 'bg-red-100 text-red-700' :
                                dayEvents.length > 2 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {dayEvents.length}
                              </span>
                            </div>
                            
                            <div className="space-y-1 overflow-hidden">
                              {dayEvents.slice(0, 4).map((event, eventIndex) => (
                                <div
                                  key={eventIndex}
                                  onClick={(e) => event.isRealEvent && event.id ? handleEventClick(events.find(e => e.id === event.id), e) : undefined}
                                  className={`
                                    text-xs px-2 py-1 rounded font-medium truncate text-center
                                    ${event.isRealEvent ? 'cursor-pointer hover:opacity-80 hover:shadow-sm' : 'cursor-default'}
                                    transition-all duration-200
                                    ${getEventColorClass(event.color)}
                                  `}
                                  title={event.title}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 4 && (
                                <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 rounded">
                                  +{dayEvents.length - 4} 更多
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-4 h-4 mx-auto mb-1 opacity-30">
                                <svg fill="currentColor" viewBox="0 0 20 20" className="text-gray-400">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="text-xs text-gray-400">无事件</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染日视图
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isTodayDate = isToday(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">
              {currentDate.toLocaleDateString('zh-CN', { weekday: 'long' })}
            </div>
            <div className={`text-2xl font-bold ${
              isTodayDate ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {currentDate.getDate()}日
            </div>
            <div className="text-sm text-gray-600">
              {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => handleDateClick(currentDate)}
            className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            + 在此日期创建事件
          </button>

          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                今日事件 ({dayEvents.length})
              </h3>
              {dayEvents.map((event, eventIndex) => (
                <div
                  key={eventIndex}
                  onClick={(e) => event.isRealEvent && event.id ? handleEventClick(events.find(e => e.id === event.id), e) : undefined}
                  className={`
                    p-3 rounded-lg border-l-4 bg-gray-50
                    ${event.isRealEvent ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                    transition-shadow
                    ${getEventColorClass(event.color)}
                  `}
                >
                  <div className="font-medium text-sm mb-1">{event.title}</div>
                  {event.isRealEvent && event.id && (
                    <div className="text-xs text-gray-600">
                      点击编辑事件
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>今日暂无事件</p>
              <p className="text-xs mt-1">点击上方按钮创建事件</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 处理增强事件创建
  const handleCreateEnhancedEvent = useCallback(async (eventData: EventData) => {
    try {
      const createdEvents = await createEnhancedEvent(eventData);
      setIsEventModalOpen(false);
      setSelectedDate(null);
      
      const eventCount = createdEvents.length;
      if (eventCount > 1) {
        alert(`成功创建 ${eventCount} 个事件！`);
      } else {
        alert('事件创建成功！');
      }
    } catch (error) {
      console.error('创建增强事件失败:', error);
      alert('创建事件失败，请重试');
    }
  }, [createEnhancedEvent]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="mb-6">
           <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">日历管理</h1>
              <p className="text-gray-600">
                功能完整的日历应用，支持事件管理、提醒、重复事件等功能
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {headerActions}
              {!headerActions && !isAuthenticated && (
                <button
                  onClick={onShowLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  登录
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 日历视图
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'events'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 事件列表
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚙️ 设置
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">操作失败</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">功能说明</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    点击日历上的任意日期可以创建新事件。当前已支持完整的事件管理功能，包括创建、编辑、删除等操作。
                    {!isAuthenticated && (
                      <span className="block mt-2 text-orange-700 font-medium">
                        💡 提示：请先登录以使用完整的事件管理功能
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={goToPrevious} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900 min-w-[160px] text-center">{getViewTitle()}</h2>
                  <button onClick={goToNext} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    今天
                  </button>
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    {(['month', 'week', 'day'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setViewType(CalendarViewType[view.toUpperCase() as keyof typeof CalendarViewType])}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          viewType === CalendarViewType[view.toUpperCase() as keyof typeof CalendarViewType]
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {view === 'month' ? '月' : view === 'week' ? '周' : '日'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {renderCalendarView()}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">事件管理</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">创建、编辑、删除日历事件，支持拖拽调整时间，多种颜色标识。</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">重复事件</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">支持日、周、月、年重复模式，灵活的重复规则配置。</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">智能提醒</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">邮件、通知、短信多种提醒方式，自定义提醒时间。</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">技术特性</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  完整的TypeScript类型定义
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  响应式设计 (TailwindCSS)
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'events' && (
          <EventList
            events={events}
            config={eventListConfig}
            onConfigChange={handleEventListConfigChange}
            onEventClick={handleEventListClick}
            onEventEdit={handleEventListEdit}
            onEventDelete={handleEventDelete}
            onBatchDelete={handleBatchDelete}
            enableBatchActions={true}
            loading={loading}
          />
        )}

        {activeTab === 'settings' && (
          <CalendarSettings
            onSettingsChange={handleSettingsChange}
          />
        )}
      </div>

      <ImprovedEventModal
        isOpen={isEventModalOpen}
        onClose={handleModalClose}
        onSave={handleCreateEnhancedEvent}
        onDelete={editingEvent ? handleEventDelete : undefined}
        event={editingEvent}
        initialDate={selectedDate || undefined}
      />
    </div>
  );
}
