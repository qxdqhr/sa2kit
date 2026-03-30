export interface ShowMasterpieceFileRuntimeConfig {
  defaultStorage: string;
  storageProviders: Record<string, any>;
  defaultCDN: string;
  cdnProviders: Record<string, any>;
  maxFileSize: number;
  allowedMimeTypes: string[];
  cache: {
    metadataTTL: number;
    urlTTL: number;
  };
}

interface ConfigManager {
  getConfig(): ShowMasterpieceFileRuntimeConfig;
}

function buildDefaultConfig(): ShowMasterpieceFileRuntimeConfig {
  const localStorage = {
    type: 'local',
    enabled: true,
    rootPath: process.env.FILE_STORAGE_PATH || 'uploads',
    baseUrl: process.env.FILE_BASE_URL || '/uploads',
  };

  const ossConfig = {
    type: 'aliyun-oss',
    enabled: false,
    region: process.env.ALIYUN_OSS_REGION || '',
    bucket: process.env.ALIYUN_OSS_BUCKET || '',
    accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
    customDomain: process.env.ALIYUN_OSS_CUSTOM_DOMAIN,
    secure: process.env.ALIYUN_OSS_SECURE === 'true',
    internal: process.env.ALIYUN_OSS_INTERNAL === 'true',
  };

  const hasOssConfig =
    !!ossConfig.region &&
    !!ossConfig.bucket &&
    !!ossConfig.accessKeyId &&
    !!ossConfig.accessKeySecret;

  const defaultStorage = hasOssConfig ? 'aliyun-oss' : 'local';
  ossConfig.enabled = hasOssConfig;

  return {
    defaultStorage,
    storageProviders: {
      local: localStorage,
      'aliyun-oss': ossConfig,
      'aws-s3': { type: 'aws-s3', enabled: false },
      'qcloud-cos': { type: 'qcloud-cos', enabled: false },
    },
    defaultCDN: 'none',
    cdnProviders: {
      none: { type: 'none', enabled: false },
      'aliyun-cdn': {
        type: 'aliyun-cdn',
        enabled: false,
        domain: process.env.ALIYUN_CDN_DOMAIN,
        accessKeyId: process.env.ALIYUN_CDN_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_CDN_ACCESS_KEY_SECRET,
        region: process.env.ALIYUN_CDN_REGION,
      },
      'aws-cloudfront': { type: 'aws-cloudfront', enabled: false },
      'qcloud-cdn': { type: 'qcloud-cdn', enabled: false },
    },
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10),
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/webm',
      'video/mkv',
      'application/pdf',
      'text/plain',
      'application/json',
      'application/javascript',
      'text/css',
      'text/html',
      'text/markdown',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/octet-stream',
      'model/gltf+json',
      'model/gltf-binary',
    ],
    cache: {
      metadataTTL: parseInt(process.env.METADATA_CACHE_TTL || '3600', 10),
      urlTTL: parseInt(process.env.URL_CACHE_TTL || '1800', 10),
    },
  };
}

export async function getShowMasterpieceFileConfig(): Promise<ConfigManager> {
  const config = buildDefaultConfig();
  return {
    getConfig() {
      return config;
    },
  };
}
