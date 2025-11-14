/**
 * 通用文件服务 - PostgreSQL 数据库表结构定义
 *
 * 这个文件定义了通用文件服务的完整数据库表结构，使用Drizzle ORM框架。
 * 支持多模块文件管理、版本控制、分享功能、处理记录等。
 *
 * 表结构概览：
 * - file_storage_providers: 存储提供者配置表
 * - file_folders: 文件夹表（支持层级结构）
 * - file_metadata: 文件元数据主表
 * - file_versions: 文件版本表
 * - file_processing_records: 文件处理记录表
 * - file_shares: 文件分享表
 * - file_access_logs: 文件访问日志表
 * - file_thumbnails: 文件缩略图表
 *
 * 设计特点：
 * - 支持多存储提供者（本地、OSS、CDN等）
 * - 完整的文件版本管理
 * - 灵活的文件夹层级结构
 * - 详细的访问日志和统计
 * - 文件处理流水线记录
 * - 安全的分享机制
 *
 * @fileoverview 数据库表结构 - 通用文件服务 (PostgreSQL)
 * @package sa2kit/universalFile/server
 */

import { relations } from 'drizzle-orm';
import {
  serial,
  text,
  timestamp,
  pgTable,
  json,
  integer,
  boolean,
  varchar,
  index,
  bigint,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * 存储提供者配置表 (file_storage_providers)
 *
 * 管理不同的文件存储提供者配置，支持本地存储、云存储等多种方式。
 * 每个提供者有独立的配置和优先级设置。
 */
export const fileStorageProviders = pgTable(
  'file_storage_providers',
  {
    /** 主键ID */
    id: serial('id').primaryKey(),

    /** 提供者名称 */
    name: varchar('name', { length: 100 }).notNull().unique(),

    /** 提供者类型：local, aliyun_oss, aws_s3, qiniu, etc. */
    type: varchar('type', { length: 50 }).notNull(),

    /** 提供者配置（JSON格式存储具体配置信息） */
    config: json('config').notNull(),

    /** 是否启用 */
    isActive: boolean('is_active').notNull().default(true),

    /** 是否为默认提供者 */
    isDefault: boolean('is_default').notNull().default(false),

    /** 优先级（数字越小优先级越高） */
    priority: integer('priority').notNull().default(100),

    /** 最大文件大小限制（字节） */
    maxFileSize: bigint('max_file_size', { mode: 'number' }),

    /** 支持的文件类型（MIME类型列表） */
    supportedMimeTypes: json('supported_mime_types'),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按类型查询的索引 */
    typeIndex: index('storage_providers_type_idx').on(table.type),

    /** 按活跃状态查询的索引 */
    isActiveIndex: index('storage_providers_is_active_idx').on(table.isActive),

    /** 按优先级排序的索引 */
    priorityIndex: index('storage_providers_priority_idx').on(table.priority),
  })
);

/**
 * 文件夹表 (file_folders)
 *
 * 支持层级结构的文件夹管理，每个模块可以有独立的文件夹结构。
 */
export const fileFolders = pgTable(
  'file_folders',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 文件夹名称 */
    name: varchar('name', { length: 255 }).notNull(),

    /** 父文件夹ID（为null表示根文件夹） */
    parentId: uuid('parent_id'),

    /** 模块ID（标识属于哪个模块） */
    moduleId: varchar('module_id', { length: 100 }),

    /** 业务ID（具体业务实体的ID） */
    businessId: varchar('business_id', { length: 255 }),

    /** 文件夹路径（从根到当前文件夹的完整路径） */
    path: text('path').notNull(),

    /** 层级深度 */
    depth: integer('depth').notNull().default(0),

    /** 显示顺序 */
    sortOrder: integer('sort_order').notNull().default(0),

    /** 文件夹描述 */
    description: text('description'),

    /** 是否为系统文件夹 */
    isSystem: boolean('is_system').notNull().default(false),

    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按模块查询的索引 */
    moduleIndex: index('folders_module_idx').on(table.moduleId),

    /** 按业务ID查询的索引 */
    businessIndex: index('folders_business_idx').on(table.businessId),

    /** 按父文件夹查询的索引 */
    parentIndex: index('folders_parent_idx').on(table.parentId),

    /** 按路径查询的索引 */
    pathIndex: index('folders_path_idx').on(table.path),

    /** 组合索引：模块+业务+父文件夹 */
    moduleBusinessParentIndex: index('folders_module_business_parent_idx').on(
      table.moduleId,
      table.businessId,
      table.parentId
    ),
  })
);

/**
 * 文件元数据主表 (file_metadata)
 *
 * 存储文件的完整元数据信息，是文件服务的核心表。
 */
export const fileMetadata = pgTable(
  'file_metadata',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 原始文件名 */
    originalName: varchar('original_name', { length: 500 }).notNull(),

    /** 存储文件名（系统生成的唯一文件名） */
    storedName: varchar('stored_name', { length: 500 }).notNull(),

    /** 文件扩展名 */
    extension: varchar('extension', { length: 20 }),

    /** MIME类型 */
    mimeType: varchar('mime_type', { length: 100 }).notNull(),

    /** 文件大小（字节） */
    size: bigint('size', { mode: 'number' }).notNull(),

    /** 文件MD5哈希值（用于去重和完整性校验） */
    md5Hash: varchar('md5_hash', { length: 32 }).notNull(),

    /** 文件SHA256哈希值 */
    sha256Hash: varchar('sha256_hash', { length: 64 }),

    /** 存储提供者ID */
    storageProviderId: integer('storage_provider_id')
      .references(() => fileStorageProviders.id)
      .notNull(),

    /** 存储路径 */
    storagePath: text('storage_path').notNull(),

    /** CDN访问URL */
    cdnUrl: text('cdn_url'),

    /** 所属文件夹ID */
    folderId: uuid('folder_id').references(() => fileFolders.id, { onDelete: 'set null' }),

    /** 模块ID */
    moduleId: varchar('module_id', { length: 100 }),

    /** 业务ID */
    businessId: varchar('business_id', { length: 255 }),

    /** 文件标签（JSON数组） */
    tags: json('tags'),

    /** 文件元信息（如图片尺寸、视频时长等） */
    metadata: json('metadata'),

    /** 是否为临时文件 */
    isTemporary: boolean('is_temporary').notNull().default(false),

    /** 是否已删除（软删除） */
    isDeleted: boolean('is_deleted').notNull().default(false),

    /** 访问次数 */
    accessCount: integer('access_count').notNull().default(0),

    /** 下载次数 */
    downloadCount: integer('download_count').notNull().default(0),

    /** 上传者ID */
    uploaderId: varchar('uploader_id', { length: 255 }).notNull(),

    /** 上传时间 */
    uploadTime: timestamp('upload_time').defaultNow().notNull(),

    /** 最后访问时间 */
    lastAccessTime: timestamp('last_access_time'),

    /** 过期时间（为null表示永不过期） */
    expiresAt: timestamp('expires_at'),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    /** 删除时间 */
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    /** 按MD5哈希查询的索引（去重用） */
    md5Index: index('file_metadata_md5_idx').on(table.md5Hash),

    /** 按SHA256哈希查询的索引 */
    sha256Index: index('file_metadata_sha256_idx').on(table.sha256Hash),

    /** 按模块查询的索引 */
    moduleIndex: index('file_metadata_module_idx').on(table.moduleId),

    /** 按业务ID查询的索引 */
    businessIndex: index('file_metadata_business_idx').on(table.businessId),

    /** 按上传者查询的索引 */
    uploaderIndex: index('file_metadata_uploader_idx').on(table.uploaderId),

    /** 按MIME类型查询的索引 */
    mimeTypeIndex: index('file_metadata_mime_type_idx').on(table.mimeType),

    /** 按删除状态查询的索引 */
    isDeletedIndex: index('file_metadata_is_deleted_idx').on(table.isDeleted),

    /** 按临时状态查询的索引 */
    isTemporaryIndex: index('file_metadata_is_temporary_idx').on(table.isTemporary),

    /** 按文件夹查询的索引 */
    folderIndex: index('file_metadata_folder_idx').on(table.folderId),

    /** 按上传时间查询的索引 */
    uploadTimeIndex: index('file_metadata_upload_time_idx').on(table.uploadTime),

    /** 组合索引：模块+业务+删除状态 */
    moduleBusinessDeletedIndex: index('file_metadata_module_business_deleted_idx').on(
      table.moduleId,
      table.businessId,
      table.isDeleted
    ),

    /** 组合索引：文件夹+删除状态 */
    folderDeletedIndex: index('file_metadata_folder_deleted_idx').on(
      table.folderId,
      table.isDeleted
    ),
  })
);

/**
 * 文件版本表 (file_versions)
 *
 * 支持文件的版本管理，记录文件的历史版本信息。
 */
export const fileVersions = pgTable(
  'file_versions',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 关联的文件ID */
    fileId: uuid('file_id')
      .references(() => fileMetadata.id, { onDelete: 'cascade' })
      .notNull(),

    /** 版本号 */
    version: integer('version').notNull(),

    /** 版本描述 */
    description: text('description'),

    /** 文件大小 */
    size: bigint('size', { mode: 'number' }).notNull(),

    /** MD5哈希值 */
    md5Hash: varchar('md5_hash', { length: 32 }).notNull(),

    /** 存储路径 */
    storagePath: text('storage_path').notNull(),

    /** CDN访问URL */
    cdnUrl: text('cdn_url'),

    /** 是否为当前版本 */
    isCurrent: boolean('is_current').notNull().default(false),

    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按文件ID查询的索引 */
    fileIndex: index('file_versions_file_idx').on(table.fileId),

    /** 按当前版本查询的索引 */
    isCurrentIndex: index('file_versions_is_current_idx').on(table.isCurrent),

    /** 组合索引：文件+版本 */
    fileVersionIndex: index('file_versions_file_version_idx').on(table.fileId, table.version),
  })
);

/**
 * 文件处理记录表 (file_processing_records)
 *
 * 记录文件的处理历史，包括压缩、格式转换、缩略图生成等操作。
 */
export const fileProcessingRecords = pgTable(
  'file_processing_records',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 关联的文件ID */
    fileId: uuid('file_id')
      .references(() => fileMetadata.id, { onDelete: 'cascade' })
      .notNull(),

    /** 处理类型：compress, resize, convert, thumbnail, watermark, etc. */
    processingType: varchar('processing_type', { length: 50 }).notNull(),

    /** 处理器名称 */
    processorName: varchar('processor_name', { length: 100 }).notNull(),

    /** 处理状态：pending, processing, completed, failed */
    status: varchar('status', { length: 20 }).notNull().default('pending'),

    /** 处理参数（JSON格式） */
    parameters: json('parameters'),

    /** 处理结果（JSON格式） */
    result: json('result'),

    /** 输出文件路径 */
    outputPath: text('output_path'),

    /** 输出文件大小 */
    outputSize: bigint('output_size', { mode: 'number' }),

    /** 处理耗时（毫秒） */
    processingTimeMs: integer('processing_time_ms'),

    /** 错误信息 */
    errorMessage: text('error_message'),

    /** 重试次数 */
    retryCount: integer('retry_count').notNull().default(0),

    /** 优先级 */
    priority: integer('priority').notNull().default(5),

    /** 开始时间 */
    startedAt: timestamp('started_at'),

    /** 完成时间 */
    completedAt: timestamp('completed_at'),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按文件ID查询的索引 */
    fileIndex: index('file_processing_records_file_idx').on(table.fileId),

    /** 按处理状态查询的索引 */
    statusIndex: index('file_processing_records_status_idx').on(table.status),

    /** 按处理类型查询的索引 */
    processingTypeIndex: index('file_processing_records_processing_type_idx').on(
      table.processingType
    ),

    /** 按优先级查询的索引 */
    priorityIndex: index('file_processing_records_priority_idx').on(table.priority),

    /** 组合索引：文件+处理类型 */
    fileProcessingTypeIndex: index('file_processing_records_file_processing_type_idx').on(
      table.fileId,
      table.processingType
    ),
  })
);

/**
 * 文件分享表 (file_shares)
 *
 * 管理文件的分享功能，支持密码保护、过期时间、访问限制等。
 */
export const fileShares = pgTable(
  'file_shares',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 分享代码（短链接标识） */
    shareCode: varchar('share_code', { length: 20 }).notNull().unique(),

    /** 分享的文件ID列表（JSON数组） */
    fileIds: json('file_ids').notNull(),

    /** 分享标题 */
    title: varchar('title', { length: 255 }),

    /** 分享描述 */
    description: text('description'),

    /** 访问密码 */
    password: varchar('password', { length: 100 }),

    /** 访问权限：view, download */
    permission: varchar('permission', { length: 20 }).notNull().default('view'),

    /** 最大下载次数（为null表示无限制） */
    maxDownloads: integer('max_downloads'),

    /** 当前下载次数 */
    downloadCount: integer('download_count').notNull().default(0),

    /** 最大访问次数（为null表示无限制） */
    maxAccess: integer('max_access'),

    /** 当前访问次数 */
    accessCount: integer('access_count').notNull().default(0),

    /** 是否启用 */
    isActive: boolean('is_active').notNull().default(true),

    /** 过期时间 */
    expiresAt: timestamp('expires_at'),

    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按分享代码查询的索引 */
    shareCodeIndex: index('file_shares_share_code_idx').on(table.shareCode),

    /** 按创建者查询的索引 */
    createdByIndex: index('file_shares_created_by_idx').on(table.createdBy),

    /** 按活跃状态查询的索引 */
    isActiveIndex: index('file_shares_is_active_idx').on(table.isActive),

    /** 按过期时间查询的索引 */
    expiresAtIndex: index('file_shares_expires_at_idx').on(table.expiresAt),
  })
);

/**
 * 文件访问日志表 (file_access_logs)
 *
 * 记录文件的访问历史，用于统计分析和安全审计。
 */
export const fileAccessLogs = pgTable(
  'file_access_logs',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 关联的文件ID */
    fileId: uuid('file_id').references(() => fileMetadata.id, { onDelete: 'cascade' }),

    /** 分享ID（如果通过分享访问） */
    shareId: uuid('share_id').references(() => fileShares.id, { onDelete: 'set null' }),

    /** 访问类型：view, download, preview, thumbnail */
    accessType: varchar('access_type', { length: 20 }).notNull(),

    /** 用户ID */
    userId: varchar('user_id', { length: 255 }),

    /** 客户端IP地址 */
    ipAddress: varchar('ip_address', { length: 45 }),

    /** 用户代理字符串 */
    userAgent: text('user_agent'),

    /** 访问来源 */
    referer: text('referer'),

    /** 响应状态码 */
    statusCode: integer('status_code'),

    /** 传输字节数 */
    bytesTransferred: bigint('bytes_transferred', { mode: 'number' }),

    /** 响应时间（毫秒） */
    responseTimeMs: integer('response_time_ms'),

    /** 访问时间 */
    accessedAt: timestamp('accessed_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按文件ID查询的索引 */
    fileIndex: index('file_access_logs_file_idx').on(table.fileId),

    /** 按用户ID查询的索引 */
    userIndex: index('file_access_logs_user_idx').on(table.userId),

    /** 按访问类型查询的索引 */
    accessTypeIndex: index('file_access_logs_access_type_idx').on(table.accessType),

    /** 按访问时间查询的索引 */
    accessedAtIndex: index('file_access_logs_accessed_at_idx').on(table.accessedAt),

    /** 按分享ID查询的索引 */
    shareIndex: index('file_access_logs_share_idx').on(table.shareId),
  })
);

/**
 * 文件缩略图表 (file_thumbnails)
 *
 * 存储文件的缩略图信息，支持多种尺寸和格式。
 */
export const fileThumbnails = pgTable(
  'file_thumbnails',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 关联的文件ID */
    fileId: uuid('file_id')
      .references(() => fileMetadata.id, { onDelete: 'cascade' })
      .notNull(),

    /** 缩略图类型：thumbnail, preview, poster（视频封面）, etc. */
    type: varchar('type', { length: 50 }).notNull(),

    /** 缩略图规格：small, medium, large, 或具体尺寸如 "200x200" */
    size: varchar('size', { length: 20 }).notNull(),

    /** 缩略图宽度 */
    width: integer('width'),

    /** 缩略图高度 */
    height: integer('height'),

    /** 缩略图格式：jpg, png, webp, etc. */
    format: varchar('format', { length: 10 }).notNull(),

    /** 缩略图文件大小 */
    fileSize: integer('file_size').notNull(),

    /** 存储路径 */
    storagePath: text('storage_path').notNull(),

    /** CDN访问URL */
    cdnUrl: text('cdn_url'),

    /** 生成质量（1-100） */
    quality: integer('quality').default(85),

    /** 是否生成成功 */
    isGenerated: boolean('is_generated').notNull().default(false),

    /** 生成时间 */
    generatedAt: timestamp('generated_at'),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按文件ID查询的索引 */
    fileIndex: index('file_thumbnails_file_idx').on(table.fileId),

    /** 按类型查询的索引 */
    typeIndex: index('file_thumbnails_type_idx').on(table.type),

    /** 按生成状态查询的索引 */
    isGeneratedIndex: index('file_thumbnails_is_generated_idx').on(table.isGenerated),

    /** 组合索引：文件+类型+尺寸 */
    fileTypeSizeIndex: index('file_thumbnails_file_type_size_idx').on(
      table.fileId,
      table.type,
      table.size
    ),
  })
);

// ========== 关系定义 ==========

export const fileStorageProvidersRelations = relations(fileStorageProviders, ({ many }) => ({
  files: many(fileMetadata),
}));

export const fileFoldersRelations = relations(fileFolders, ({ one, many }) => ({
  parent: one(fileFolders, {
    fields: [fileFolders.parentId],
    references: [fileFolders.id],
  }),
  children: many(fileFolders),
  files: many(fileMetadata),
}));

export const fileMetadataRelations = relations(fileMetadata, ({ one, many }) => ({
  storageProvider: one(fileStorageProviders, {
    fields: [fileMetadata.storageProviderId],
    references: [fileStorageProviders.id],
  }),
  folder: one(fileFolders, {
    fields: [fileMetadata.folderId],
    references: [fileFolders.id],
  }),
  versions: many(fileVersions),
  processingRecords: many(fileProcessingRecords),
  accessLogs: many(fileAccessLogs),
  thumbnails: many(fileThumbnails),
}));

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
  file: one(fileMetadata, {
    fields: [fileVersions.fileId],
    references: [fileMetadata.id],
  }),
}));

export const fileProcessingRecordsRelations = relations(fileProcessingRecords, ({ one }) => ({
  file: one(fileMetadata, {
    fields: [fileProcessingRecords.fileId],
    references: [fileMetadata.id],
  }),
}));

export const fileSharesRelations = relations(fileShares, ({ many }) => ({
  accessLogs: many(fileAccessLogs),
}));

export const fileAccessLogsRelations = relations(fileAccessLogs, ({ one }) => ({
  file: one(fileMetadata, {
    fields: [fileAccessLogs.fileId],
    references: [fileMetadata.id],
  }),
  share: one(fileShares, {
    fields: [fileAccessLogs.shareId],
    references: [fileShares.id],
  }),
}));

export const fileThumbnailsRelations = relations(fileThumbnails, ({ one }) => ({
  file: one(fileMetadata, {
    fields: [fileThumbnails.fileId],
    references: [fileMetadata.id],
  }),
}));

// ========== 导出类型 ==========

export type FileStorageProvider = typeof fileStorageProviders.$inferSelect;
export type NewFileStorageProvider = typeof fileStorageProviders.$inferInsert;

export type FileFolder = typeof fileFolders.$inferSelect;
export type NewFileFolder = typeof fileFolders.$inferInsert;

export type FileMetadata = typeof fileMetadata.$inferSelect;
export type NewFileMetadata = typeof fileMetadata.$inferInsert;

export type FileVersion = typeof fileVersions.$inferSelect;
export type NewFileVersion = typeof fileVersions.$inferInsert;

export type FileProcessingRecord = typeof fileProcessingRecords.$inferSelect;
export type NewFileProcessingRecord = typeof fileProcessingRecords.$inferInsert;

export type FileShare = typeof fileShares.$inferSelect;
export type NewFileShare = typeof fileShares.$inferInsert;

export type FileAccessLog = typeof fileAccessLogs.$inferSelect;
export type NewFileAccessLog = typeof fileAccessLogs.$inferInsert;

export type FileThumbnail = typeof fileThumbnails.$inferSelect;
export type NewFileThumbnail = typeof fileThumbnails.$inferInsert;

