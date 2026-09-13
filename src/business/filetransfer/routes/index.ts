/**
 * filetransfer 路由工厂（Phase H1b）
 */
import { readFile } from 'fs/promises';
import {
  createFileTransferDbService,
  createFileTransferService,
  type FileTransferDrizzleDb,
} from '../server';
import type { FileTransferConfig, TransferStatus } from '../domain/types';

export type FileTransferSessionUser = { id: string };

export type FileTransferRouteConfig = {
  db: FileTransferDrizzleDb;
  getSessionUser: (request: Request) => Promise<FileTransferSessionUser | null>;
  storagePath?: string;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function unauthorized(message = '未授权的访问') {
  return json({ success: false, error: message }, 401);
}

function createServices(config: FileTransferRouteConfig) {
  const dbService = createFileTransferDbService(config.db, config.storagePath);
  const service = createFileTransferService(dbService);
  return { dbService, service };
}

async function requireUser(config: FileTransferRouteConfig, request: Request) {
  const user = await config.getSessionUser(request);
  if (!user) return { user: null as null, response: unauthorized() };
  return { user, response: null as null };
}

export function createListTransfersHandler(config: FileTransferRouteConfig) {
  const { service } = createServices(config);
  return async (request: Request) => {
    const startTime = Date.now();
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);
      const status = url.searchParams.get('status') as TransferStatus | null;

      if (page < 1 || limit < 1 || limit > 100) {
        return json({ success: false, error: '无效的分页参数' }, 400);
      }

      const transfers = await service.getUserTransfers(String(user!.id), {
        page,
        limit,
        status: status || undefined,
      });

      const performanceStats = service.getPerformanceStats();
      const cacheStats = service.getCacheStats();

      return json({
        success: true,
        data: transfers,
        pagination: { page, limit, total: transfers.length },
        meta: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          cached: cacheStats.hitRate > 0,
          performance: {
            cacheHitRate: cacheStats.hitRate,
            totalRequests: performanceStats.apiResponseTimes.totalRequests,
          },
        },
      });
    } catch (error) {
      console.error('获取传输列表失败:', error);
      return json(
        {
          success: false,
          error: '获取传输列表失败',
          meta: { timestamp: new Date().toISOString(), duration: Date.now() - startTime },
        },
        500,
      );
    }
  };
}

export function createUploadTransferHandler(config: FileTransferRouteConfig) {
  const { service } = createServices(config);
  return async (request: Request) => {
    const startTime = Date.now();
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    try {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!(file instanceof File)) {
        return json({ success: false, error: '未提供文件' }, 400);
      }

      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10);
      if (file.size > maxFileSize) {
        return json(
          {
            success: false,
            error: `文件大小不能超过 ${Math.round(maxFileSize / 1024 / 1024)}MB`,
          },
          400,
        );
      }

      const transfer = await service.uploadFile(file, String(user!.id));
      return json({
        success: true,
        data: transfer,
        meta: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          fileSize: file.size,
          fileName: file.name,
        },
      });
    } catch (error) {
      console.error('创建传输记录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '创建传输记录失败';
      return json(
        {
          success: false,
          error: errorMessage,
          meta: { timestamp: new Date().toISOString(), duration: Date.now() - startTime },
        },
        500,
      );
    }
  };
}

export function createDeleteTransferHandler(config: FileTransferRouteConfig) {
  const { service } = createServices(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    try {
      const { id } = await context.params;
      await service.deleteTransfer(id, String(user!.id));
      return json({ success: true });
    } catch (error) {
      console.error('删除传输记录失败:', error);
      return json(
        { error: error instanceof Error ? error.message : '删除传输记录失败' },
        500,
      );
    }
  };
}

export function createDownloadTransferHandler(config: FileTransferRouteConfig) {
  const { dbService, service } = createServices(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    try {
      const { id } = await context.params;
      const transfer = await dbService.getTransferById(id, String(user!.id));
      if (!transfer) {
        return json({ error: '文件不存在或无权限访问' }, 404);
      }

      const fileBuffer = await readFile(transfer.filePath);
      await service.recordDownload(id);

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': transfer.fileType,
          'Content-Disposition': `attachment; filename="${transfer.fileName}"`,
          'Content-Length': String(fileBuffer.length),
        },
      });
    } catch (error) {
      console.error('下载文件失败:', error);
      return json({ error: '下载文件失败' }, 500);
    }
  };
}

export function createGetConfigHandler(config: FileTransferRouteConfig) {
  const { service } = createServices(config);
  return async (request: Request) => {
    const { response } = await requireUser(config, request);
    if (response) return response;
    try {
      const cfg = await service.getDefaultConfig();
      return json(cfg);
    } catch (error) {
      console.error('获取配置失败:', error);
      return json({ error: '获取配置失败' }, 500);
    }
  };
}

export function createUpdateConfigHandler(config: FileTransferRouteConfig) {
  return async (request: Request) => {
    const { response } = await requireUser(config, request);
    if (response) return response;
    try {
      const configData = (await request.json()) as Partial<FileTransferConfig>;
      if (!configData.maxFileSize || configData.maxFileSize <= 0) {
        return json({ error: '最大文件大小必须大于0' }, 400);
      }
      if (!Array.isArray(configData.allowedFileTypes) || configData.allowedFileTypes.length === 0) {
        return json({ error: '允许的文件类型列表不能为空' }, 400);
      }
      return json({ success: true, message: '配置更新成功', config: configData });
    } catch (error) {
      console.error('更新配置失败:', error);
      return json({ error: '更新配置失败' }, 500);
    }
  };
}

/** 集合功能尚未落库：保持鉴权后空列表，避免 404 */
export function createListCollectionsHandler(config: FileTransferRouteConfig) {
  return async (request: Request) => {
    const { response } = await requireUser(config, request);
    if (response) return response;
    return json({ success: true, data: [] });
  };
}

export function createCreateCollectionHandler(config: FileTransferRouteConfig) {
  return async (request: Request) => {
    const { response } = await requireUser(config, request);
    if (response) return response;
    return json({ success: false, error: '集合功能尚未启用' }, 501);
  };
}

export function createCollectionByIdHandler(config: FileTransferRouteConfig) {
  return async (request: Request, _context: IdRouteContext) => {
    const { response } = await requireUser(config, request);
    if (response) return response;
    if (request.method === 'DELETE' || request.method === 'PUT') {
      return json({ success: false, error: '集合功能尚未启用' }, 501);
    }
    return json({ success: false, error: '集合不存在' }, 404);
  };
}
