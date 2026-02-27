import { NextRequest, NextResponse } from 'next/server';
import {
  createCreateEventHandler,
  createGetEventsHandler,
} from 'sa2kit/calendar/routes';
import { calendarMockDb } from '@/lib/calendar-mock-db';
import { db, isDatabaseAvailable } from '@/lib/db';

const useFactoryHandlers = isDatabaseAvailable() && Boolean(db);

const routeConfig = {
  db: db ?? undefined,
  validateAuth: async (_request: NextRequest) => ({ id: 1 }),
};

const getEventsHandler = createGetEventsHandler(routeConfig);
const createEventHandler = createCreateEventHandler(routeConfig);

export async function GET(request: NextRequest) {
  if (useFactoryHandlers) {
    return getEventsHandler(request);
  }

  const events = calendarMockDb.getEvents(1);
  return NextResponse.json({ success: true, data: events });
}

export async function POST(request: NextRequest) {
  if (useFactoryHandlers) {
    return createEventHandler(request);
  }

  const body = await request.json();
  const newEvent = calendarMockDb.addEvent({ ...body, userId: 1 });
  return NextResponse.json({ success: true, data: newEvent });
}
