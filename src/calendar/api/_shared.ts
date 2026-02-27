import type { NextRequest } from 'next/server';
import { validateApiAuthNumeric } from '../../auth/server';
import { calendarDbService } from '../server';

export async function requireCalendarUser(request: NextRequest) {
  return validateApiAuthNumeric(request);
}

export function ensureCalendarDbReady() {
  if (calendarDbService.isConfigured()) return null;

  return Response.json(
    {
      success: false,
      error:
        'Calendar DB is not initialized. Please call calendarDbService.setDb(db) or use create*Handler from sa2kit/calendar/routes with db injection.',
    },
    { status: 500 },
  );
}
