import { NextRequest, NextResponse } from 'next/server';
import {
  createDeleteEventHandler,
  createGetEventByIdHandler,
  createUpdateEventHandler,
} from 'sa2kit/calendar/routes';
import { calendarMockDb } from '@/lib/calendar-mock-db';
import { db, isDatabaseAvailable } from '@/lib/db';

const useFactoryHandlers = isDatabaseAvailable() && Boolean(db);

const routeConfig = {
  db: db ?? undefined,
  validateAuth: async (_request: NextRequest) => ({ id: 1 }),
};

const getEventByIdHandler = createGetEventByIdHandler(routeConfig);
const updateEventHandler = createUpdateEventHandler(routeConfig);
const deleteEventHandler = createDeleteEventHandler(routeConfig);

export async function GET(
  request: NextRequest,
  context: { params: { id: string } },
) {
  if (useFactoryHandlers) {
    return getEventByIdHandler(request, context);
  }

  const event = calendarMockDb.getEvent(parseInt(context.params.id, 10));
  if (!event) {
    return NextResponse.json({ success: false, error: '未找到事件' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: event });
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } },
) {
  if (useFactoryHandlers) {
    return updateEventHandler(request, context);
  }

  const body = await request.json();
  const updatedEvent = calendarMockDb.updateEvent(parseInt(context.params.id, 10), body);
  if (!updatedEvent) {
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: updatedEvent });
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } },
) {
  if (useFactoryHandlers) {
    return deleteEventHandler(request, context);
  }

  calendarMockDb.deleteEvent(parseInt(context.params.id, 10));
  return NextResponse.json({ success: true, message: '删除成功' });
}
