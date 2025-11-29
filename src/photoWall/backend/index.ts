/**
 * PhotoWall Backend API
 * 后端 API 路由处理器
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

export {
  createImagesHandler,
  createImagesOptionsHandler,
  createImagesApiRoutes,
  createDefaultImagesConfig,
  type ImagesApiConfig,
  type ImagesApiResponse,
  type ImagesQueryParams,
  type ApiResponse,
} from './images';
