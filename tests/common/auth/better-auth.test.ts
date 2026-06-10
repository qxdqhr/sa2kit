import { describe, expect, it } from 'vitest';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createSa2kitAuth } from '../../../src/common/auth/server/create-auth';

const TEST_SECRET = 'test-secret-for-sa2kit-auth-unit-tests-32chars';

describe('createSa2kitAuth', () => {
  it('rejects short secret', () => {
    expect(() =>
      createSa2kitAuth({
        db: {} as never,
        baseURL: 'http://localhost:3000',
        secret: 'short',
      }),
    ).toThrow(/secret/);
  });

  it('constructs with drizzle db stub', () => {
    const auth = createSa2kitAuth({
      db: {
        select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
        insert: () => ({ values: () => ({ returning: () => [] }) }),
        update: () => ({ set: () => ({ where: () => ({}) }) }),
        delete: () => ({ where: () => ({}) }),
      } as never,
      baseURL: 'http://localhost:3000',
      secret: TEST_SECRET,
      logOtpInDev: false,
    });

    expect(typeof auth.handler).toBe('function');
  });
});

describe('betterAuth memory handler', () => {
  it('responds on auth routes without 5xx', async () => {
    const auth = betterAuth({
      secret: TEST_SECRET,
      baseURL: 'http://localhost:3000',
      database: memoryAdapter({}),
      emailAndPassword: { enabled: true },
    });

    const response = await auth.handler(
      new Request('http://localhost:3000/api/auth/ok', { method: 'GET' }),
    );
    expect(response.status).toBeLessThan(500);
  });
});

describe('defaultPhoneValidator', () => {
  it('validates CN mobile numbers', async () => {
    const { defaultPhoneValidator } = await import(
      '../../../src/common/auth/server/plugins/dev-otp'
    );
    expect(defaultPhoneValidator('13800138000')).toBe(true);
    expect(defaultPhoneValidator('23800138000')).toBe(false);
  });
});
