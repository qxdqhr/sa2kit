import { NextRequest } from 'next/server';
import { calendarDbService } from '../../server';
import { validateApiAuth } from '../../../auth/server';

/**
 * 获取用户的日历配置
 * GET /api/calendar/config
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await validateApiAuth(request);
    if (!user) {
      return Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const config = await calendarDbService.getUserConfig(user.id);
    
    // 如果用户没有配置，返回默认配置
    if (!config) {
      const defaultConfig = {
        firstDayOfWeek: 1, // 周一开始
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        timeZone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        defaultView: 'month',
        defaultEventColor: '#3B82F6',
        weekends: true,
        eventColors: {
          blue: '#3B82F6',
          green: '#10B981',
          purple: '#8B5CF6',
          red: '#EF4444',
          yellow: '#F59E0B',
          pink: '#EC4899',
          indigo: '#6366F1',
          gray: '#6B7280'
        }
      };

      return Response.json({
        success: true,
        data: defaultConfig,
        message: '获取默认配置成功'
      });
    }

    // 转换数据库格式为前端格式
    const frontendConfig = {
      firstDayOfWeek: config.firstDayOfWeek,
      workingHours: {
        start: config.workingHoursStart,
        end: config.workingHoursEnd
      },
      timeZone: config.timeZone,
      dateFormat: config.dateFormat,
      timeFormat: config.timeFormat,
      defaultView: config.defaultView,
      defaultEventColor: config.defaultEventColor,
      weekends: config.weekends,
      eventColors: config.eventColors || {
        blue: '#3B82F6',
        green: '#10B981',
        purple: '#8B5CF6',
        red: '#EF4444',
        yellow: '#F59E0B',
        pink: '#EC4899',
        indigo: '#6366F1',
        gray: '#6B7280'
      }
    };

    return Response.json({
      success: true,
      data: frontendConfig,
      message: '获取配置成功'
    });

  } catch (error) {
    console.error('获取配置失败：', error);
    return Response.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 更新用户的日历配置
 * PUT /api/calendar/config
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await validateApiAuth(request);
    if (!user) {
      return Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // 验证和处理配置字段
    if (body.firstDayOfWeek !== undefined) {
      const firstDayOfWeek = Number(body.firstDayOfWeek);
      if (isNaN(firstDayOfWeek) || firstDayOfWeek < 0 || firstDayOfWeek > 6) {
        return Response.json(
          { success: false, error: '一周开始日必须是0-6之间的数字' },
          { status: 400 }
        );
      }
      updateData.firstDayOfWeek = firstDayOfWeek;
    }

    if (body.workingHours !== undefined) {
      const { start, end } = body.workingHours;
      
      // 验证时间格式
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (start && !timeRegex.test(start)) {
        return Response.json(
          { success: false, error: '工作开始时间格式无效，请使用HH:mm格式' },
          { status: 400 }
        );
      }
      
      if (end && !timeRegex.test(end)) {
        return Response.json(
          { success: false, error: '工作结束时间格式无效，请使用HH:mm格式' },
          { status: 400 }
        );
      }
      
      if (start) updateData.workingHoursStart = start;
      if (end) updateData.workingHoursEnd = end;
    }

    if (body.timeZone !== undefined) {
      updateData.timeZone = body.timeZone;
    }

    if (body.dateFormat !== undefined) {
      updateData.dateFormat = body.dateFormat;
    }

    if (body.timeFormat !== undefined) {
      updateData.timeFormat = body.timeFormat;
    }

    if (body.defaultView !== undefined) {
      const validViews = ['month', 'week', 'day', 'agenda'];
      if (!validViews.includes(body.defaultView)) {
        return Response.json(
          { success: false, error: '默认视图类型无效' },
          { status: 400 }
        );
      }
      updateData.defaultView = body.defaultView;
    }

    if (body.defaultEventColor !== undefined) {
      if (body.defaultEventColor && !/^#[0-9A-Fa-f]{6}$/.test(body.defaultEventColor)) {
        return Response.json(
          { success: false, error: '默认事件颜色格式无效，请使用十六进制格式（如 #FF0000）' },
          { status: 400 }
        );
      }
      updateData.defaultEventColor = body.defaultEventColor;
    }

    if (body.weekends !== undefined) {
      updateData.weekends = Boolean(body.weekends);
    }

    if (body.eventColors !== undefined) {
      // 验证颜色对象
      if (typeof body.eventColors === 'object' && body.eventColors !== null) {
        for (const [key, color] of Object.entries(body.eventColors)) {
          if (typeof color === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return Response.json(
              { success: false, error: '事件颜色 ' + (key) + ' 格式无效，请使用十六进制格式' },
              { status: 400 }
            );
          }
        }
        updateData.eventColors = body.eventColors;
      }
    }

    // 更新配置
    const updatedConfig = await calendarDbService.upsertUserConfig(user.id, updateData);

    // 转换为前端格式
    const frontendConfig = {
      firstDayOfWeek: updatedConfig.firstDayOfWeek,
      workingHours: {
        start: updatedConfig.workingHoursStart,
        end: updatedConfig.workingHoursEnd
      },
      timeZone: updatedConfig.timeZone,
      dateFormat: updatedConfig.dateFormat,
      timeFormat: updatedConfig.timeFormat,
      defaultView: updatedConfig.defaultView,
      defaultEventColor: updatedConfig.defaultEventColor,
      weekends: updatedConfig.weekends,
      eventColors: updatedConfig.eventColors || {}
    };

    return Response.json({
      success: true,
      data: frontendConfig,
      message: '更新配置成功'
    });

  } catch (error) {
    console.error('更新配置失败：', error);
    return Response.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 