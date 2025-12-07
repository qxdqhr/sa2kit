/**
 * MMD Admin Module - Export Index
 * 
 * MMD后台管理模块统一导出
 * 
 * @package sa2kit/mmd/admin
 */

// 组件
export { MmdAdminPanel } from './components/MmdAdminPanel';
export { MmdPlaylistEditor } from './components/MmdPlaylistEditor';
export { MmdResourceSelector } from './components/MmdResourceSelector';

// 类型
export type {
  // 数据库映射类型
  MmdPlaylistDB,
  MmdPlaylistNodeDB,
  MmdResourceOptionDB,
  MmdPresetItemDB,
  
  // 前端展示类型
  MmdPlaylistWithFiles,
  MmdPlaylistNodeWithFiles,
  MmdResourceOptionWithFile,
  MmdPresetItemWithFiles,
  
  // API 请求/响应类型
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  CreatePlaylistNodeRequest,
  UpdatePlaylistNodeRequest,
  CreateResourceOptionRequest,
  UpdateResourceOptionRequest,
  CreatePresetItemRequest,
  UpdatePresetItemRequest,
  PaginationQuery,
  PlaylistQuery,
  ResourceOptionQuery,
  PresetItemQuery,
  PaginationResponse,
  
  // 辅助类型
  FileIdToUrlMap,
  BatchFileUrlsResponse,
  MmdFileUploadConfig,
  
  // 组件属性类型
  MmdAdminPanelProps,
  PlaylistEditorProps,
  ResourceSelectorProps,
  
  // 转换函数类型
  PlaylistToFrontendConverter,
  PlaylistToMmdConfigConverter,
  ResourceOptionToFrontendConverter,
  PresetItemToFrontendConverter,
  PresetItemToMmdResourceConverter,
} from './types';

// 常量
export { MMD_RESOURCE_TYPE_CONFIGS } from './types';

// 工具函数
export {
  // 文件ID提取
  extractFileIdsFromPlaylist,
  extractFileIdsFromResourceOptions,
  extractFileIdsFromPresetItem,
  
  // 数据库 -> 前端格式转换
  convertPlaylistNodeToFrontend,
  convertPlaylistToFrontend,
  convertResourceOptionToFrontend,
  convertPresetItemToFrontend,
  
  // 前端格式 -> MMD组件格式转换
  convertNodeToMmdFormat,
  convertPlaylistToMmdConfig,
  convertPresetItemToMmdResource,
  convertResourceOptionsToMmdFormat,
  
  // 辅助函数
  validateFileUrls,
  generateMockFileUrls,
  mergeFileUrlMaps,
  extractPathsFromMmdResources,
} from './utils';

// 数据库Schema
export {
  mmdPlaylists,
  mmdPlaylistNodes,
  mmdResourceOptions,
  mmdPresetItems,
  mmdPlaylistsRelations,
  mmdPlaylistNodesRelations,
} from '../server/drizzle-schema';

export type {
  MmdPlaylist,
  NewMmdPlaylist,
  MmdPlaylistNode,
  NewMmdPlaylistNode,
  MmdResourceOption,
  NewMmdResourceOption,
  MmdPresetItem,
  NewMmdPresetItem,
} from '../server/drizzle-schema';
