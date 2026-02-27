import { NextRequest, NextResponse } from 'next/server';
import { createConfigHandler } from 'sa2kit/calendar/routes';
import { db, isDatabaseAvailable } from '@/lib/db';

const useFactoryHandlers = isDatabaseAvailable() && Boolean(db);

const routeConfig = {
  db: db ?? undefined,
  validateAuth: async (_request: NextRequest) => ({ id: 1 }),
};

const configHandlers = createConfigHandler(routeConfig);

const mockConfig = {
  firstDayOfWeek: 1,
  workingHours: {
    start: '09:00',
    end: '18:00',
  },
  timeZone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  defaultView: 'month',
  defaultEventColor: '#3B82F6',
  weekends: true,
  eventColors: {
    blue: '#3B82F6',
    green: '#10B981',
  },
};

export async function GET(request: NextRequest) {
  if (useFactoryHandlers) {
    return configHandlers.GET(request);
  }

  return NextResponse.json({ success: true, data: mockConfig });
}

export async function PUT(request: NextRequest) {
  if (useFactoryHandlers) {
    return configHandlers.PUT(request);
  }

  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: {
      ...mockConfig,
      ...body,
      workingHours: {
        ...mockConfig.workingHours,
        ...(body.workingHours || {}),
      },
    },
  });
}
