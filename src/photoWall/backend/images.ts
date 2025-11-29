/**
 * PhotoWall Images API Routes
 * 图片列表 API 路由处理器
 */

import type { ImagesApiConfig, ImagesApiResponse, ImagesQueryParams, ApiResponse } from './types';

// Re-export types for convenience
export type { ImagesApiConfig, ImagesApiResponse, ImagesQueryParams, ApiResponse };
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 默认配置
 */
export function createDefaultImagesConfig(): ImagesApiConfig {
  return {
    basePath: '/api/images',
    cors: {
      enabled: true,
      origin: '*',
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    imageProvider: {
      type: 'file',
      baseUrl: '/images',
    },
  };
}

/**
 * 添加 CORS 头到响应
 */
function addCorsHeaders(response: Response, config: ImagesApiConfig, request: Request): Response {
  if (!config.cors?.enabled) return response;

  const origin = request.headers.get('origin');
  const allowedOrigins = config.cors.origin;

  // 处理允许的源
  if (allowedOrigins) {
    if (typeof allowedOrigins === 'string') {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    } else if (Array.isArray(allowedOrigins) && origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
  } else {
    // 默认允许所有源
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }

  if (config.cors.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  const methods = config.cors.methods || ['GET', 'OPTIONS'];
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));

  const headers = config.cors.allowedHeaders || ['Content-Type', 'Authorization'];
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));

  return response;
}

/**
 * 获取文件系统中的图片列表
 */
async function getImagesFromFileSystem(dir: string, baseUrl: string = '/images'): Promise<string[]> {
  try {
    // 假设图片存储在 public/images 目录下
    const imagesDir = path.join(process.cwd(), 'public', 'images', dir);

    // 递归读取目录中的所有图片文件
    const images: string[] = [];

    async function scanDirectory(currentPath: string, relativePath: string = '') {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name);

          if (entry.isDirectory()) {
            // 递归扫描子目录
            await scanDirectory(fullPath, relativeFilePath);
          } else if (entry.isFile()) {
            // 检查是否是图片文件
            const ext = path.extname(entry.name).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
              images.push(`${baseUrl}/${dir}/${relativeFilePath}`);
            }
          }
        }
      } catch (error) {
        // 目录不存在或其他错误，跳过
        console.warn(`Failed to scan directory ${currentPath}:`, error);
      }
    }

    await scanDirectory(imagesDir);
    return images;
  } catch (error) {
    console.error('Failed to read images from filesystem:', error);
    return [];
  }
}

/**
 * 创建图片列表 API 处理器
 *
 * @example
 * ```typescript
 * // Next.js App Router
 * import { createImagesHandler, createImagesOptionsHandler } from 'sa2kit/photoWall/backend';
 *
 * export const GET = createImagesHandler({
 *   imageProvider: {
 *     type: 'file',
 *     baseUrl: '/images'
 *   }
 * });
 *
 * export const OPTIONS = createImagesOptionsHandler();
 * ```
 */
export function createImagesHandler(config: ImagesApiConfig = createDefaultImagesConfig()) {
  return async function GET(request: Request) {
    try {
      const url = new URL(request.url);
      const dir = url.searchParams.get('dir');
      const type = url.searchParams.get('type') as 'oss' | 'public' | undefined;

      if (!dir) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Missing required parameter: dir',
        };
        return addCorsHeaders(
          Response.json(errorResponse, { status: 400 }),
          config,
          request
        );
      }

      let images: string[] = [];

      // 根据类型获取图片列表
      if (type === 'oss') {
        // TODO: 实现 OSS 图片提供者
        // 这里应该调用 OSS SDK 获取图片列表
        images = [];
      } else {
        // 默认使用文件系统
        images = await getImagesFromFileSystem(dir, config.imageProvider?.baseUrl || '/images');
      }

      const response: ImagesApiResponse = {
        images,
        total: images.length,
        hasMore: false, // 暂时不支持分页
      };

      const apiResponse: ApiResponse<ImagesApiResponse> = {
        success: true,
        data: response,
      };

      return addCorsHeaders(
        Response.json(apiResponse),
        config,
        request
      );

    } catch (error) {
      console.error('Images API error:', error);

      const errorResponse: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      return addCorsHeaders(
        Response.json(errorResponse, { status: 500 }),
        config,
        request
      );
    }
  };
}

/**
 * 创建 OPTIONS 处理器用于 CORS 预检请求
 */
export function createImagesOptionsHandler(config: ImagesApiConfig = createDefaultImagesConfig()) {
  return function OPTIONS(request: Request) {
    const response = new Response(null, { status: 200 });
    return addCorsHeaders(response, config, request);
  };
}

/**
 * 创建完整的图片 API 路由配置
 *
 * @example
 * ```typescript
 * // Next.js App Router
 * import { createImagesApiRoutes } from 'sa2kit/photoWall/backend';
 *
 * const { GET, OPTIONS } = createImagesApiRoutes();
 *
 * export { GET, OPTIONS };
 * ```
 */
export function createImagesApiRoutes(config: ImagesApiConfig = createDefaultImagesConfig()) {
  return {
    GET: createImagesHandler(config),
    OPTIONS: createImagesOptionsHandler(config),
  };
}
