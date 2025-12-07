/**
 * MMD 后台管理类型定义
 * 
 * 这个文件定义了MMD后台管理系统的所有TypeScript类型
 * 包括前端组件使用的类型和后端API的类型
 * 
 * @package sa2kit/mmd/admin
 */

import type { FileMetadata } from '../../universalFile/types';
import type { 
  MMDResources, 
  MMDPlaylistNode, 
  MMDPlaylistConfig,
  MMDResourceItem,
  ResourceOption 
} from '../types';

// ============= 数据库映射类型 =============

/**
 * 播放列表配置（数据库格式）
 */
export interface MmdPlaylistDB {
  id: string;
  name: string;
  description?: string;
  loop: boolean;
  preloadStrategy: 'none' | 'next' | 'all';
  autoPlay: boolean;
  thumbnailFileId?: string;
  status: 'draft' | 'published' | 'archived';
  sortOrder: number;
  config?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * 播放节点配置（数据库格式）
 */
export interface MmdPlaylistNodeDB {
  id: string;
  playlistId: string;
  name: string;
  description?: string;
  loop: boolean;
  duration?: number;
  thumbnailFileId?: string;
  sortOrder: number;
  modelFileId: string;
  motionFileId?: string;
  cameraFileId?: string;
  audioFileId?: string;
  stageModelFileId?: string;
  additionalMotionFileIds?: string[];
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 资源选项配置（数据库格式）
 */
export interface MmdResourceOptionDB {
  id: string;
  name: string;
  description?: string;
  resourceType: 'model' | 'motion' | 'camera' | 'audio' | 'stage';
  fileId: string;
  thumbnailFileId?: string;
  tags?: string[];
  sortOrder: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 预设项配置（数据库格式）
 */
export interface MmdPresetItemDB {
  id: string;
  name: string;
  description?: string;
  thumbnailFileId?: string;
  modelFileId: string;
  motionFileId?: string;
  cameraFileId?: string;
  audioFileId?: string;
  stageModelFileId?: string;
  additionalMotionFileIds?: string[];
  sortOrder: number;
  isActive: boolean;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============= 前端展示类型 =============

/**
 * 播放列表配置（包含文件URL映射）
 */
export interface MmdPlaylistWithFiles extends Omit<MmdPlaylistDB, 'thumbnailFileId'> {
  thumbnailUrl?: string;
  nodes: MmdPlaylistNodeWithFiles[];
}

/**
 * 播放节点配置（包含文件URL映射）
 */
export interface MmdPlaylistNodeWithFiles extends Omit<
  MmdPlaylistNodeDB,
  'modelFileId' | 'motionFileId' | 'cameraFileId' | 'audioFileId' | 'stageModelFileId' | 'thumbnailFileId' | 'additionalMotionFileIds'
> {
  thumbnailUrl?: string;
  modelUrl: string;
  motionUrl?: string;
  cameraUrl?: string;
  audioUrl?: string;
  stageModelUrl?: string;
  additionalMotionUrls?: string[];
}

/**
 * 资源选项配置（包含文件URL映射）
 */
export interface MmdResourceOptionWithFile extends Omit<MmdResourceOptionDB, 'fileId' | 'thumbnailFileId'> {
  fileUrl: string;
  thumbnailUrl?: string;
  fileMetadata?: Partial<FileMetadata>;
}

/**
 * 预设项配置（包含文件URL映射）
 */
export interface MmdPresetItemWithFiles extends Omit<
  MmdPresetItemDB,
  'modelFileId' | 'motionFileId' | 'cameraFileId' | 'audioFileId' | 'stageModelFileId' | 'thumbnailFileId' | 'additionalMotionFileIds'
> {
  thumbnailUrl?: string;
  modelUrl: string;
  motionUrl?: string;
  cameraUrl?: string;
  audioUrl?: string;
  stageModelUrl?: string;
  additionalMotionUrls?: string[];
}

// ============= API 请求/响应类型 =============

/**
 * 创建播放列表请求
 */
export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  loop?: boolean;
  preloadStrategy?: 'none' | 'next' | 'all';
  autoPlay?: boolean;
  thumbnailFileId?: string;
  config?: Record<string, any>;
}

/**
 * 更新播放列表请求
 */
export interface UpdatePlaylistRequest extends Partial<CreatePlaylistRequest> {
  status?: 'draft' | 'published' | 'archived';
  sortOrder?: number;
}

/**
 * 创建播放节点请求
 */
export interface CreatePlaylistNodeRequest {
  playlistId: string;
  name: string;
  description?: string;
  loop?: boolean;
  duration?: number;
  thumbnailFileId?: string;
  sortOrder?: number;
  modelFileId: string;
  motionFileId?: string;
  cameraFileId?: string;
  audioFileId?: string;
  stageModelFileId?: string;
  additionalMotionFileIds?: string[];
  config?: Record<string, any>;
}

/**
 * 更新播放节点请求
 */
export interface UpdatePlaylistNodeRequest extends Partial<Omit<CreatePlaylistNodeRequest, 'playlistId'>> {}

/**
 * 创建资源选项请求
 */
export interface CreateResourceOptionRequest {
  name: string;
  description?: string;
  resourceType: 'model' | 'motion' | 'camera' | 'audio' | 'stage';
  fileId: string;
  thumbnailFileId?: string;
  tags?: string[];
  sortOrder?: number;
}

/**
 * 更新资源选项请求
 */
export interface UpdateResourceOptionRequest extends Partial<CreateResourceOptionRequest> {
  isActive?: boolean;
}

/**
 * 创建预设项请求
 */
export interface CreatePresetItemRequest {
  name: string;
  description?: string;
  thumbnailFileId?: string;
  modelFileId: string;
  motionFileId?: string;
  cameraFileId?: string;
  audioFileId?: string;
  stageModelFileId?: string;
  additionalMotionFileIds?: string[];
  tags?: string[];
  sortOrder?: number;
}

/**
 * 更新预设项请求
 */
export interface UpdatePresetItemRequest extends Partial<CreatePresetItemRequest> {
  isActive?: boolean;
}

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 播放列表查询参数
 */
export interface PlaylistQuery extends PaginationQuery {
  status?: 'draft' | 'published' | 'archived';
  createdBy?: string;
  search?: string;
}

/**
 * 资源选项查询参数
 */
export interface ResourceOptionQuery extends PaginationQuery {
  resourceType?: 'model' | 'motion' | 'camera' | 'audio' | 'stage';
  tags?: string[];
  isActive?: boolean;
  search?: string;
}

/**
 * 预设项查询参数
 */
export interface PresetItemQuery extends PaginationQuery {
  tags?: string[];
  isActive?: boolean;
  search?: string;
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============= 转换辅助类型 =============

/**
 * 文件ID到URL的映射
 */
export interface FileIdToUrlMap {
  [fileId: string]: string;
}

/**
 * 批量文件URL查询响应
 */
export interface BatchFileUrlsResponse {
  fileUrls: FileIdToUrlMap;
  missingFileIds: string[];
}

/**
 * MMD资源文件上传配置
 */
export interface MmdFileUploadConfig {
  /** 模块ID（用于文件分类） */
  moduleId: 'mmd-models' | 'mmd-motions' | 'mmd-cameras' | 'mmd-audios' | 'mmd-stages' | 'mmd-thumbnails';
  /** 允许的文件类型 */
  acceptedTypes: string[];
  /** 最大文件大小(MB) */
  maxFileSize: number;
  /** 文件描述 */
  description: string;
}

/**
 * MMD资源类型配置映射
 */
export const MMD_RESOURCE_TYPE_CONFIGS: Record<string, MmdFileUploadConfig> = {
  model: {
    moduleId: 'mmd-models',
    acceptedTypes: ['.pmx', '.pmd'],
    maxFileSize: 50,
    description: 'MMD模型文件',
  },
  motion: {
    moduleId: 'mmd-motions',
    acceptedTypes: ['.vmd'],
    maxFileSize: 20,
    description: 'MMD动作文件',
  },
  camera: {
    moduleId: 'mmd-cameras',
    acceptedTypes: ['.vmd'],
    maxFileSize: 10,
    description: 'MMD相机动画文件',
  },
  audio: {
    moduleId: 'mmd-audios',
    acceptedTypes: ['.mp3', '.wav', '.ogg', '.m4a'],
    maxFileSize: 20,
    description: '音频文件',
  },
  stage: {
    moduleId: 'mmd-stages',
    acceptedTypes: ['.pmx', '.pmd', '.x'],
    maxFileSize: 100,
    description: 'MMD舞台/场景模型',
  },
  thumbnail: {
    moduleId: 'mmd-thumbnails',
    acceptedTypes: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 5,
    description: '缩略图',
  },
};

// ============= 组件属性类型 =============

/**
 * MMD后台管理器组件属性
 */
export interface MmdAdminPanelProps {
  /** UniversalFile服务实例（用于文件上传） */
  fileService: any; // UniversalFileService
  /** 当前用户ID */
  userId: string;
  /** API基础路径 */
  apiBaseUrl?: string;
  /** 是否显示高级选项 */
  showAdvancedOptions?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 播放列表编辑器组件属性
 */
export interface PlaylistEditorProps {
  /** 播放列表ID（编辑模式）或 undefined（创建模式） */
  playlistId?: string;
  /** UniversalFile服务实例 */
  fileService: any;
  /** 当前用户ID */
  userId: string;
  /** 保存回调 */
  onSave?: (playlist: MmdPlaylistWithFiles) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

/**
 * 资源选择器组件属性
 */
export interface ResourceSelectorProps {
  /** 资源类型 */
  resourceType: 'model' | 'motion' | 'camera' | 'audio' | 'stage';
  /** UniversalFile服务实例 */
  fileService: any;
  /** 当前用户ID */
  userId: string;
  /** 当前选中的文件ID */
  value?: string;
  /** 选择回调 */
  onChange: (fileId: string, fileUrl: string) => void;
  /** 是否必填 */
  required?: boolean;
}

// ============= 数据转换函数类型 =============

/**
 * 播放列表转换为前端格式
 */
export type PlaylistToFrontendConverter = (
  playlist: MmdPlaylistDB,
  nodes: MmdPlaylistNodeDB[],
  fileUrls: FileIdToUrlMap
) => MmdPlaylistWithFiles;

/**
 * 播放列表转换为MMD组件格式
 */
export type PlaylistToMmdConfigConverter = (
  playlist: MmdPlaylistWithFiles
) => MMDPlaylistConfig;

/**
 * 资源选项转换为前端格式
 */
export type ResourceOptionToFrontendConverter = (
  option: MmdResourceOptionDB,
  fileUrls: FileIdToUrlMap
) => MmdResourceOptionWithFile;

/**
 * 预设项转换为前端格式
 */
export type PresetItemToFrontendConverter = (
  item: MmdPresetItemDB,
  fileUrls: FileIdToUrlMap
) => MmdPresetItemWithFiles;

/**
 * 预设项转换为MMD资源格式
 */
export type PresetItemToMmdResourceConverter = (
  item: MmdPresetItemWithFiles
) => MMDResourceItem;
