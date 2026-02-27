import { NextRequest } from 'next/server';
import { calendarDbService } from '../../server';
import { ensureCalendarDbReady, requireCalendarUser } from '../_shared';

/**
 * 获取用户的日历事件
 * GET /api/calendar/events?startDate=2024-01-01&endDate=2024-01-31
 */
export async function GET(request: NextRequest) {
  try {
    const dbError = ensureCalendarDbReady();
    if (dbError) return dbError;

    const user = await requireCalendarUser(request);
    if (!user) {
      return Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return Response.json(
          { success: false, error: '开始日期格式无效' },
          { status: 400 }
        );
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        return Response.json(
          { success: false, error: '结束日期格式无效' },
          { status: 400 }
        );
      }
    }

    const events = await calendarDbService.getAllEvents(
      user.id,
      startDate,
      endDate
    );

    return Response.json({
      success: true,
      data: events,
      message: '获取事件列表成功'
    });

  } catch (error) {
    console.error('获取事件失败：', error);
    return Response.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 创建新的日历事件
 * POST /api/calendar/events
 */
export async function POST(request: NextRequest) {
  try {
    const dbError = ensureCalendarDbReady();
    if (dbError) return dbError;

    const user = await requireCalendarUser(request);
    if (!user) {
      return Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 验证必需字段
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return Response.json(
        { success: false, error: '事件标题不能为空' },
        { status: 400 }
      );
    }

    if (!body.startTime) {
      return Response.json(
        { success: false, error: '开始时间不能为空' },
        { status: 400 }
      );
    }

    if (!body.endTime) {
      return Response.json(
        { success: false, error: '结束时间不能为空' },
        { status: 400 }
      );
    }

    // 解析和验证时间
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (isNaN(startTime.getTime())) {
      return Response.json(
        { success: false, error: '开始时间格式无效' },
        { status: 400 }
      );
    }

    if (isNaN(endTime.getTime())) {
      return Response.json(
        { success: false, error: '结束时间格式无效' },
        { status: 400 }
      );
    }

    if (startTime.getTime() >= endTime.getTime()) {
      return Response.json(
        { success: false, error: '结束时间必须晚于开始时间' },
        { status: 400 }
      );
    }

    // 准备事件数据
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

    // 验证颜色格式
    if (eventData.color && !/^#[0-9A-Fa-f]{6}$/.test(eventData.color)) {
      return Response.json(
        { success: false, error: '颜色格式无效，请使用十六进制格式（如 #FF0000）' },
        { status: 400 }
      );
    }

    // 创建事件
    const newEvent = await calendarDbService.createEvent(eventData);

    // 如果有重复规则，创建重复规则
    if (body.recurrence) {
      try {
        await calendarDbService.createRecurrenceRule({
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
        // 重复规则创建失败不影响事件创建
      }
    }

    // 如果有提醒，创建提醒
    if (body.reminders && Array.isArray(body.reminders)) {
      try {
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
      } catch (reminderError) {
        console.error('创建提醒失败：', reminderError);
        // 提醒创建失败不影响事件创建
      }
    }

    return Response.json({
      success: true,
      data: newEvent,
      message: '创建事件成功'
    });

  } catch (error) {
    console.error('创建事件失败：', error);
    return Response.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 