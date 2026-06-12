import { describe, expect, it } from 'vitest';
import { checkAuthEnv } from '../../../src/common/auth/server/env/check-auth-env';
import { createSmsProviderFromEnv } from '../../../src/common/auth/server/sms/create-sms-provider-from-env';

describe('checkAuthEnv', () => {
  it('reports missing production SMS provider', () => {
    const report = checkAuthEnv({
      BETTER_AUTH_SECRET: '[set]',
      BETTER_AUTH_URL: 'https://example.com',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      DATABASE_URL: '[set]',
      NODE_ENV: 'production',
    });

    expect(report.ok).toBe(true);
    expect(report.issues.some((i) => i.featureId === 'sms_phone_otp')).toBe(true);
  });

  it('flags missing aliyun keys when provider is aliyun-pnvs', () => {
    const report = checkAuthEnv({
      BETTER_AUTH_SECRET: '[set]',
      BETTER_AUTH_URL: 'https://example.com',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      DATABASE_URL: '[set]',
      SA2KIT_SMS_PROVIDER: 'aliyun-pnvs',
      NODE_ENV: 'production',
    });

    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.level === 'error' && i.featureId === 'sms_phone_otp')).toBe(
      true,
    );
  });
});

describe('createSmsProviderFromEnv', () => {
  it('creates console provider in development default', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    delete process.env.SA2KIT_SMS_PROVIDER;

    const provider = createSmsProviderFromEnv();
    expect(provider).toBeDefined();

    process.env.NODE_ENV = original;
  });
});

describe('phone signup intent store', () => {
  it('stash and consume password', async () => {
    const { stashPhoneSignupPassword, consumePhoneSignupPassword } = await import(
      '../../../src/common/auth/server/phone-signup-intent'
    );
    stashPhoneSignupPassword('13800138000', 'secret123456');
    expect(consumePhoneSignupPassword('13800138000')).toBe('secret123456');
    expect(consumePhoneSignupPassword('13800138000')).toBeUndefined();
  });
});
