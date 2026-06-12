import type { Sa2kitAuthConfig } from '../types';
import { AUTH_ENV_ALIASES } from './auth-env-catalog';
import { createSmsProviderFromEnv, resolveSmsProviderId } from '../sms/create-sms-provider-from-env';

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function readEnvWithAliases(key: string): string | undefined {
  const direct = readEnv(key);
  if (direct) return direct;
  for (const alias of AUTH_ENV_ALIASES[key] ?? []) {
    const value = readEnv(alias);
    if (value) return value;
  }
  return undefined;
}

/** Next.js build 阶段 NODE_ENV=production 但运行时 env 尚未注入（Docker --env-file） */
function isNextBuildPhaseWithoutRuntimeEnv(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export'
  );
}

function parseTrustedOrigins(baseURL: string): string[] {
  const fromEnv = readEnv('BETTER_AUTH_TRUSTED_ORIGINS');
  const defaults = [baseURL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const extra = fromEnv
    ? fromEnv
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  return [...defaults, ...extra].filter((origin, index, list) => list.indexOf(origin) === index);
}

export type ResolveAuthEnvInput = Partial<Sa2kitAuthConfig> & Pick<Sa2kitAuthConfig, 'db'>;

export type ResolvedAuthEnv = {
  config: Sa2kitAuthConfig;
  envSnapshot: Record<string, string | undefined>;
};

export function resolveAuthEnv(input: ResolveAuthEnvInput): ResolvedAuthEnv {
  const baseURL =
    input.baseURL ??
    readEnvWithAliases('BETTER_AUTH_URL') ??
    readEnv('NEXT_PUBLIC_APP_URL') ??
    'http://localhost:3000';

  const secret =
    input.secret ??
    readEnvWithAliases('BETTER_AUTH_SECRET') ??
    (process.env.NODE_ENV !== 'production' || isNextBuildPhaseWithoutRuntimeEnv()
      ? 'dev-better-auth-secret-min-32-chars!!'
      : undefined);

  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET 至少 32 字符（或开发环境使用默认 dev secret）');
  }

  const smsProvider = createSmsProviderFromEnv();
  const sms = input.sms ?? (smsProvider ? { sendOTP: smsProvider.sendOTP.bind(smsProvider) } : undefined);

  const config: Sa2kitAuthConfig = {
    db: input.db,
    baseURL,
    secret,
    trustedOrigins: input.trustedOrigins ?? parseTrustedOrigins(baseURL),
    basePath: input.basePath,
    sms,
    email: input.email,
    phoneNumberValidator: input.phoneNumberValidator,
    logOtpInDev:
      input.logOtpInDev ??
      (process.env.SA2KIT_AUTH_LOG_OTP === '1' || process.env.NODE_ENV !== 'production'),
  };

  const envSnapshot: Record<string, string | undefined> = {
    BETTER_AUTH_SECRET: readEnvWithAliases('BETTER_AUTH_SECRET') ? '[set]' : undefined,
    BETTER_AUTH_URL: readEnvWithAliases('BETTER_AUTH_URL'),
    NEXT_PUBLIC_APP_URL: readEnv('NEXT_PUBLIC_APP_URL'),
    BETTER_AUTH_TRUSTED_ORIGINS: readEnv('BETTER_AUTH_TRUSTED_ORIGINS'),
    SA2KIT_SMS_PROVIDER: String(resolveSmsProviderId() ?? ''),
    ALIYUN_SMS_ACCESS_KEY_ID: readEnv('ALIYUN_SMS_ACCESS_KEY_ID') ? '[set]' : undefined,
    ALIYUN_SMS_ACCESS_KEY_SECRET: readEnv('ALIYUN_SMS_ACCESS_KEY_SECRET') ? '[set]' : undefined,
    ALIYUN_SMS_SIGN_NAME: readEnv('ALIYUN_SMS_SIGN_NAME'),
    ALIYUN_SMS_TEMPLATE_CODE: readEnv('ALIYUN_SMS_TEMPLATE_CODE'),
    SA2KIT_EMAIL_PROVIDER: readEnv('SA2KIT_EMAIL_PROVIDER'),
    DATABASE_URL: readEnv('DATABASE_URL') ? '[set]' : undefined,
    NODE_ENV: process.env.NODE_ENV,
  };

  return { config, envSnapshot };
}
