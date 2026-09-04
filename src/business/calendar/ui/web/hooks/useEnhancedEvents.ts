'use client';

import { useState, useCallback } from 'react';
import { CalendarEvent, EventFormData, CreateEventRequest, EventPriority, RecurrenceType } from '../types';
import { EventData, EventType, EventTypeService } from '../services/eventTypeService';
import { toLocalISOString, formatDate, getDayEnd } from '../utils/dateUtils';
import { calendarApiPath } from '../utils/calendarApiPath';

export interface UseEnhancedEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error?: string;
  createEvent: (eventData: EventFormData) => Promise<CalendarEvent>;
  createEnhancedEvent: (eventData: EventData) => Promise<CalendarEvent[]>;
  updateEvent: (eventId: number, eventData: Partial<EventFormData>) => Promise<CalendarEvent>;
  updateEventTime: (eventId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  deleteEvent: (eventId: number, deleteAll?: boolean) => Promise<void>;
  batchDeleteEvents: (eventIds: number[]) => Promise<void>;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  clearError: () => void;
}

/**
 * 增强版事件管理 Hook
 * 
 * 支持新的事件类型系统：单次事件、多天事件、重复事件
 */
export function useEnhancedEvents(): UseEnhancedEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // 清除错误
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  // 获取事件列表
  const fetchEvents = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    setError(undefined);
    
    try {
      const params = new URLSearchParams({
        startDate: toLocalISOString(startDate),
        endDate: toLocalISOString(endDate),
      });

      const response = await fetch(calendarApiPath(`events?${params}`), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`获取事件失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '获取事件失败');
      }

      // 转换日期字符串为Date对象
      const eventsWithDates = data.data.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));

      console.log('📥 获取到的事件数据:', {
        requestRange: `${formatDate(startDate)} 到 ${formatDate(endDate)}`,
        eventCount: eventsWithDates.length,
        eventIds: eventsWithDates.map((e: CalendarEvent) => e.id)
      });

      // 按 id 合并：范围内以接口数据为准，范围外保留未出现在本次结果中的事件
      setEvents((prev) => {
        const fetchedIds = new Set(eventsWithDates.map((e: CalendarEvent) => e.id));
        const endMs = endDate.getTime();

        const outsideRange = prev.filter((event) => {
          const eventMs = new Date(event.startTime).getTime();
          const inRange = eventMs >= startDate.getTime() && eventMs <= endMs;
          return !inRange && !fetchedIds.has(event.id);
        });

        return [...outsideRange, ...eventsWithDates];
      });
    } catch (err) {
      console.error('获取事件失败:', err);
      setError(err instanceof Error ? err.message : '获取事件失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 传统的创建事件方法（向后兼容）
  const createEvent = useCallback(async (eventData: EventFormData): Promise<CalendarEvent> => {
    setLoading(true);
    setError(undefined);
    
    try {
      const createRequest: CreateEventRequest = {
        title: eventData.title,
        description: eventData.description,
        startTime: toLocalISOString(eventData.startTime),
        endTime: toLocalISOString(eventData.endTime),
        allDay: eventData.allDay,
        location: eventData.location,
        color: eventData.color,
        priority: eventData.priority,
        recurrence: eventData.recurrence,
        reminders: eventData.reminders?.map(reminder => ({
          reminderTime: toLocalISOString(reminder.reminderTime),
          reminderType: reminder.reminderType,
        })),
      };

      const response = await fetch(calendarApiPath('events'), {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createRequest),
      });

      if (!response.ok) {
        throw new Error(`创建事件失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '创建事件失败');
      }

      // 转换日期字符串为Date对象
      const newEvent: CalendarEvent = {
        ...data.data,
        startTime: new Date(data.data.startTime),
        endTime: new Date(data.data.endTime),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };

      // 更新本地状态
      setEvents(prev => [...prev, newEvent]);
      
      return newEvent;
    } catch (err) {
      console.error('创建事件失败:', err);
      const errorMessage = err instanceof Error ? err.message : '创建事件失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 映射事件类型服务的优先级到日历模块的优先级
  const mapPriorityToEventPriority = (priority: string): EventPriority => {
    switch (priority.toLowerCase()) {
      case 'low':
        return EventPriority.LOW;
      case 'normal':
        return EventPriority.NORMAL;
      case 'high':
        return EventPriority.HIGH;
      case 'urgent':
        return EventPriority.URGENT;
      default:
        return EventPriority.NORMAL;
    }
  };

  // 映射重复模式到重复类型
  const mapPatternToRecurrenceType = (pattern: string): RecurrenceType => {
    switch (pattern) {
      case 'daily':
        return RecurrenceType.DAILY;
      case 'weekly':
        return RecurrenceType.WEEKLY;
      case 'monthly':
        return RecurrenceType.MONTHLY;
      case 'yearly':
        return RecurrenceType.YEARLY;
      default:
        return RecurrenceType.DAILY;
    }
  };

  // 增强版创建事件方法
  const createEnhancedEvent = useCallback(async (eventData: EventData): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(undefined);
    
    try {
      // 验证事件数据
      const validationErrors = EventTypeService.validateEventData(eventData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

             // 根据事件类型生成事件实例
       let generatedEvents;
       
       // 确定视图范围
       const currentDate = new Date();
       let viewStartDate: Date;
       let viewEndDate: Date;
       
       switch (eventData.type) {
         case EventType.SINGLE:
           // 单次事件：使用startTime作为基准
           viewStartDate = new Date(eventData.startTime);
           viewEndDate = new Date(eventData.endTime);
           generatedEvents = EventTypeService.generateEventInstances(
             eventData,
             viewStartDate,
             viewEndDate
           );
           break;
         
         case EventType.MULTI_DAY:
           // 多天事件：使用startDate和endDate
           viewStartDate = new Date(eventData.startDate);
           viewEndDate = new Date(eventData.endDate);
           generatedEvents = EventTypeService.generateEventInstances(
             eventData,
             viewStartDate,
             viewEndDate
           );
           break;
         
         case EventType.RECURRING:
           // 重复事件：生成一段时间内的重复实例
           viewStartDate = new Date(eventData.startDate);
           viewEndDate = eventData.recurrence.endDate || (() => {
             const calcEndDate = new Date(eventData.startDate);
             const count = eventData.recurrence.count || 10;
             const interval = eventData.recurrence.interval || 1;
             
             switch (eventData.recurrence.pattern) {
               case 'daily':
                 calcEndDate.setDate(calcEndDate.getDate() + (count * interval));
                 break;
               case 'weekly':
                 calcEndDate.setDate(calcEndDate.getDate() + (count * interval * 7));
                 break;
               case 'monthly':
                 calcEndDate.setMonth(calcEndDate.getMonth() + (count * interval));
                 break;
               case 'yearly':
                 calcEndDate.setFullYear(calcEndDate.getFullYear() + (count * interval));
                 break;
             }
             return calcEndDate;
           })();
           
           generatedEvents = EventTypeService.generateEventInstances(
             eventData,
             viewStartDate,
             viewEndDate
           );
           break;
         
         default:
           throw new Error(`不支持的事件类型: ${(eventData as any).type}`);
       }

      // 批量创建事件
      const createdEvents: CalendarEvent[] = [];
      
      for (const generatedEvent of generatedEvents) {
        const createRequest: CreateEventRequest = {
          title: generatedEvent.title,
          description: generatedEvent.description,
          startTime: toLocalISOString(generatedEvent.startTime),
          endTime: toLocalISOString(generatedEvent.endTime),
          allDay: generatedEvent.allDay,
          location: generatedEvent.location,
          color: generatedEvent.color,
          priority: mapPriorityToEventPriority(generatedEvent.priority),
        };

        // 如果是重复事件，添加重复规则
        if (eventData.type === EventType.RECURRING && eventData.recurrence) {
          createRequest.recurrence = {
            ruleType: mapPatternToRecurrenceType(eventData.recurrence.pattern),
            interval: eventData.recurrence.interval,
            endDate: eventData.recurrence.endDate,
            count: eventData.recurrence.count,
          };
        }

        const response = await fetch(calendarApiPath('events'), {
          credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        });

        if (!response.ok) {
          throw new Error(`创建事件实例失败: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || '创建事件实例失败');
        }

        const newEvent: CalendarEvent = {
          ...data.data,
          startTime: new Date(data.data.startTime),
          endTime: new Date(data.data.endTime),
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        };

        createdEvents.push(newEvent);
      }

      // 更新本地状态
      setEvents(prev => [...prev, ...createdEvents]);
      
      return createdEvents;
    } catch (err) {
      console.error('创建增强事件失败:', err);
      const errorMessage = err instanceof Error ? err.message : '创建事件失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新事件
  const updateEvent = useCallback(async (
    eventId: number, 
    eventData: Partial<EventFormData>
  ): Promise<CalendarEvent> => {
    setLoading(true);
    setError(undefined);
    
    try {
      const updateRequest: any = {};
      
      if (eventData.title !== undefined) updateRequest.title = eventData.title;
      if (eventData.description !== undefined) updateRequest.description = eventData.description;
      if (eventData.startTime !== undefined) updateRequest.startTime = toLocalISOString(eventData.startTime);
      if (eventData.endTime !== undefined) updateRequest.endTime = toLocalISOString(eventData.endTime);
      if (eventData.allDay !== undefined) updateRequest.allDay = eventData.allDay;
      if (eventData.location !== undefined) updateRequest.location = eventData.location;
      if (eventData.color !== undefined) updateRequest.color = eventData.color;

      const response = await fetch(calendarApiPath(`events/${eventId}`), {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      if (!response.ok) {
        throw new Error(`更新事件失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '更新事件失败');
      }

      // 转换日期字符串为Date对象
      const updatedEvent: CalendarEvent = {
        ...data.data,
        startTime: new Date(data.data.startTime),
        endTime: new Date(data.data.endTime),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };

      // 更新本地状态
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
      
      return updatedEvent;
    } catch (err) {
      console.error('更新事件失败:', err);
      const errorMessage = err instanceof Error ? err.message : '更新事件失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除事件
  const deleteEvent = useCallback(async (eventId: number, deleteAll = false) => {
    setLoading(true);
    setError(undefined);
    
    try {
      const url = deleteAll
        ? calendarApiPath(`events/${eventId}?deleteAll=true`)
        : calendarApiPath(`events/${eventId}`);

      const response = await fetch(url, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`删除事件失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '删除事件失败');
      }

      // 更新本地状态
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      console.error('删除事件失败:', err);
      const errorMessage = err instanceof Error ? err.message : '删除事件失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 批量删除事件
  const batchDeleteEvents = useCallback(async (eventIds: number[]) => {
    setLoading(true);
    setError(undefined);
    
    try {
      const response = await fetch(calendarApiPath('events/batchDelete'), {
        credentials: 'include',
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventIds }),
      });

      if (!response.ok) {
        throw new Error(`批量删除事件失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '批量删除事件失败');
      }

      // 更新本地状态
      setEvents(prev => prev.filter(event => !eventIds.includes(event.id)));
    } catch (err) {
      console.error('批量删除事件失败:', err);
      const errorMessage = err instanceof Error ? err.message : '批量删除事件失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新事件时间（专门用于拖拽）
  const updateEventTime = useCallback(async (
    eventId: number, 
    newStartTime: Date, 
    newEndTime: Date
  ): Promise<void> => {
    setLoading(true);
    setError(undefined);
    
    console.log('🔄 updateEventTime 调用:', {
      eventId,
      newStartTime: newStartTime.toISOString(),
      newEndTime: newEndTime.toISOString(),
      localStartTime: toLocalISOString(newStartTime),
      localEndTime: toLocalISOString(newEndTime)
    });
    
    try {
      const updateRequest = {
        startTime: toLocalISOString(newStartTime),
        endTime: toLocalISOString(newEndTime),
      };

      console.log('📤 发送API请求:', updateRequest);

      const response = await fetch(calendarApiPath(`events/${eventId}`), {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      if (!response.ok) {
        throw new Error(`更新事件时间失败: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📥 API响应:', data);
      
      if (!data.success) {
        throw new Error(data.error || '更新事件时间失败');
      }

      console.log('🔄 API返回的事件数据:', {
        originalStartTime: data.data.startTime,
        originalEndTime: data.data.endTime,
        parsedStartTime: new Date(data.data.startTime).toISOString(),
        parsedEndTime: new Date(data.data.endTime).toISOString()
      });

      // 转换日期字符串为Date对象
      const updatedEvent: CalendarEvent = {
        ...data.data,
        startTime: new Date(data.data.startTime),
        endTime: new Date(data.data.endTime),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };

      console.log('✅ 更新后的事件对象:', {
        id: updatedEvent.id,
        title: updatedEvent.title,
        startTime: updatedEvent.startTime.toISOString(),
        endTime: updatedEvent.endTime.toISOString(),
        localStartDate: formatDate(updatedEvent.startTime),
        localEndDate: formatDate(updatedEvent.endTime)
      });

      // 更新本地状态
      setEvents(prev => {
        const oldEvent = prev.find(e => e.id === eventId);
        const newEvents = prev.map(event => 
          event.id === eventId ? updatedEvent : event
        );
        
        console.log('🔄 updateEventTime 本地状态更新:', {
          eventId,
          oldEventDate: oldEvent ? formatDate(oldEvent.startTime) : 'not found',
          newEventDate: formatDate(updatedEvent.startTime),
          totalEventsBefore: prev.length,
          totalEventsAfter: newEvents.length,
          eventFound: !!oldEvent
        });
        
        return newEvents;
      });
    } catch (err) {
      console.error('更新事件时间失败:', err);
      const errorMessage = err instanceof Error ? err.message : '更新事件时间失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
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
    clearError,
  };
} 