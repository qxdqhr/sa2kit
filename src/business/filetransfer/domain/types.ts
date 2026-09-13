/**
 * 文件传输模块类型定义
 */

/**
 * 文件传输状态类型
 */
export type TransferStatus = 'pending' | 'completed' | 'failed';

/**
 * 文件传输记录接口
 */
export interface FileTransfer {
  /** 传输记录唯一标识 */
  id: string;
  
  /** 文件名 */
  fileName: string;
  
  /** 文件大小（字节） */
  fileSize: number;
  
  /** 文件类型 */
  fileType: string;
  
  /** 传输状态 */
  status: TransferStatus;
  
  /** 传输进度（0-100） */
  progress: number;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
  
  /** 文件存储路径 */
  filePath: string;
  
  /** 上传者ID */
  uploaderId: string;
  
  /** 下载次数 */
  downloadCount: number;
  
  /** 过期时间（可选） */
  expiresAt?: string;
}

/**
 * 文件传输配置接口
 */
export interface FileTransferConfig {
  /** 配置ID */
  id: string;
  
  /** 最大文件大小（字节） */
  maxFileSize: number;
  
  /** 允许的文件类型 */
  allowedFileTypes: string[];
  
  /** 默认过期时间（天） */
  defaultExpirationDays: number;
  
  /** 是否启用文件加密 */
  enableEncryption: boolean;
  
  /** 是否启用文件压缩 */
  enableCompression: boolean;
  
  /** 存储路径配置 */
  storagePath: string;
}

/**
 * 文件上传响应接口
 */
export interface UploadResponse {
  /** 上传是否成功 */
  success: boolean;
  
  /** 文件传输记录 */
  transfer?: FileTransfer;
  
  /** 错误信息 */
  error?: string;
}

/**
 * 文件下载响应接口
 */
export interface DownloadResponse {
  /** 下载是否成功 */
  success: boolean;
  
  /** 文件URL */
  url?: string;
  
  /** 错误信息 */
  error?: string;
} 