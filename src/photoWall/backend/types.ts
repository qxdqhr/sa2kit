/**
 * PhotoWall API Types
 */

export interface ImagesApiConfig {
  basePath?: string;
  cors?: {
    enabled?: boolean;
    origin?: string | string[];
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
  };
  // 图片提供者配置
  imageProvider?: {
    type: 'file' | 'oss' | 'custom';
    baseUrl?: string;
    bucket?: string;
    region?: string;
  };
}

export interface ImagesApiResponse {
  images: string[];
  total?: number;
  hasMore?: boolean;
}

export interface ImagesQueryParams {
  dir: string;
  type?: 'oss' | 'public';
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
