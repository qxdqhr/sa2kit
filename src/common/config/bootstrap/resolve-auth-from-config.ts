import type { Sa2kitAuthConfig } from '../../auth/server/types';
import type { AppConfig } from './schema';
import { createAliyunPnvsSmsProvider } from '../../auth/server/sms/providers/aliyun-pnvs';
import { createConsoleSmsProvider } from '../../auth/server/sms/providers/console';

function parseTrustedOrigins(config: AppConfig): string[] {
  const baseURL = config.auth.url;
  const defaults = [baseURL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const extra = config.auth.trustedOrigins ?? [];
  return [...defaults, ...extra].filter((origin, index, list) => list.indexOf(origin) === index);
}

export function resolveAuthConfigFromAppConfig(
  config: AppConfig,
  overrides: Partial<Sa2kitAuthConfig> & Pick<Sa2kitAuthConfig, 'db'>,
): Sa2kitAuthConfig {
  const smsProvider = config.auth.sms?.provider ?? 'console';
  let sms = overrides.sms;

  if (!sms && smsProvider === 'console') {
    const consoleProvider = createConsoleSmsProvider();
    sms = { sendOTP: consoleProvider.sendOTP.bind(consoleProvider) };
  }

  if (!sms && smsProvider === 'aliyun-pnvs') {
    const aliyun = config.auth.sms?.aliyun;
    if (
      aliyun?.accessKeyId &&
      aliyun.accessKeySecret &&
      aliyun.signName &&
      aliyun.templateCode
    ) {
      const provider = createAliyunPnvsSmsProvider({
        accessKeyId: aliyun.accessKeyId,
        accessKeySecret: aliyun.accessKeySecret,
        signName: aliyun.signName,
        templateCode: aliyun.templateCode,
        countryCode: aliyun.countryCode ?? '86',
        codeValidMinutes: aliyun.codeValidMinutes ?? 5,
        endpoint: aliyun.endpoint,
      });
      sms = { sendOTP: provider.sendOTP.bind(provider) };
    }
  }

  const isProd = (config.app.env ?? process.env.NODE_ENV) === 'production';

  return {
    db: overrides.db,
    baseURL: overrides.baseURL ?? config.auth.url,
    secret: overrides.secret ?? config.auth.secret,
    trustedOrigins: overrides.trustedOrigins ?? parseTrustedOrigins(config),
    basePath: overrides.basePath,
    sms: overrides.sms ?? sms,
    email: overrides.email,
    phoneNumberValidator: overrides.phoneNumberValidator,
    logOtpInDev:
      overrides.logOtpInDev ??
      config.auth.logOtpInDev ??
      (!isProd || process.env.SA2KIT_AUTH_LOG_OTP === '1'),
  };
}
