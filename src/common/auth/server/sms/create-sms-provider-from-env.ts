import { createAliyunPnvsSmsProvider } from './providers/aliyun-pnvs';
import { createConsoleSmsProvider } from './providers/console';
import type { Sa2kitSmsProvider, Sa2kitSmsProviderId } from './types';

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function resolveSmsProviderId(
  explicit?: Sa2kitSmsProviderId,
): Sa2kitSmsProviderId | undefined {
  if (explicit) return explicit;
  const fromEnv = readEnv('SA2KIT_SMS_PROVIDER') as Sa2kitSmsProviderId | undefined;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== 'production') return 'console';
  return undefined;
}

export function createSmsProviderFromEnv(options?: {
  providerId?: Sa2kitSmsProviderId;
}): Sa2kitSmsProvider | undefined {
  const providerId = resolveSmsProviderId(options?.providerId);
  if (!providerId || providerId === 'none') return undefined;

  if (providerId === 'console') {
    return createConsoleSmsProvider();
  }

  if (providerId === 'aliyun-pnvs') {
    const accessKeyId = readEnv('ALIYUN_SMS_ACCESS_KEY_ID');
    const accessKeySecret = readEnv('ALIYUN_SMS_ACCESS_KEY_SECRET');
    const signName = readEnv('ALIYUN_SMS_SIGN_NAME');
    const templateCode = readEnv('ALIYUN_SMS_TEMPLATE_CODE');

    if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
      throw new Error(
        'SA2KIT_SMS_PROVIDER=aliyun-pnvs 需要 ALIYUN_SMS_ACCESS_KEY_ID、ALIYUN_SMS_ACCESS_KEY_SECRET、ALIYUN_SMS_SIGN_NAME、ALIYUN_SMS_TEMPLATE_CODE',
      );
    }

    const codeValidMinutes = Number.parseInt(readEnv('ALIYUN_SMS_CODE_VALID_MINUTES') ?? '5', 10);

    return createAliyunPnvsSmsProvider({
      accessKeyId,
      accessKeySecret,
      signName,
      templateCode,
      countryCode: readEnv('ALIYUN_SMS_COUNTRY_CODE') ?? '86',
      codeValidMinutes: Number.isFinite(codeValidMinutes) ? codeValidMinutes : 5,
      endpoint: readEnv('ALIYUN_SMS_ENDPOINT'),
    });
  }

  throw new Error(`未知的 SA2KIT_SMS_PROVIDER: ${providerId}`);
}
