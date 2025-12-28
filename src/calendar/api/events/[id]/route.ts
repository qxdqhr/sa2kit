import { NextRequest } from 'next/server';
import { calendarDbService } from '../../../server';
import { validateApiAuth } from '../../../../auth/server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * 获取单个事件
 * GET /api/calendar/events/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 验证用户身份
    const user = await validateApiAuth(request);
    if (!user) {
      return Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const eventId = parseInt(params.id);
    if (isNaN(eventId)) {
      return Response.json(
        { success: false, error: '事件ID无效' },
        { status: 400 }
      );
    }

    const event = await calendarDbService.getEventById(eventId);
    if (!event) {
      return Response.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }

    // 检查用户权限
    if (event.userId !== user.id) {
      return Response.json(
        { success: false, error: '无权访问此事件' },
        { status: 403 }
      );
    }

    // 获取关联数据
    const [recurrenceRule, reminders] = await Promise.all([
      calendarDbService.getRecurrenceRule(eventId),
      calendarDbService.getEventReminders(eventId)
    ]);

    const eventWithDetails = {
      ...event,
      recurrenceRule: recurrenceRule || undefined,
      reminders: reminders || []
    };

    return Response.json({
      success: true,
      data: eventWithDetails,
      message: '获取事件成功'
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
 * 更新事件
 * PUT /api/calendar/events/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 验证用户身份
    const user = await validateApiAuth(request);
    if (!user) {
      return Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const eventId = parseInt(params.id);
    if (isNaN(eventId)) {
      return Response.json(
        { success: false, error: '事件ID无效' },
        { status: 400 }
      );
    }

    // 检查事件是否存在
    const existingEvent = await calendarDbService.getEventById(eventId);
    if (!existingEvent) {
      return Response.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }

    // 检查用户权限
    if (existingEvent.userId !== user.id) {
      return Response.json(
        { success: false, error: '无权修改此事件' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // 验证和处理更新字段
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
        return Response.json(
          { success: false, error: '事件标题不能为空' },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.startTime !== undefined) {
      const startTime = new Date(body.startTime);
      if (isNaN(startTime.getTime())) {
        return Response.json(
          { success: false, error: '开始时间格式无效' },
          { status: 400 }
        );
      }
      updateData.startTime = startTime;
    }

    if (body.endTime !== undefined) {
      const endTime = new Date(body.endTime);
      if (isNaN(endTime.getTime())) {
        return Response.json(
          { success: false, error: '结束时间格式无效' },
          { status: 400 }
        );
      }
      updateData.endTime = endTime;
    }

    // 验证时间逻辑
    const finalStartTime = updateData.startTime || existingEvent.startTime;
    const finalEndTime = updateData.endTime || existingEvent.endTime;
    
    if (finalStartTime.getTime() >= finalEndTime.getTime()) {
      return Response.json(
        { success: false, error: '结束时间必须晚于开始时间' },
        { status: 400 }
      );
    }

    if (body.allDay !== undefined) {
      updateData.allDay = Boolean(body.allDay);
    }

    if (body.location !== undefined) {
      updateData.location = body.location;
    }

    if (body.color !== undefined) {
      if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
        return Response.json(
          { success: false, error: '颜色格式无效，请使用十六进制格式（如 #FF0000）' },
          { status: 400 }
        );
      }
      updateData.color = body.color;
    }

    // 更新事件
    const updatedEvent = await calendarDbService.updateEvent(eventId, updateData);

    // 处理重复规则更新
    if (body.recurrence !== undefined) {
      // 先删除现有的重复规则
      await calendarDbService.deleteRecurrenceRule(eventId);
      
      // 如果提供了新的重复规则，创建它
      if (body.recurrence) {
        try {
          await calendarDbService.createRecurrenceRule({
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

    // 处理提醒更新
    if (body.reminders !== undefined) {
      // 先删除现有的提醒
      await calendarDbService.deleteEventReminders(eventId);
      
      // 创建新的提醒
      if (Array.isArray(body.reminders)) {
        try {
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
        } catch (reminderError) {
          console.error('更新提醒失败：', reminderError);
        }
      }
    }

    return Response.json({
      success: true,
      data: updatedEvent,
      message: '更新事件成功'
    });

  } catch (error) {
    console.error('更新事件失败：', error);
    return Response.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 删除事件
 * DELETE /api/calendar/events/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 验证用户身份
    const user = await validateApiAuth(request);
    if (!user) {
      return Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const eventId = parseInt(params.id);
    if (isNaN(eventId)) {
      return Response.json(
        { success: false, error: '事件ID无效' },
        { status: 400 }
      );
    }

    // 检查事件是否存在
    const existingEvent = await calendarDbService.getEventById(eventId);
    if (!existingEvent) {
      return Response.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }

    // 检查用户权限
    if (existingEvent.userId !== user.id) {
      return Response.json(
        { success: false, error: '无权删除此事件' },
        { status: 403 }
      );
    }

    // 删除事件（级联删除会自动删除相关的重复规则和提醒）
    await calendarDbService.deleteEvent(eventId);

    return Response.json({
      success: true,
      message: '删除事件成功'
    });

  } catch (error) {
    console.error('删除事件失败：', error);
    return Response.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 