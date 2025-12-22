/**
 * MMD 后台管理数据转换工具
 * 
 * 提供数据库格式和前端格式之间的转换函数
 * 以及文件ID到URL的映射功能
 * 
 * @package sa2kit/mmd/admin
 */

import type {
  MmdPlaylistDB,
  MmdPlaylistNodeDB,
  MmdResourceOptionDB,
  MmdPresetItemDB,
  MmdPlaylistWithFiles,
  MmdPlaylistNodeWithFiles,
  MmdResourceOptionWithFile,
  MmdPresetItemWithFiles,
  FileIdToUrlMap,
} from './types';

import type {
  MMDResources,
  MMDPlaylistConfig,
  MMDPlaylistNode,
  MMDResourceItem,
  ResourceOption,
  MMDResourceOptions,
} from '../types';

// ============= 文件URL映射 =============

/**
 * 从数据库记录中提取所有文件ID
 */
export function extractFileIdsFromPlaylist(
  playlist: MmdPlaylistDB,
  nodes: MmdPlaylistNodeDB[]
): string[] {
  const fileIds = new Set<string>();

  // 播放列表缩略图
  if (playlist.thumbnailFileId) {
    fileIds.add(playlist.thumbnailFileId);
  }

  // 节点文件
  for (const node of nodes) {
    if (node.thumbnailFileId) fileIds.add(node.thumbnailFileId);
    if (node.modelFileId) fileIds.add(node.modelFileId);
    if (node.motionFileId) fileIds.add(node.motionFileId);
    if (node.cameraFileId) fileIds.add(node.cameraFileId);
    if (node.audioFileId) fileIds.add(node.audioFileId);
    if (node.stageModelFileId) fileIds.add(node.stageModelFileId);
    if (node.additionalMotionFileIds) {
      node.additionalMotionFileIds.forEach((id) => fileIds.add(id));
    }
  }

  return Array.from(fileIds);
}

/**
 * 从资源选项中提取文件ID
 */
export function extractFileIdsFromResourceOptions(
  options: MmdResourceOptionDB[]
): string[] {
  const fileIds = new Set<string>();

  for (const option of options) {
    fileIds.add(option.fileId);
    if (option.thumbnailFileId) {
      fileIds.add(option.thumbnailFileId);
    }
  }

  return Array.from(fileIds);
}

/**
 * 从预设项中提取文件ID
 */
export function extractFileIdsFromPresetItem(item: MmdPresetItemDB): string[] {
  const fileIds = new Set<string>();

  if (item.thumbnailFileId) fileIds.add(item.thumbnailFileId);
  if (item.modelFileId) fileIds.add(item.modelFileId);
  if (item.motionFileId) fileIds.add(item.motionFileId);
  if (item.cameraFileId) fileIds.add(item.cameraFileId);
  if (item.audioFileId) fileIds.add(item.audioFileId);
  if (item.stageModelFileId) fileIds.add(item.stageModelFileId);
  if (item.additionalMotionFileIds) {
    item.additionalMotionFileIds.forEach((id) => fileIds.add(id));
  }

  return Array.from(fileIds);
}

// ============= 数据库 -> 前端格式转换 =============

/**
 * 转换播放节点（数据库 -> 前端格式）
 */
export function convertPlaylistNodeToFrontend(
  node: MmdPlaylistNodeDB,
  fileUrls: FileIdToUrlMap
): MmdPlaylistNodeWithFiles {
  return {
    id: node.id,
    playlistId: node.playlistId,
    name: node.name,
    description: node.description,
    loop: node.loop,
    duration: node.duration,
    sortOrder: node.sortOrder,
    config: node.config,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    // URL 映射
    thumbnailUrl: node.thumbnailFileId ? fileUrls[node.thumbnailFileId] : undefined,
    modelUrl: fileUrls[node.modelFileId] || '',
    motionUrl: node.motionFileId ? fileUrls[node.motionFileId] : undefined,
    cameraUrl: node.cameraFileId ? fileUrls[node.cameraFileId] : undefined,
    audioUrl: node.audioFileId ? fileUrls[node.audioFileId] : undefined,
    stageModelUrl: node.stageModelFileId ? fileUrls[node.stageModelFileId] : undefined,
    additionalMotionUrls: node.additionalMotionFileIds
      ?.map((id) => fileUrls[id])
      .filter((url): url is string => Boolean(url)),
  };
}

/**
 * 转换播放列表（数据库 -> 前端格式）
 */
export function convertPlaylistToFrontend(
  playlist: MmdPlaylistDB,
  nodes: MmdPlaylistNodeDB[],
  fileUrls: FileIdToUrlMap
): MmdPlaylistWithFiles {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    loop: playlist.loop,
    preloadStrategy: playlist.preloadStrategy,
    autoPlay: playlist.autoPlay,
    status: playlist.status,
    sortOrder: playlist.sortOrder,
    config: playlist.config,
    createdBy: playlist.createdBy,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    deletedAt: playlist.deletedAt,
    // URL 映射
    thumbnailUrl: playlist.thumbnailFileId ? fileUrls[playlist.thumbnailFileId] : undefined,
    // 转换节点
    nodes: nodes
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((node) => convertPlaylistNodeToFrontend(node, fileUrls)),
  };
}

/**
 * 转换资源选项（数据库 -> 前端格式）
 */
export function convertResourceOptionToFrontend(
  option: MmdResourceOptionDB,
  fileUrls: FileIdToUrlMap
): MmdResourceOptionWithFile {
  return {
    id: option.id,
    name: option.name,
    description: option.description,
    resourceType: option.resourceType,
    tags: option.tags,
    sortOrder: option.sortOrder,
    isActive: option.isActive,
    createdBy: option.createdBy,
    createdAt: option.createdAt,
    updatedAt: option.updatedAt,
    // URL 映射
    fileUrl: fileUrls[option.fileId] || '',
    thumbnailUrl: option.thumbnailFileId ? fileUrls[option.thumbnailFileId] : undefined,
  };
}

/**
 * 转换预设项（数据库 -> 前端格式）
 */
export function convertPresetItemToFrontend(
  item: MmdPresetItemDB,
  fileUrls: FileIdToUrlMap
): MmdPresetItemWithFiles {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    tags: item.tags,
    createdBy: item.createdBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // URL 映射
    thumbnailUrl: item.thumbnailFileId ? fileUrls[item.thumbnailFileId] : undefined,
    modelUrl: fileUrls[item.modelFileId] || '',
    motionUrl: item.motionFileId ? fileUrls[item.motionFileId] : undefined,
    cameraUrl: item.cameraFileId ? fileUrls[item.cameraFileId] : undefined,
    audioUrl: item.audioFileId ? fileUrls[item.audioFileId] : undefined,
    stageModelUrl: item.stageModelFileId ? fileUrls[item.stageModelFileId] : undefined,
    additionalMotionUrls: item.additionalMotionFileIds
      ?.map((id) => fileUrls[id])
      .filter((url): url is string => Boolean(url)),
  };
}

// ============= 前端格式 -> MMD组件格式转换 =============

/**
 * 转换播放节点（前端格式 -> MMD组件格式）
 */
export function convertNodeToMmdFormat(node: MmdPlaylistNodeWithFiles): MMDPlaylistNode {
  return {
    id: node.id,
    name: node.name,
    loop: node.loop,
    duration: node.duration,
    thumbnail: node.thumbnailUrl,
    resources: {
      modelPath: node.modelUrl,
      motionPath: node.motionUrl,
      cameraPath: node.cameraUrl,
      audioPath: node.audioUrl,
      stageModelPath: node.stageModelUrl,
      additionalMotions: node.additionalMotionUrls,
    },
  };
}

/**
 * 转换播放列表（前端格式 -> MMD组件格式）
 */
export function convertPlaylistToMmdConfig(
  playlist: MmdPlaylistWithFiles
): MMDPlaylistConfig {
  return {
    id: playlist.id,
    name: playlist.name,
    nodes: playlist.nodes.map(convertNodeToMmdFormat),
    loop: playlist.loop,
    preload: playlist.preloadStrategy,
    autoPlay: playlist.autoPlay,
  };
}

/**
 * 转换预设项（前端格式 -> MMD资源项格式）
 */
export function convertPresetItemToMmdResource(
  item: MmdPresetItemWithFiles
): MMDResourceItem {
  return {
    id: item.id,
    name: item.name,
    thumbnail: item.thumbnailUrl,
    description: item.description,
    resources: {
      modelPath: item.modelUrl,
      motionPath: item.motionUrl,
      cameraPath: item.cameraUrl,
      audioPath: item.audioUrl,
      stageModelPath: item.stageModelUrl,
      additionalMotions: item.additionalMotionUrls,
    },
  };
}

/**
 * 转换资源选项列表（前端格式 -> MMD资源选项格式）
 */
export function convertResourceOptionsToMmdFormat(
  options: MmdResourceOptionWithFile[]
): MMDResourceOptions {
  const grouped = {
    models: [] as ResourceOption[],
    motions: [] as ResourceOption[],
    cameras: [] as ResourceOption[],
    audios: [] as ResourceOption[],
    stages: [] as ResourceOption[],
  };

  for (const option of options) {
    const resourceOption: ResourceOption = {
      id: option.id,
      name: option.name,
      path: option.fileUrl,
      thumbnail: option.thumbnailUrl,
    };

    switch (option.resourceType) {
      case 'model':
        grouped.models.push(resourceOption);
        break;
      case 'motion':
        grouped.motions.push(resourceOption);
        break;
      case 'camera':
        grouped.cameras!.push(resourceOption);
        break;
      case 'audio':
        grouped.audios!.push(resourceOption);
        break;
      case 'stage':
        grouped.stages!.push(resourceOption);
        break;
    }
  }

  return grouped;
}

// ============= 辅助函数 =============

/**
 * 验证文件URL映射是否完整
 */
export function validateFileUrls(
  requiredFileIds: string[],
  fileUrls: FileIdToUrlMap
): { valid: boolean; missingIds: string[] } {
  const missingIds = requiredFileIds.filter((id) => !fileUrls[id]);
  
  return {
    valid: missingIds.length === 0,
    missingIds,
  };
}

/**
 * 生成默认文件URL映射（用于开发/测试）
 */
export function generateMockFileUrls(fileIds: string[]): FileIdToUrlMap {
  const urls: FileIdToUrlMap = {};
  
  for (const id of fileIds) {
    urls[id] = `/mock/files/${id}`;
  }
  
  return urls;
}

/**
 * 合并多个文件URL映射
 */
export function mergeFileUrlMaps(...maps: FileIdToUrlMap[]): FileIdToUrlMap {
  return Object.assign({}, ...maps);
}

/**
 * 从MMDResources提取文件路径（用于编辑时反向映射）
 */
export function extractPathsFromMmdResources(resources: MMDResources): string[] {
  const paths: string[] = [resources.modelPath];
  
  if (resources.motionPath) paths.push(resources.motionPath);
  if (resources.cameraPath) paths.push(resources.cameraPath);
  if (resources.audioPath) paths.push(resources.audioPath);
  
  if (resources.stageModelPath) {
    if (Array.isArray(resources.stageModelPath)) {
      paths.push(...resources.stageModelPath);
    } else {
      paths.push(resources.stageModelPath);
    }
  }
  
  if (resources.additionalMotions) paths.push(...resources.additionalMotions);
  
  return paths;
}

