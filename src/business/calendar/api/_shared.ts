import type { NextRequest } from 'next/server';
import { calendarDbService } from '../db/calendarDbService';
import type { CalendarRouteConfig } from '../routes';
import {
  resolveCalendarAuthValidator,
  type CalendarAuthValidator,
} from './auth-config';

export {
  configureCalendarApiAuth,
  configureCalendarApiWithBetterAuth,
  resetCalendarApiAuth,
  type CalendarAuthValidator,
} from './auth-config';

/**
 * 创建 calendar 路由所需的 validateAuth（由 Better Auth session 注入）
 *
 * @example
 * ```ts
 * configureCalendarApiWithBetterAuth(auth, { db });
 * const routeConfig = createDefaultCalendarRouteConfig();
 * export const GET = createGetEventsHandler(routeConfig);
 * ```
 */
export function createCalendarAuthRequirement(
  validateAuth: CalendarAuthValidator,
): CalendarAuthValidator {
  return validateAuth;
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

export function createDefaultCalendarRouteConfig(
  validateAuth?: CalendarAuthValidator,
): CalendarRouteConfig {
  return {
    validateAuth: resolveCalendarAuthValidator(validateAuth),
  };
}

export function withCalendarDbGuard<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    const dbError = ensureCalendarDbReady();
    if (dbError) return dbError;
    return handler(...args);
  };
}
