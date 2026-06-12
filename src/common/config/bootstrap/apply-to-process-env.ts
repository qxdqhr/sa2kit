import type { AppConfig } from './schema';

/**
 * 将 AppConfig 同步到 process.env，兼容仍读取扁平 env 的 sa2kit 模块（ossFile、legacy 脚本）。
 * 仅在进程内调用一次；已有非空 env 不被覆盖。
 */
export function applyAppConfigToProcessEnv(config: AppConfig): void {
  const set = (key: string, value: string | undefined) => {
    if (!value || (process.env[key] && process.env[key]!.length > 0)) return;
    process.env[key] = value;
  };

  set('DATABASE_URL', config.database.url);
  if (config.database.poolSize !== undefined) {
    set('DATABASE_POOL_SIZE', String(config.database.poolSize));
  }
  if (config.database.timeout !== undefined) {
    set('DATABASE_TIMEOUT', String(config.database.timeout));
  }
  if (config.database.sslMode) {
    set('DATABASE_SSL_MODE', config.database.sslMode);
  }

  set('BETTER_AUTH_SECRET', config.auth.secret);
  set('BETTER_AUTH_URL', config.auth.url);
  set('NEXT_PUBLIC_APP_URL', config.auth.publicUrl);

  if (config.auth.trustedOrigins?.length) {
    set('BETTER_AUTH_TRUSTED_ORIGINS', config.auth.trustedOrigins.join(','));
  }

  const smsProvider = config.auth.sms?.provider;
  if (smsProvider) {
    set('SA2KIT_SMS_PROVIDER', smsProvider);
  }

  const aliyunSms = config.auth.sms?.aliyun;
  if (aliyunSms) {
    set('ALIYUN_SMS_ACCESS_KEY_ID', aliyunSms.accessKeyId);
    set('ALIYUN_SMS_ACCESS_KEY_SECRET', aliyunSms.accessKeySecret);
    set('ALIYUN_SMS_SIGN_NAME', aliyunSms.signName);
    set('ALIYUN_SMS_TEMPLATE_CODE', aliyunSms.templateCode);
    set('ALIYUN_SMS_COUNTRY_CODE', aliyunSms.countryCode);
    if (aliyunSms.codeValidMinutes !== undefined) {
      set('ALIYUN_SMS_CODE_VALID_MINUTES', String(aliyunSms.codeValidMinutes));
    }
    set('ALIYUN_SMS_ENDPOINT', aliyunSms.endpoint);
  }

  if (config.auth.email?.provider) {
    set('SA2KIT_EMAIL_PROVIDER', config.auth.email.provider);
  }

  if (config.auth.logOtpInDev !== undefined) {
    set('SA2KIT_AUTH_LOG_OTP', config.auth.logOtpInDev ? '1' : '0');
  }

  const oss = config.storage?.aliyunOss;
  if (oss) {
    if (oss.region) set('ALIYUN_OSS_REGION', oss.region);
    if (oss.bucket) set('ALIYUN_OSS_BUCKET', oss.bucket);
    if (oss.accessKeyId) set('ALIYUN_OSS_ACCESS_KEY_ID', oss.accessKeyId);
    if (oss.accessKeySecret) set('ALIYUN_OSS_ACCESS_KEY_SECRET', oss.accessKeySecret);
    if (oss.customDomain) set('ALIYUN_OSS_CUSTOM_DOMAIN', oss.customDomain);
    if (oss.secure !== undefined) set('ALIYUN_OSS_SECURE', oss.secure ? 'true' : 'false');
    if (oss.internal !== undefined) set('ALIYUN_OSS_INTERNAL', oss.internal ? 'true' : 'false');
  }

  const cdn = config.storage?.aliyunCdn;
  if (cdn) {
    if (cdn.domain) set('ALIYUN_CDN_DOMAIN', cdn.domain);
    if (cdn.accessKeyId) set('ALIYUN_CDN_ACCESS_KEY_ID', cdn.accessKeyId);
    if (cdn.accessKeySecret) set('ALIYUN_CDN_ACCESS_KEY_SECRET', cdn.accessKeySecret);
  }
}
