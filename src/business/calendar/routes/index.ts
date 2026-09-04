import { parseWireLocalISOString } from '../domain';
import {
  CalendarDbService,
  createCalendarDbService,
  DEFAULT_CALENDAR_CONFIG,
  type CalendarDrizzleDb,
} from '../server';

export type CalendarSessionUser = { id: string };

/** 用 Web Request，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突 */
export type CalendarRouteConfig = {
  db: CalendarDrizzleDb;
  getSessionUser: (request: Request) => Promise<CalendarSessionUser | null>;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function unauthorized() {
  return json({ success: false, error: '未授权访问' }, 401);
}

function createService(config: CalendarRouteConfig) {
  return createCalendarDbService(config.db);
}

async function resolveEventId(context: IdRouteContext): Promise<number | null> {
  const { id } = await context.params;
  const eventId = parseInt(id, 10);
  return Number.isNaN(eventId) ? null : eventId;
}

export function createListEventsHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const { searchParams } = new URL(request.url);
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (startDateStr) {
        startDate = parseWireLocalISOString(startDateStr);
        if (isNaN(startDate.getTime())) {
          return json({ success: false, error: '开始日期格式无效' }, 400);
        }
      }
      if (endDateStr) {
        endDate = parseWireLocalISOString(endDateStr);
        if (isNaN(endDate.getTime())) {
          return json({ success: false, error: '结束日期格式无效' }, 400);
        }
      }

      const events = await service.getAllEvents(user.id, startDate, endDate);
      return json({ success: true, data: events, message: '获取事件列表成功' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('获取事件失败：', message, error);
      return json({ success: false, error: '服务器内部错误', detail: message }, 500);
    }
  };
}

export function createCreateEventHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const body = await request.json();
      if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
        return json({ success: false, error: '事件标题不能为空' }, 400);
      }
      if (!body.startTime) return json({ success: false, error: '开始时间不能为空' }, 400);
      if (!body.endTime) return json({ success: false, error: '结束时间不能为空' }, 400);

      const startTime = parseWireLocalISOString(String(body.startTime));
      const endTime = parseWireLocalISOString(String(body.endTime));
      if (isNaN(startTime.getTime())) return json({ success: false, error: '开始时间格式无效' }, 400);
      if (isNaN(endTime.getTime())) return json({ success: false, error: '结束时间格式无效' }, 400);
      if (startTime.getTime() >= endTime.getTime()) {
        return json({ success: false, error: '结束时间必须晚于开始时间' }, 400);
      }

      const color = body.color || '#3B82F6';
      if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return json({ success: false, error: '颜色格式无效，请使用十六进制格式（如 #FF0000）' }, 400);
      }

      const newEvent = await service.createEvent({
        title: body.title.trim(),
        description: body.description || null,
        startTime,
        endTime,
        allDay: Boolean(body.allDay),
        location: body.location || null,
        color,
        userId: user.id,
      });

      if (body.recurrence) {
        try {
          await service.createRecurrenceRule({
            eventId: newEvent.id,
            ruleType: body.recurrence.ruleType || 'daily',
            interval: body.recurrence.interval || 1,
            endDate: body.recurrence.endDate ? new Date(body.recurrence.endDate) : undefined,
            count: body.recurrence.count || undefined,
            byWeekday: body.recurrence.byWeekday || undefined,
            byMonthday: body.recurrence.byMonthday || undefined,
            byMonth: body.recurrence.byMonth || undefined,
          });
        } catch (recurrenceError) {
          console.error('创建重复规则失败：', recurrenceError);
        }
      }

      if (body.reminders && Array.isArray(body.reminders)) {
        try {
          for (const reminder of body.reminders) {
            if (reminder.reminderTime) {
              await service.createReminder({
                eventId: newEvent.id,
                reminderTime: new Date(reminder.reminderTime),
                reminderType: reminder.reminderType || 'notification',
                status: 'pending',
              });
            }
          }
        } catch (reminderError) {
          console.error('创建提醒失败：', reminderError);
        }
      }

      return json({ success: true, data: newEvent, message: '创建事件成功' });
    } catch (error) {
      console.error('创建事件失败：', error);
      return json({ success: false, error: '服务器内部错误' }, 500);
    }
  };
}

export function createGetEventHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const eventId = await resolveEventId(context);
      if (eventId === null) return json({ success: false, error: '事件ID无效' }, 400);

      const event = await service.getEventById(eventId);
      if (!event) return json({ success: false, error: '事件不存在' }, 404);
      if (event.userId !== user.id) return json({ success: false, error: '无权访问此事件' }, 403);

      const [recurrenceRule, reminders] = await Promise.all([
        service.getRecurrenceRule(eventId),
        service.getEventReminders(eventId),
      ]);

      return json({
        success: true,
        data: {
          ...event,
          recurrenceRule: recurrenceRule || undefined,
          reminders: reminders || [],
        },
        message: '获取事件成功',
      });
    } catch (error) {
      console.error('获取事件失败：', error);
      return json({ success: false, error: '服务器内部错误' }, 500);
    }
  };
}

export function createUpdateEventHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const eventId = await resolveEventId(context);
      if (eventId === null) return json({ success: false, error: '事件ID无效' }, 400);

      const existingEvent = await service.getEventById(eventId);
      if (!existingEvent) return json({ success: false, error: '事件不存在' }, 404);
      if (existingEvent.userId !== user.id) {
        return json({ success: false, error: '无权修改此事件' }, 403);
      }

      const body = await request.json();
      const updateData: Record<string, unknown> = {};

      if (body.title !== undefined) {
        if (typeof body.title !== 'string' || body.title.trim() === '') {
          return json({ success: false, error: '事件标题不能为空' }, 400);
        }
        updateData.title = body.title.trim();
      }
      if (body.description !== undefined) updateData.description = body.description;
      if (body.startTime !== undefined) {
        const startTime = parseWireLocalISOString(String(body.startTime));
        if (isNaN(startTime.getTime())) {
          return json({ success: false, error: '开始时间格式无效' }, 400);
        }
        updateData.startTime = startTime;
      }
      if (body.endTime !== undefined) {
        const endTime = parseWireLocalISOString(String(body.endTime));
        if (isNaN(endTime.getTime())) {
          return json({ success: false, error: '结束时间格式无效' }, 400);
        }
        updateData.endTime = endTime;
      }

      const finalStartTime = (updateData.startTime as Date | undefined) || existingEvent.startTime;
      const finalEndTime = (updateData.endTime as Date | undefined) || existingEvent.endTime;
      if (finalStartTime.getTime() >= finalEndTime.getTime()) {
        return json({ success: false, error: '结束时间必须晚于开始时间' }, 400);
      }

      if (body.allDay !== undefined) updateData.allDay = Boolean(body.allDay);
      if (body.location !== undefined) updateData.location = body.location;
      if (body.color !== undefined) {
        if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
          return json({ success: false, error: '颜色格式无效，请使用十六进制格式（如 #FF0000）' }, 400);
        }
        updateData.color = body.color;
      }

      const updatedEvent = await service.updateEvent(eventId, updateData as any);

      if (body.recurrence !== undefined) {
        await service.deleteRecurrenceRule(eventId);
        if (body.recurrence) {
          try {
            await service.createRecurrenceRule({
              eventId,
              ruleType: body.recurrence.ruleType || 'daily',
              interval: body.recurrence.interval || 1,
              endDate: body.recurrence.endDate ? new Date(body.recurrence.endDate) : undefined,
              count: body.recurrence.count || undefined,
              byWeekday: body.recurrence.byWeekday || undefined,
              byMonthday: body.recurrence.byMonthday || undefined,
              byMonth: body.recurrence.byMonth || undefined,
            });
          } catch (recurrenceError) {
            console.error('更新重复规则失败：', recurrenceError);
          }
        }
      }

      if (body.reminders !== undefined) {
        await service.deleteEventReminders(eventId);
        if (Array.isArray(body.reminders)) {
          try {
            for (const reminder of body.reminders) {
              if (reminder.reminderTime) {
                await service.createReminder({
                  eventId,
                  reminderTime: new Date(reminder.reminderTime),
                  reminderType: reminder.reminderType || 'notification',
                  status: 'pending',
                });
              }
            }
          } catch (reminderError) {
            console.error('更新提醒失败：', reminderError);
          }
        }
      }

      return json({ success: true, data: updatedEvent, message: '更新事件成功' });
    } catch (error) {
      console.error('更新事件失败：', error);
      return json({ success: false, error: '服务器内部错误' }, 500);
    }
  };
}

export function createDeleteEventHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const eventId = await resolveEventId(context);
      if (eventId === null) return json({ success: false, error: '事件ID无效' }, 400);

      const existingEvent = await service.getEventById(eventId);
      if (!existingEvent) return json({ success: false, error: '事件不存在' }, 404);
      if (existingEvent.userId !== user.id) {
        return json({ success: false, error: '无权删除此事件' }, 403);
      }

      await service.deleteEvent(eventId);
      return json({ success: true, message: '删除事件成功' });
    } catch (error) {
      console.error('删除事件失败：', error);
      return json({ success: false, error: '服务器内部错误' }, 500);
    }
  };
}

export function createBatchDeleteEventsHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const body = await request.json();
      if (!body.eventIds || !Array.isArray(body.eventIds) || body.eventIds.length === 0) {
        return json({ success: false, error: '事件ID列表不能为空' }, 400);
      }

      const eventIds = body.eventIds.filter(
        (id: unknown) => typeof id === 'number' && !Number.isNaN(id),
      );
      if (eventIds.length !== body.eventIds.length) {
        return json({ success: false, error: '事件ID格式无效' }, 400);
      }

      const existingEvents = await Promise.all(
        eventIds.map(async (id: number) => {
          const event = await service.getEventById(id);
          return event && event.userId === user.id ? event : null;
        }),
      );
      const validEventIds = existingEvents
        .filter((event): event is NonNullable<typeof event> => event !== null)
        .map((event) => event.id);

      if (validEventIds.length === 0) {
        return json({ success: false, error: '没有找到有效的事件或无权限删除' }, 404);
      }

      await Promise.all(validEventIds.map((id) => service.deleteEvent(id)));
      return json({
        success: true,
        data: {
          deletedCount: validEventIds.length,
          deletedIds: validEventIds,
          skippedCount: eventIds.length - validEventIds.length,
        },
        message: `成功删除 ${validEventIds.length} 个事件`,
      });
    } catch (error) {
      console.error('批量删除事件失败：', error);
      return json({ success: false, error: '服务器内部错误' }, 500);
    }
  };
}

export function createGetCalendarConfigHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const row = await service.getUserConfig(user.id);
      if (!row) {
        return json({
          success: true,
          data: {
            firstDayOfWeek: DEFAULT_CALENDAR_CONFIG.firstDayOfWeek,
            workingHoursStart: DEFAULT_CALENDAR_CONFIG.workingHours.start,
            workingHoursEnd: DEFAULT_CALENDAR_CONFIG.workingHours.end,
            timeZone: DEFAULT_CALENDAR_CONFIG.timeZone,
            dateFormat: DEFAULT_CALENDAR_CONFIG.dateFormat,
            timeFormat: DEFAULT_CALENDAR_CONFIG.timeFormat,
            defaultView: DEFAULT_CALENDAR_CONFIG.defaultView,
            defaultEventColor: DEFAULT_CALENDAR_CONFIG.defaultEventColor,
            weekends: DEFAULT_CALENDAR_CONFIG.weekends,
            eventColors: DEFAULT_CALENDAR_CONFIG.eventColors,
          },
          message: '获取默认配置成功',
        });
      }

      return json({
        success: true,
        data: {
          firstDayOfWeek: row.firstDayOfWeek,
          workingHours: { start: row.workingHoursStart, end: row.workingHoursEnd },
          timeZone: row.timeZone,
          dateFormat: row.dateFormat,
          timeFormat: row.timeFormat,
          defaultView: row.defaultView,
          defaultEventColor: row.defaultEventColor,
          weekends: row.weekends,
          eventColors: row.eventColors || DEFAULT_CALENDAR_CONFIG.eventColors,
        },
        message: '获取配置成功',
      });
    } catch (error) {
      console.error('获取配置失败：', error);
      return json({ success: false, error: '服务器内部错误' }, 500);
    }
  };
}

export function createUpsertCalendarConfigHandler(config: CalendarRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const body = await request.json();
      const updateData: Record<string, unknown> = {};

      if (body.firstDayOfWeek !== undefined) {
        const firstDayOfWeek = Number(body.firstDayOfWeek);
        if (Number.isNaN(firstDayOfWeek) || firstDayOfWeek < 0 || firstDayOfWeek > 6) {
          return json({ success: false, error: '一周开始日必须是0-6之间的数字' }, 400);
        }
        updateData.firstDayOfWeek = firstDayOfWeek;
      }

      if (body.workingHours !== undefined) {
        const { start, end } = body.workingHours;
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (start && !timeRegex.test(start)) {
          return json({ success: false, error: '工作开始时间格式无效，请使用HH:mm格式' }, 400);
        }
        if (end && !timeRegex.test(end)) {
          return json({ success: false, error: '工作结束时间格式无效，请使用HH:mm格式' }, 400);
        }
        if (start) updateData.workingHoursStart = start;
        if (end) updateData.workingHoursEnd = end;
      }

      if (body.timeZone !== undefined) updateData.timeZone = body.timeZone;
      if (body.dateFormat !== undefined) updateData.dateFormat = body.dateFormat;
      if (body.timeFormat !== undefined) updateData.timeFormat = body.timeFormat;

      if (body.defaultView !== undefined) {
        const validViews = ['month', 'week', 'day', 'agenda'];
        if (!validViews.includes(body.defaultView)) {
          return json({ success: false, error: '默认视图类型无效' }, 400);
        }
        updateData.defaultView = body.defaultView;
      }

      if (body.defaultEventColor !== undefined) {
        if (
          body.defaultEventColor &&
          !/^#[0-9A-Fa-f]{6}$/.test(body.defaultEventColor)
        ) {
          return json(
            { success: false, error: '默认事件颜色格式无效，请使用十六进制格式（如 #FF0000）' },
            400,
          );
        }
        updateData.defaultEventColor = body.defaultEventColor;
      }

      if (body.weekends !== undefined) updateData.weekends = Boolean(body.weekends);

      if (body.eventColors !== undefined) {
        if (typeof body.eventColors === 'object' && body.eventColors !== null) {
          for (const [key, color] of Object.entries(body.eventColors)) {
            if (typeof color === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
              return json(
                { success: false, error: `事件颜色 ${key} 格式无效，请使用十六进制格式` },
                400,
              );
            }
          }
          updateData.eventColors = body.eventColors;
        }
      }

      const updatedConfig = await service.upsertUserConfig(user.id, updateData as any);
      return json({
        success: true,
        data: {
          firstDayOfWeek: updatedConfig.firstDayOfWeek,
          workingHours: {
            start: updatedConfig.workingHoursStart,
            end: updatedConfig.workingHoursEnd,
          },
          timeZone: updatedConfig.timeZone,
          dateFormat: updatedConfig.dateFormat,
          timeFormat: updatedConfig.timeFormat,
          defaultView: updatedConfig.defaultView,
          defaultEventColor: updatedConfig.defaultEventColor,
          weekends: updatedConfig.weekends,
          eventColors: updatedConfig.eventColors || {},
        },
        message: '更新配置成功',
      });
    } catch (error) {
      console.error('更新配置失败：', error);
      return json({ success: false, error: '服务器内部错误' }, 500);
    }
  };
}

/** Re-export service type for host typing */
export type { CalendarDbService, CalendarDrizzleDb } from '../server';
