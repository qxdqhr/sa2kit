'use client';

import { useState, useCallback } from 'react';
import { CalendarEvent, EventFormData, CreateEventRequest } from '../types';
import { toLocalISOString } from '../utils/dateUtils';

export interface UseEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error?: string;
  createEvent: (eventData: EventFormData) => Promise<CalendarEvent>;
  updateEvent: (eventId: number, eventData: Partial<EventFormData>) => Promise<CalendarEvent>;
  deleteEvent: (eventId: number, deleteAll?: boolean) => Promise<void>;
  batchDeleteEvents: (eventIds: number[]) => Promise<void>;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  clearError: () => void;
}

/**
 * 事件管理 Hook
 * 
 * 提供事件的状态管理和CRUD操作
 */
export function useEvents(): UseEventsReturn {
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

      const response = await fetch(`/api/calendar/events?${params}`);
      
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

      setEvents(eventsWithDates);
    } catch (err) {
      console.error('获取事件失败:', err);
      setError(err instanceof Error ? err.message : '获取事件失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建事件
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
        // TODO: 支持重复规则和提醒
        recurrence: eventData.recurrence,
        reminders: eventData.reminders?.map(reminder => ({
          reminderTime: toLocalISOString(reminder.reminderTime),
          reminderType: reminder.reminderType,
        })),
      };

      const response = await fetch('/api/calendar/events', {
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

      const response = await fetch(`/api/calendar/events/${eventId}`, {
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
        ? `/api/calendar/events/${eventId}?deleteAll=true`
        : `/api/calendar/events/${eventId}`;

      const response = await fetch(url, {
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
      const response = await fetch('/api/calendar/events/batchDelete', {
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

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    batchDeleteEvents,
    fetchEvents,
    clearError,
  };
} 