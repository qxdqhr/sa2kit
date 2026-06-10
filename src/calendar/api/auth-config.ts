import type { NextRequest } from 'next/server';
import { calendarDbService } from '../db/calendarDbService';
import type { Sa2kitAuthInstance } from '../../common/auth/server/types';
import { createSessionValidator } from '../../common/auth/server/session';

export type CalendarAuthValidator = (
  request: NextRequest,
) => Promise<{ id: number } | null>;

let configuredValidator: CalendarAuthValidator | null = null;

/**
 * 注入 calendar API 路由使用的 session 校验（应用启动时调用一次）
 */
export function configureCalendarApiAuth(validateAuth: CalendarAuthValidator): void {
  configuredValidator = validateAuth;
}

/** 重置（测试用） */
export function resetCalendarApiAuth(): void {
  configuredValidator = null;
}

export function resolveCalendarAuthValidator(
  validateAuth?: CalendarAuthValidator,
): CalendarAuthValidator {
  const validator = validateAuth ?? configuredValidator;
  if (!validator) {
    throw new Error(
      'Calendar API 未配置 auth：请在应用启动时调用 configureCalendarApiAuth(validateAuth)，' +
        '或 configureCalendarApiWithBetterAuth(auth)，或在 createDefaultCalendarRouteConfig(validateAuth) 中显式传入。',
    );
  }
  return validator;
}

/**
 * 使用 Better Auth session 一键配置 calendar API
 */
export function configureCalendarApiWithBetterAuth(
  auth: Sa2kitAuthInstance,
  options?: { db?: unknown },
): void {
  const { getSessionUserNumeric } = createSessionValidator(auth);
  configureCalendarApiAuth((request) => getSessionUserNumeric(request));
  if (options?.db) {
    calendarDbService.setDb(options.db);
  }
}
