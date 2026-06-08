import type { AliyunOSSConfig } from '../../universalFile/server/types';

/** 与 profile-v1 配置项 / 环境变量对齐的 OSS 键名 */
export const STANDARD_ALIYUN_OSS_KEYS = {
  region: 'ALIYUN_OSS_REGION',
  bucket: 'ALIYUN_OSS_BUCKET',
  accessKeyId: 'ALIYUN_OSS_ACCESS_KEY_ID',
  accessKeySecret: 'ALIYUN_OSS_ACCESS_KEY_SECRET',
  customDomain: 'ALIYUN_OSS_CUSTOM_DOMAIN',
  secure: 'ALIYUN_OSS_SECURE',
  internal: 'ALIYUN_OSS_INTERNAL',
} as const;

export type OssConfigKeyMap = typeof STANDARD_ALIYUN_OSS_KEYS;

export function parseAliyunOssConfigFromMap(
  configMap: Record<string, string | undefined | null>,
  keys: OssConfigKeyMap = STANDARD_ALIYUN_OSS_KEYS,
): AliyunOSSConfig | null {
  const region = configMap[keys.region]?.trim();
  const bucket = configMap[keys.bucket]?.trim();
  const accessKeyId = configMap[keys.accessKeyId]?.trim();
  const accessKeySecret = configMap[keys.accessKeySecret]?.trim();

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    return null;
  }

  const secureRaw = configMap[keys.secure]?.trim().toLowerCase();
  const internalRaw = configMap[keys.internal]?.trim().toLowerCase();

  return {
    type: 'aliyun-oss',
    enabled: true,
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    customDomain: configMap[keys.customDomain]?.trim() || undefined,
    secure: secureRaw === 'true',
    internal: internalRaw === 'true',
  };
}

export function isCompleteOssConfig(config: AliyunOSSConfig | null): config is AliyunOSSConfig {
  return Boolean(
    config?.enabled
    && config.region
    && config.bucket
    && config.accessKeyId
    && config.accessKeySecret,
  );
}

export function getOssStorageModeLabelFromConfig(config: AliyunOSSConfig | null): string {
  if (!isCompleteOssConfig(config)) {
    return '本地存储 + 文件服务';
  }
  return config.customDomain
    ? '阿里云 OSS + 自定义域名'
    : '阿里云 OSS';
}
