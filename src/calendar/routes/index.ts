import { NextRequest, NextResponse } from 'next/server';
import { calendarDbService } from '../db/calendarDbService';

export interface CalendarRouteConfig {
  /**
   * Drizzle 数据库实例
   * 如果提供，将自动初始化 calendarDbService
   */
  db?: any;
  /**
   * 验证用户身份的函数
   * 应该返回用户信息或 null
   */
  validateAuth: (request: NextRequest) => Promise<{ id: number } | null>;
}

/**
 * 初始化数据库服务的辅助函数
 */
function initDbService(db?: any) {
  if (db) {
    calendarDbService.setDb(db);
  }
}

/**
 * 创建获取日历事件列表的处理器
 */
export function createGetEventsHandler(config: CalendarRouteConfig) {
  initDbService(config.db);
  return async (request: NextRequest) => {
    try {
      const user = await config.validateAuth(request);
      if (!user) {
        return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (startDateStr) {
        startDate = new Date(startDateStr);
        if (isNaN(startDate.getTime())) {
          return NextResponse.json({ success: false, error: '开始日期格式无效' }, { status: 400 });
        }
      }

      if (endDateStr) {
        endDate = new Date(endDateStr);
        if (isNaN(endDate.getTime())) {
          return NextResponse.json({ success: false, error: '结束日期格式无效' }, { status: 400 });
        }
      }

      const events = await calendarDbService.getAllEvents(user.id, startDate, endDate);

      return NextResponse.json({
        success: true,
        data: events,
        message: '获取事件列表成功'
      });
    } catch (error) {
      console.error('获取事件失败：', error);
      return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
  };
}

/**
 * 创建日历事件的处理器
 */
export function createCreateEventHandler(config: CalendarRouteConfig) {
  initDbService(config.db);
  return async (request: NextRequest) => {
    try {
      const user = await config.validateAuth(request);
      if (!user) {
        return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
      }

      const body = await request.json();
      
      if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
        return NextResponse.json({ success: false, error: '事件标题不能为空' }, { status: 400 });
      }

      if (!body.startTime || !body.endTime) {
        return NextResponse.json({ success: false, error: '开始时间和结束时间不能为空' }, { status: 400 });
      }

      const startTime = new Date(body.startTime);
      const endTime = new Date(body.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return NextResponse.json({ success: false, error: '日期格式无效' }, { status: 400 });
      }

      if (startTime.getTime() >= endTime.getTime()) {
        return NextResponse.json({ success: false, error: '结束时间必须晚于开始时间' }, { status: 400 });
      }

      const eventData = {
        title: body.title.trim(),
        description: body.description || null,
        startTime,
        endTime,
        allDay: Boolean(body.allDay),
        location: body.location || null,
        color: body.color || '#3B82F6',
        userId: user.id,
      };

      const newEvent = await calendarDbService.createEvent(eventData);

      if (body.recurrence) {
        await calendarDbService.createRecurrenceRule({
          eventId: newEvent.id,
          ...body.recurrence,
          endDate: body.recurrence.endDate ? new Date(body.recurrence.endDate) : undefined,
        });
      }

      if (body.reminders && Array.isArray(body.reminders)) {
        for (const reminder of body.reminders) {
          if (reminder.reminderTime) {
            await calendarDbService.createReminder({
              eventId: newEvent.id,
              reminderTime: new Date(reminder.reminderTime),
              reminderType: reminder.reminderType || 'notification',
              status: 'pending'
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: newEvent,
        message: '创建事件成功'
      });
    } catch (error) {
      console.error('创建事件失败：', error);
      return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
  };
}

/**
 * 创建获取单个事件的处理器
 */
export function createGetEventByIdHandler(config: CalendarRouteConfig) {
  initDbService(config.db);
  return async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const user = await config.validateAuth(request);
      if (!user) {
        return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
      }

      const eventId = parseInt(params.id);
      if (isNaN(eventId)) {
        return NextResponse.json({ success: false, error: '事件ID无效' }, { status: 400 });
      }

      const event = await calendarDbService.getEventById(eventId);
      if (!event) {
        return NextResponse.json({ success: false, error: '事件不存在' }, { status: 404 });
      }

      if (event.userId !== user.id) {
        return NextResponse.json({ success: false, error: '无权访问此事件' }, { status: 403 });
      }

      const [recurrenceRule, reminders] = await Promise.all([
        calendarDbService.getRecurrenceRule(eventId),
        calendarDbService.getEventReminders(eventId)
      ]);

      return NextResponse.json({
        success: true,
        data: {
          ...event,
          recurrenceRule: recurrenceRule || undefined,
          reminders: reminders || []
        },
        message: '获取事件成功'
      });
    } catch (error) {
      console.error('获取事件失败：', error);
      return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
  };
}

/**
 * 创建更新事件的处理器
 */
export function createUpdateEventHandler(config: CalendarRouteConfig) {
  initDbService(config.db);
  return async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const user = await config.validateAuth(request);
      if (!user) {
        return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
      }

      const eventId = parseInt(params.id);
      if (isNaN(eventId)) {
        return NextResponse.json({ success: false, error: '事件ID无效' }, { status: 400 });
      }

      const existingEvent = await calendarDbService.getEventById(eventId);
      if (!existingEvent || existingEvent.userId !== user.id) {
        return NextResponse.json({ success: false, error: '事件不存在或无权修改' }, { status: 404 });
      }

      const body = await request.json();
      const updateData: any = {};

      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description;
      if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
      if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);
      if (body.allDay !== undefined) updateData.allDay = Boolean(body.allDay);
      if (body.location !== undefined) updateData.location = body.location;
      if (body.color !== undefined) updateData.color = body.color;

      const updatedEvent = await calendarDbService.updateEvent(eventId, updateData);

      if (body.recurrence !== undefined) {
        await calendarDbService.deleteRecurrenceRule(eventId);
        if (body.recurrence) {
          await calendarDbService.createRecurrenceRule({
            eventId,
            ...body.recurrence,
            endDate: body.recurrence.endDate ? new Date(body.recurrence.endDate) : undefined,
          });
        }
      }

      if (body.reminders !== undefined) {
        await calendarDbService.deleteEventReminders(eventId);
        if (Array.isArray(body.reminders)) {
          for (const reminder of body.reminders) {
            if (reminder.reminderTime) {
              await calendarDbService.createReminder({
                eventId,
                reminderTime: new Date(reminder.reminderTime),
                reminderType: reminder.reminderType || 'notification',
                status: 'pending'
              });
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: updatedEvent,
        message: '更新事件成功'
      });
    } catch (error) {
      console.error('更新事件失败：', error);
      return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
  };
}

/**
 * 创建删除事件的处理器
 */
export function createDeleteEventHandler(config: CalendarRouteConfig) {
  initDbService(config.db);
  return async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const user = await config.validateAuth(request);
      if (!user) {
        return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
      }

      const eventId = parseInt(params.id);
      if (isNaN(eventId)) {
        return NextResponse.json({ success: false, error: '事件ID无效' }, { status: 400 });
      }

      const existingEvent = await calendarDbService.getEventById(eventId);
      if (!existingEvent || existingEvent.userId !== user.id) {
        return NextResponse.json({ success: false, error: '事件不存在或无权删除' }, { status: 404 });
      }

      await calendarDbService.deleteEvent(eventId);

      return NextResponse.json({
        success: true,
        message: '删除事件成功'
      });
    } catch (error) {
      console.error('删除事件失败：', error);
      return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
  };
}

/**
 * 创建批量删除事件的处理器
 */
export function createBatchDeleteEventsHandler(config: CalendarRouteConfig) {
  initDbService(config.db);
  return async (request: NextRequest) => {
    try {
      const user = await config.validateAuth(request);
      if (!user) {
        return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
      }

      const body = await request.json();
      if (!body.eventIds || !Array.isArray(body.eventIds)) {
        return NextResponse.json({ success: false, error: '事件ID列表不能为空' }, { status: 400 });
      }

      const results = await Promise.all(
        body.eventIds.map(async (id: number) => {
          const event = await calendarDbService.getEventById(id);
          if (event && event.userId === user.id) {
            await calendarDbService.deleteEvent(id);
            return true;
          }
          return false;
        })
      );

      const deletedCount = results.filter(Boolean).length;

      return NextResponse.json({
        success: true,
        data: { deletedCount },
        message: `成功删除 ${deletedCount} 个事件`
      });
    } catch (error) {
      console.error('批量删除事件失败：', error);
      return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
  };
}

/**
 * 创建配置处理器的工厂
 */
export function createConfigHandler(config: CalendarRouteConfig) {
  initDbService(config.db);
  return {
    GET: async (request: NextRequest) => {
      try {
        const user = await config.validateAuth(request);
        if (!user) {
          return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
        }

        const dbConfig = await calendarDbService.getUserConfig(user.id);
        return NextResponse.json({
          success: true,
          data: dbConfig || {
            firstDayOfWeek: 1,
            workingHoursStart: '09:00',
            workingHoursEnd: '18:00',
            timeZone: 'Asia/Shanghai',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm',
            defaultView: 'month',
            defaultEventColor: '#3B82F6',
            weekends: true,
            eventColors: {}
          },
          message: '获取配置成功'
        });
      } catch (error) {
        console.error('获取配置失败：', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
      }
    },
    PUT: async (request: NextRequest) => {
      try {
        const user = await config.validateAuth(request);
        if (!user) {
          return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
        }

        const body = await request.json();
        const updatedConfig = await calendarDbService.upsertUserConfig(user.id, body);

        return NextResponse.json({
          success: true,
          data: updatedConfig,
          message: '更新配置成功'
        });
      } catch (error) {
        console.error('更新配置失败：', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
      }
    }
  };
}

