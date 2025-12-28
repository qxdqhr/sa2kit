/**
 * 通用文件管理组件模块入口
 */

// 导出上传组件
export { FileUploader } from './FileUploader';
export type { FileUploaderProps } from './FileUploader';

// 导出文件管理组件
export { UniversalFileManager } from './UniversalFileManager';
export type { FileManagerProps } from './UniversalFileManager';

// 导出文件夹管理组件
export { default as FolderManager } from './FolderManager';
export type { FolderManagerProps, FolderNode } from './FolderManager';

// 导出文件分享组件
export { default as FileShareModal } from './FileShareModal';
export type { FileShareModalProps, ShareInfo } from './FileShareModal';
