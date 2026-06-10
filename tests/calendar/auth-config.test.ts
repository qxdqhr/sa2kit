import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import {
  configureCalendarApiAuth,
  configureCalendarApiWithBetterAuth,
  resetCalendarApiAuth,
} from '../../src/calendar/api/auth-config';
import { createDefaultCalendarRouteConfig } from '../../src/calendar/api/_shared';
import { createSa2kitAuth } from '../../src/common/auth/server/create-auth';

describe('calendar api auth-config', () => {
  beforeEach(() => {
    resetCalendarApiAuth();
  });

  it('createDefaultCalendarRouteConfig throws when auth not configured', () => {
    expect(() => createDefaultCalendarRouteConfig()).toThrow(/未配置 auth/);
  });

  it('configureCalendarApiAuth allows route config creation', async () => {
    configureCalendarApiAuth(async () => ({ id: 42 }));
    const config = createDefaultCalendarRouteConfig();
    const user = await config.validateAuth({} as NextRequest);
    expect(user).toEqual({ id: 42 });
  });

  it('configureCalendarApiWithBetterAuth wires getSessionUserNumeric', async () => {
    const auth = createSa2kitAuth({
      db: {} as never,
      baseURL: 'http://localhost:3000',
      secret: 'x'.repeat(32),
      trustedOrigins: ['http://localhost:3000'],
    });

    const getSessionSpy = vi.spyOn(auth.api, 'getSession').mockResolvedValue({
      user: {
        id: '7',
        email: 'u@test.com',
        name: 'U',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {} as never,
    });

    configureCalendarApiWithBetterAuth(auth);
    const config = createDefaultCalendarRouteConfig();
    const user = await config.validateAuth(new Request('http://localhost') as unknown as NextRequest);

    expect(getSessionSpy).toHaveBeenCalled();
    expect(user).toEqual({
      id: 7,
      email: 'u@test.com',
      name: 'U',
      role: undefined,
      phoneNumber: null,
    });
  });
});
