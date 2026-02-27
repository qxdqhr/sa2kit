import { NextRequest } from 'next/server';
import { calendarDbService } from '../../../server';
import { ensureCalendarDbReady, requireCalendarUser } from '../../_shared';

/**
 * 批量删除日历事件
 * DELETE /api/calendar/events/batchDelete
 */
export async function DELETE(request: NextRequest) {
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
    
    // 验证请求参数
    if (!body.eventIds || !Array.isArray(body.eventIds) || body.eventIds.length === 0) {
      return Response.json(
        { success: false, error: '事件ID列表不能为空' },
        { status: 400 }
      );
    }

    // 验证所有ID都是数字
    const eventIds = body.eventIds.filter((id: any) => typeof id === 'number' && !isNaN(id));
    if (eventIds.length !== body.eventIds.length) {
      return Response.json(
        { success: false, error: '事件ID格式无效' },
        { status: 400 }
      );
    }

    // 检查事件是否存在且属于当前用户
    const existingEvents = await Promise.all(
      eventIds.map(async (id: number) => {
        const event = await calendarDbService.getEventById(id);
        return event && event.userId === user.id ? event : null;
      })
    );

    const validEvents = existingEvents.filter(event => event !== null);
    const validEventIds = validEvents.map(event => event!.id);

    if (validEventIds.length === 0) {
      return Response.json(
        { success: false, error: '没有找到有效的事件或无权限删除' },
        { status: 404 }
      );
    }

    // 批量删除事件
    const deletePromises = validEventIds.map(id => calendarDbService.deleteEvent(id));
    await Promise.all(deletePromises);

    return Response.json({
      success: true,
      data: {
        deletedCount: validEventIds.length,
        deletedIds: validEventIds,
        skippedCount: eventIds.length - validEventIds.length
      },
      message: '成功删除 ' + (validEventIds.length) + ' 个事件'
    });

  } catch (error) {
    console.error('批量删除事件失败：', error);
    return Response.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 