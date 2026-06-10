import {
  universalFileClient,
  createFileClient,
  type UniversalFileClientConfig,
} from '../universalFile/client';
import { API_ENDPOINTS } from '../universalFile/constants';
import {
  STANDARD_ALIYUN_OSS_KEYS,
  parseAliyunOssConfigFromMap,
  isCompleteOssConfig,
  getOssStorageModeLabelFromConfig,
} from './shared/ossConfig';
import { buildModuleUploadPath, resolveUploadFolderPath } from './shared/path';
import {
  configureOssFileFromPlatform,
  configureOssFileHttp,
  createOssFileFetchFromAdapter,
  ossFileFetch,
  type OssFileFetchFn,
  type OssFileHttpConfig,
} from './shared/httpClient';

export {
  configureOssFileHttp,
  configureOssFileFromPlatform,
  createOssFileFetchFromAdapter,
  type OssFileFetchFn,
  type OssFileHttpConfig,
};

export type { UniversalFileClientConfig };

export {
  universalFileClient,
  createFileClient,
  STANDARD_ALIYUN_OSS_KEYS,
  parseAliyunOssConfigFromMap,
  buildModuleUploadPath,
  resolveUploadFolderPath,
};

export interface UploadModuleFileOptions {
  file: File | Blob;
  moduleId: string;
  businessId?: string;
  uploadUrl?: string;
  /** 与 universalFile 的 customPath 等价 */
  folderPath?: string;
  customPath?: string;
  needsProcessing?: boolean;
  permission?: 'public' | 'private' | 'authenticated' | 'owner-only';
  metadata?: Record<string, unknown>;
  extraFields?: Record<string, string>;
  /** 单次请求覆盖全局注入的 fetch（R2-223） */
  fetch?: OssFileFetchFn;
}

export interface UploadModuleFileResult {
  fileId: string;
  accessUrl: string;
}

export async function uploadModuleFile(
  options: UploadModuleFileOptions,
): Promise<UploadModuleFileResult> {
  const uploadUrl = options.uploadUrl ?? API_ENDPOINTS.UPLOAD;
  const fileName = options.file instanceof File ? options.file.name : 'upload.jpg';
  const folderPath = resolveUploadFolderPath({
    moduleId: options.moduleId,
    businessId: options.businessId,
    fileName,
    folderPath: options.folderPath,
    customPath: options.customPath,
  });

  const formData = new FormData();
  formData.append('file', options.file);
  formData.append('moduleId', options.moduleId);
  formData.append('businessId', options.businessId ?? 'default');
  formData.append('folderPath', folderPath);
  if (options.permission) {
    formData.append('permission', options.permission);
  }
  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }
  if (options.needsProcessing !== undefined) {
    formData.append('needsProcessing', String(options.needsProcessing));
  }
  if (options.extraFields) {
    for (const [key, value] of Object.entries(options.extraFields)) {
      formData.append(key, value);
    }
  }

  const response = await ossFileFetch(
    uploadUrl,
    {
      method: 'POST',
      body: formData,
    },
    options.fetch,
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || payload.message || `HTTP ${response.status}`);
  }

  const data = payload.data ?? payload;
  const fileId = data.fileId ?? data.id;
  const accessUrl = data.accessUrl ?? data.url;
  if (!fileId || !accessUrl) {
    throw new Error('上传响应缺少 fileId 或 accessUrl');
  }

  return { fileId, accessUrl };
}

export async function uploadArtworkImage(
  file: File,
  collectionId?: number,
): Promise<UploadModuleFileResult> {
  return uploadModuleFile({
    file,
    moduleId: 'showmasterpiece',
    businessId: collectionId ? `collection-${collectionId}` : 'artwork',
    needsProcessing: true,
  });
}

export async function getModuleFileAccessUrl(
  fileId: string,
  apiBase = '',
  fetchOverride?: OssFileFetchFn,
): Promise<string> {
  const response = await ossFileFetch(
    `${apiBase}/api/universal-file/${fileId}`,
    { method: 'GET' },
    fetchOverride,
  );
  if (!response.ok) {
    throw new Error(`获取文件 URL 失败: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.success === false) {
    throw new Error(payload.error || '获取文件 URL 失败');
  }
  const url = payload.data?.accessUrl ?? payload.accessUrl;
  if (!url) {
    throw new Error('响应缺少 accessUrl');
  }
  return url;
}

export const getArtworkImageUrl = getModuleFileAccessUrl;

let cachedOssConfig: ReturnType<typeof parseAliyunOssConfigFromMap> = null;

async function loadOssConfigFromItemsApi(
  itemsApiUrl: string,
  fetchOverride?: OssFileFetchFn,
) {
  const keys = Object.values(STANDARD_ALIYUN_OSS_KEYS).join(',');
  const url = `${itemsApiUrl}${itemsApiUrl.includes('?') ? '&' : '?'}keys=${encodeURIComponent(keys)}`;
  const response = await ossFileFetch(url, { method: 'GET' }, fetchOverride);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.success || !Array.isArray(data.items)) return null;

  const configMap: Record<string, string> = {};
  for (const item of data.items) {
    if (item?.key && item?.value) {
      configMap[item.key] = item.value;
    }
  }
  return parseAliyunOssConfigFromMap(configMap);
}

async function getCachedOssConfig(itemsApiUrl?: string) {
  if (cachedOssConfig !== null) {
    return cachedOssConfig;
  }
  if (typeof window !== 'undefined' && itemsApiUrl) {
    cachedOssConfig = await loadOssConfigFromItemsApi(itemsApiUrl);
  }
  return cachedOssConfig;
}

export async function shouldUseOssFileService(
  itemsApiUrl?: string,
): Promise<boolean> {
  try {
    await getCachedOssConfig(itemsApiUrl);
    return true;
  } catch {
    return false;
  }
}

export async function getOssStorageModeDisplayName(
  itemsApiUrl?: string,
): Promise<string> {
  const config = await getCachedOssConfig(itemsApiUrl);
  return getOssStorageModeLabelFromConfig(config);
}

export function clearOssFileConfigCache(): void {
  cachedOssConfig = null;
}

export async function refreshOssFileConfigCache(
  itemsApiUrl?: string,
): Promise<void> {
  clearOssFileConfigCache();
  await getCachedOssConfig(itemsApiUrl);
}

export const shouldUseUniversalFileService = shouldUseOssFileService;
export const getStorageModeDisplayName = getOssStorageModeDisplayName;
export const clearConfigCache = clearOssFileConfigCache;
export const refreshFileServiceConfig = refreshOssFileConfigCache;

export async function fetchOssConfigManagerFromItemsApi(
  itemsApiUrl: string,
): Promise<ReturnType<typeof parseAliyunOssConfigFromMap>> {
  return loadOssConfigFromItemsApi(itemsApiUrl);
}

export function isOssConfigured(config: ReturnType<typeof parseAliyunOssConfigFromMap>): boolean {
  return isCompleteOssConfig(config);
}
