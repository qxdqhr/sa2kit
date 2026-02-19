/**
 * ShowMasterpiece模块 - 文件服务配置
 * 
 * 为ShowMasterpiece模块提供特定的文件服务配置和帮助函数
 */

import { createFileServiceConfig, createFileServiceConfigWithConfigManager } from '@/services/universalFile/config';

import type { LocalStorageConfig, AliyunOSSConfig, StorageConfig } from '@/services/universalFile/types';

// 缓存ConfigManager实例，避免重复创建
let cachedConfigManager: Awaited<ReturnType<typeof createFileServiceConfigWithConfigManager>> | null = null;

/**
 * 从showmasterpiece独立配置获取OSS配置
 */
async function getShowmasterpieceOSSConfig() {
  try {
    console.log('🎨 [ShowMasterpiece] 尝试从独立配置读取OSS配置...');
    
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    console.log(`🎨 [ShowMasterpiece] 当前环境: ${environment}`);
    
    // 检查是否在服务器端环境
    if (typeof window !== 'undefined') {
      // 客户端环境：通过API读取配置
      console.log('🌐 [ShowMasterpiece] 客户端环境，通过API读取配置');
      
      const configKeys = 'ALIYUN_OSS_REGION,ALIYUN_OSS_BUCKET,ALIYUN_OSS_ACCESS_KEY_ID,ALIYUN_OSS_ACCESS_KEY_SECRET,ALIYUN_OSS_CUSTOM_DOMAIN,ALIYUN_OSS_SECURE,ALIYUN_OSS_INTERNAL';
      const response = await fetch(`/api/showmasterpiece/config/items?environment=${environment}&keys=${configKeys}`);
      
      if (!response.ok) {
        console.warn('⚠️ [ShowMasterpiece] 读取独立配置API失败:', response.status);
        return null;
      }
      
      const data = await response.json();
      if (!data.success || !data.items) {
        console.warn('⚠️ [ShowMasterpiece] 独立配置API响应异常:', data);
        return null;
      }

      // 将配置项数组转换为对象
      const configMap: Record<string, string> = {};
      data.items.forEach((item: any) => {
        if (item.value) {
          configMap[item.key] = item.value;
        }
      });

      const ossConfig = {
        region: configMap['ALIYUN_OSS_REGION'],
        bucket: configMap['ALIYUN_OSS_BUCKET'],
        accessKeyId: configMap['ALIYUN_OSS_ACCESS_KEY_ID'],
        accessKeySecret: configMap['ALIYUN_OSS_ACCESS_KEY_SECRET'],
        customDomain: configMap['ALIYUN_OSS_CUSTOM_DOMAIN'],
        secure: configMap['ALIYUN_OSS_SECURE'] === 'true',
        internal: configMap['ALIYUN_OSS_INTERNAL'] === 'true'
      };

      console.log('🎨 [ShowMasterpiece] 独立配置读取结果:', {
        region: ossConfig.region || '未配置',
        bucket: ossConfig.bucket || '未配置',
        accessKeyId: ossConfig.accessKeyId ? '***' : '未配置',
        accessKeySecret: ossConfig.accessKeySecret ? '***' : '未配置',
        customDomain: ossConfig.customDomain || '未配置',
        secure: ossConfig.secure,
        internal: ossConfig.internal
      });

      // 检查必要配置是否完整
      if (ossConfig.region && ossConfig.bucket && ossConfig.accessKeyId && ossConfig.accessKeySecret) {
        console.log('✅ [ShowMasterpiece] 独立配置完整，将使用独立OSS配置');
        return ossConfig;
      } else {
        console.log('⚠️ [ShowMasterpiece] 独立配置不完整，将回退到公共配置');
        console.log('🔍 [ShowMasterpiece] 缺失配置项:', {
          region: !ossConfig.region,
          bucket: !ossConfig.bucket,
          accessKeyId: !ossConfig.accessKeyId,
          accessKeySecret: !ossConfig.accessKeySecret
        });
        return null;
      }
    } else {
      // 服务器端环境：当前 sa2kit 未提供独立配置服务，回退到默认配置
      console.log('🖥️ [ShowMasterpiece] 服务器端环境，使用默认配置回退');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ [ShowMasterpiece] 读取独立配置失败:', error);
    return null;
  }
}

/**
 * 获取缓存的ConfigManager实例
 */
async function getCachedConfigManager() {
  if (!cachedConfigManager) {
    // 尝试从showmasterpiece独立配置创建配置管理器
    const showmasterpieceOSSConfig = await getShowmasterpieceOSSConfig();
    
    if (showmasterpieceOSSConfig) {
      console.log('🎨 [ShowMasterpiece] 使用独立OSS配置创建配置管理器');
      
      // 使用独立配置创建配置管理器
      cachedConfigManager = await createFileServiceConfig({
        defaultStorage: 'aliyun-oss',
        storageProviders: {
          'local': {
            type: 'local',
            enabled: false,
            rootPath: 'uploads',
            baseUrl: '/uploads'
          } as LocalStorageConfig,
          'aliyun-oss': {
            type: 'aliyun-oss',
            enabled: true,
            ...showmasterpieceOSSConfig
          } as AliyunOSSConfig,
          'aws-s3': {
            type: 'aws-s3',
            enabled: false
          } as StorageConfig,
          'qcloud-cos': {
            type: 'qcloud-cos',
            enabled: false
          } as StorageConfig
        }
      });
    } else {
      console.log('🎨 [ShowMasterpiece] 独立配置不完整，使用默认配置');
      // 使用默认配置（主要从环境变量读取）
      cachedConfigManager = await createFileServiceConfig({
        defaultStorage: 'local', // 默认使用本地存储
        storageProviders: {
          'local': {
            type: 'local',
            enabled: true,
            rootPath: 'uploads',
            baseUrl: '/uploads'
          } as LocalStorageConfig,
          'aliyun-oss': {
            type: 'aliyun-oss',
            enabled: false // 如果独立配置失败，禁用OSS
          } as AliyunOSSConfig,
          'aws-s3': {
            type: 'aws-s3',
            enabled: false
          } as StorageConfig,
          'qcloud-cos': {
            type: 'qcloud-cos',
            enabled: false
          } as StorageConfig
        }
      });
    }
  }
  return cachedConfigManager;
}

/**
 * 获取ShowMasterpiece模块的文件服务配置
 */
export async function getShowMasterpieceFileConfig() {
  const configManager = await getCachedConfigManager();
  
  // 检查是否有OSS配置，如果有则优先使用OSS
  const config = configManager.getConfig();
  const ossConfig = config.storageProviders['aliyun-oss'];
  
  if (ossConfig && ossConfig.enabled) {
    console.log('✅ [ShowMasterpiece] 使用阿里云OSS存储');
    return configManager;
  } else {
    console.log('ℹ️ [ShowMasterpiece] OSS未配置，使用本地存储');
    return configManager;
  }
}

/**
 * 上传ShowMasterpiece作品图片
 */
export async function uploadArtworkImage(file: File, collectionId?: number): Promise<{
  fileId: string;
  accessUrl: string;
}> {
  console.log('🎨 [ShowMasterpiece] 开始上传作品图片:', file.name);

  // 创建FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('moduleId', 'showmasterpiece');
  formData.append('businessId', collectionId ? `collection-${collectionId}` : 'artwork');

  // 为作品图片生成包含扩展名的路径，确保被正确识别为图片文件
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const basePath = collectionId ? `showmasterpiece/collection-${collectionId}` : 'showmasterpiece/artwork';
  formData.append('folderPath', `${basePath}/${timestamp}_${randomId}.${extension}`);
  formData.append('needsProcessing', 'true');
  
  // 调用通用文件上传API
  const response = await fetch('/api/universal-file/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '上传失败');
  }
  
  console.log('✅ [ShowMasterpiece] 作品图片上传成功:', {
    fileId: result.data.fileId,
    accessUrl: result.data.accessUrl
  });
  
  return {
    fileId: result.data.fileId,
    accessUrl: result.data.accessUrl
  };
}

/**
 * 获取作品图片访问URL
 */
export async function getArtworkImageUrl(fileId: string): Promise<string> {
  console.log('🔗 [ShowMasterpiece] 获取作品图片URL:', fileId);
  
  const response = await fetch(`/api/universal-file/${fileId}`);
  
  if (!response.ok) {
    throw new Error(`获取文件URL失败: HTTP ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '获取文件URL失败');
  }
  
  return result.data.accessUrl;
}

/**
 * 检查是否应该使用通用文件服务
 * 
 * 策略：
 * 1. 如果已经配置了OSS，新上传默认使用文件服务
 * 2. 如果只有本地存储，可以选择使用文件服务进行统一管理
 * 3. 兼容旧的Base64存储方式
 */
export async function shouldUseUniversalFileService(): Promise<boolean> {
  try {
    const configManager = await getCachedConfigManager();
    
    const config = configManager.getConfig();
    const ossConfig = config.storageProviders['aliyun-oss'];
    
    // 如果OSS已配置且启用，推荐使用文件服务
    if (ossConfig && ossConfig.enabled) {
      return true;
    }
    
    // 即使只有本地存储，也推荐使用文件服务进行统一管理
    // 这样可以享受文件去重、缓存、统计等功能
    return true;
    
  } catch (error) {
    console.warn('⚠️ [ShowMasterpiece] 检查文件服务配置失败:', error);
    return false;
  }
}

/**
 * 获取存储模式显示名称
 */
export async function getStorageModeDisplayName(): Promise<string> {
  const shouldUse = await shouldUseUniversalFileService();
  if (shouldUse) {
    const configManager = await getCachedConfigManager();
    
    const config = configManager.getConfig();
    const ossConfig = config.storageProviders['aliyun-oss'];
    
    if (ossConfig && ossConfig.enabled) {
      return '阿里云OSS + CDN (独立配置)';
    } else {
      return '本地存储 + 文件服务';
    }
  } else {
    return 'Base64数据库存储';
  }
}

/**
 * 清除配置缓存
 * 
 * 当配置更新后调用此函数，强制重新读取配置
 */
export function clearConfigCache(): void {
  console.log('🧹 [ShowMasterpiece] 清除配置缓存');
  cachedConfigManager = null;
}

/**
 * 强制刷新配置
 * 
 * 清除缓存并重新获取配置
 */
export async function refreshFileServiceConfig() {
  console.log('🔄 [ShowMasterpiece] 强制刷新文件服务配置');
  clearConfigCache();
  const configManager = await getCachedConfigManager();
  
  // 如果是使用独立配置，确保重新初始化Provider（仅在服务器端）
  if (typeof window === 'undefined') {
    try {
      const config = configManager.getConfig() as any;
      const ossConfig = config?.storageProviders?.['aliyun-oss'];
      
      if (ossConfig && ossConfig.enabled) {
        console.log('🔄 [ShowMasterpiece] 重新初始化OSS Provider以应用新配置');
        // 创建新的文件服务实例以确保Provider使用最新配置
        const { UniversalFileService } = await import('../../universalFile/server/UniversalFileService');
        const fileService = new UniversalFileService(config as any);
        await fileService.initialize();
        
        // 重新初始化Provider
        await (fileService as any).reinitializeStorageProviders?.();
      }
    } catch (error) {
      console.warn('⚠️ [ShowMasterpiece] 重新初始化Provider失败:', error);
    }
  }
  
  return configManager;
} 
