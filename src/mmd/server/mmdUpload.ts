/**
 * MMD 资源上传辅助函数
 * 
 * 整合 UniversalFileService 用于 MMD 资源上传
 */

import type { UniversalFileService } from '../../universalFile/server/UniversalFileService';
import type { FileMetadata } from '../../universalFile/types';
import { processMmdModelArchive, MMD_MODEL_ARCHIVE_MIME_TYPES } from './modelArchive';

export const MMD_SUPPORTED_TYPES = {
  model: [...MMD_MODEL_ARCHIVE_MIME_TYPES],
  animation: ['application/octet-stream', 'animation/vmd'],
  audio: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'],
};

export const MMD_FILE_EXTENSIONS = {
  model: ['.zip'],
  animation: ['.vmd'],
  audio: ['.wav', '.mp3', '.ogg'],
};

export interface MmdUploadOptions {
  file: File;
  resourceType: 'model' | 'animation' | 'audio';
  name: string;
  description?: string;
  userId: string;
}

export interface MmdUploadResult {
  id: string;
  name: string;
  url: string;
  filePath: string;
  fileSize: number;
  type: string;
  format: string;
  uploadTime: Date;
  metadata?: FileMetadata;
}

/**
 * 使用 UniversalFileService 上传 MMD 资源
 * 
 * @param fileService - UniversalFileService 实例
 * @param options - 上传选项
 * @returns 上传结果
 */
export async function uploadMmdResource(
  fileService: UniversalFileService,
  options: MmdUploadOptions
): Promise<MmdUploadResult> {
  const { file, resourceType, name, description, userId } = options;

  // 验证文件扩展名
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase());
  const allowedExtensions = MMD_FILE_EXTENSIONS[resourceType];

  if (!allowedExtensions.includes(ext)) {
    throw new Error(
      '不支持的文件扩展名: ' + (ext) + '。支持的格式: ' + (allowedExtensions.join(', '))
    );
  }

  // 确定模块ID
  const moduleId = 'mmd-' + (resourceType) + 's';

  // 上传文件
  const metadata = await fileService.uploadFile({
    file,
    moduleId,
    businessId: 'default',
    permission: 'public',
    metadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      originalFileName: file.name,
      resourceType,
      name,
      description: description || '',
    },
    needsProcessing: false,
  });

  // 构建返回结果
  const format = ext.slice(1).toUpperCase();
  const fileUrl = metadata.cdnUrl || metadata.storagePath;

  return {
    id: metadata.id,
    name,
    url: fileUrl,
    filePath: metadata.storagePath,
    fileSize: metadata.size,
    type: resourceType,
    format,
    uploadTime: metadata.uploadTime,
    metadata,
  };
}

/**
 * 上传 MMD 模型 (ZIP 压缩包)
 * 
 * @param fileService - UniversalFileService 实例
 * @param options - 上传选项
 * @returns 上传结果,包含解压后的模型路径
 */
export async function uploadMmdModel(
  fileService: UniversalFileService,
  options: MmdUploadOptions & { storageRoot: string; publicRoot: string }
): Promise<MmdUploadResult & { extractedPath?: string }> {
  const { file, storageRoot, publicRoot } = options;

  // 首先上传 ZIP 文件
  const baseResult = await uploadMmdResource(fileService, options);

  // 处理 ZIP 压缩包
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const archiveResult = await processMmdModelArchive(fileBuffer, {
      storageRoot,
      publicRoot,
      folderName: baseResult.id,
    });

    return {
      ...baseResult,
      url: archiveResult.modelUrl,
      filePath: archiveResult.modelUrl,
      format: archiveResult.format.toUpperCase(),
      extractedPath: archiveResult.modelUrl,
    };
  } catch (extractError) {
    console.error('模型压缩包处理失败:', extractError);
    throw new Error(
      extractError instanceof Error ? extractError.message : '模型压缩包处理失败'
    );
  }
}

/**
 * 批量上传 MMD 资源
 * 
 * @param fileService - UniversalFileService 实例
 * @param uploads - 上传选项数组
 * @returns 上传结果数组
 */
export async function batchUploadMmdResources(
  fileService: UniversalFileService,
  uploads: MmdUploadOptions[]
): Promise<MmdUploadResult[]> {
  const results: MmdUploadResult[] = [];

  for (const uploadOptions of uploads) {
    try {
      const result = await uploadMmdResource(fileService, uploadOptions);
      results.push(result);
    } catch (error) {
      console.error('上传失败: ' + (uploadOptions.file.name), error);
      // 继续处理其他文件
    }
  }

  return results;
}

