import { NextRequest, NextResponse } from 'next/server';
import { createBatchDeleteEventsHandler } from 'sa2kit/calendar/routes';
import { calendarMockDb } from '@/lib/calendar-mock-db';
import { db, isDatabaseAvailable } from '@/lib/db';

const useFactoryHandlers = isDatabaseAvailable() && Boolean(db);

const routeConfig = {
  db: db ?? undefined,
  validateAuth: async (_request: NextRequest) => ({ id: 1 }),
};

const batchDeleteEventsHandler = createBatchDeleteEventsHandler(routeConfig);

export async function DELETE(request: NextRequest) {
  if (useFactoryHandlers) {
    return batchDeleteEventsHandler(request);
  }

  const body = await request.json();
  const { eventIds } = body;
  if (!Array.isArray(eventIds)) {
    return NextResponse.json({ success: false, error: '无效的 ID 列表' }, { status: 400 });
  }
  calendarMockDb.batchDelete(eventIds);
  return NextResponse.json({ success: true, message: '批量删除成功' });
}
