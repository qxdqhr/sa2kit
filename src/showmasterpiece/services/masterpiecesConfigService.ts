import type { 
  MasterpiecesConfig, 
  ArtCollection, 
  ArtworkPage,
  CollectionFormData,
  ArtworkFormData 
} from '../types';

// 配置缓存
let configCache: MasterpiecesConfig | null = null;
let configCacheTime: number = 0;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 配置管理
export const getConfig = async (): Promise<MasterpiecesConfig> => {
  // 检查缓存是否有效
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_DURATION) {
    return configCache;
  }

  const response = await fetch('/api/showmasterpiece/config');
  if (!response.ok) {
    throw new Error('获取配置失败');
  }
  
  const config = await response.json();
  
  // 更新缓存
  configCache = config;
  configCacheTime = now;
  
  return config;
};

export const updateConfig = async (configData: Partial<MasterpiecesConfig>): Promise<MasterpiecesConfig> => {
  const response = await fetch('/api/showmasterpiece/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(configData),
  });
  
  if (!response.ok) {
    throw new Error('更新配置失败');
  }
  
  const updatedConfig = await response.json();
  
  // 更新缓存
  configCache = updatedConfig;
  configCacheTime = Date.now();
  
  return updatedConfig;
};

export const resetConfig = async (): Promise<MasterpiecesConfig> => {
  const response = await fetch('/api/showmasterpiece/config', {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('重置配置失败');
  }
  
  const resetConfigData = await response.json();
  
  // 清除缓存
  configCache = resetConfigData;
  configCacheTime = Date.now();
  
  return resetConfigData;
};

// 画集管理
export const getAllCollections = async (): Promise<ArtCollection[]> => {
  console.log('📡 [服务] 开始获取所有画集...');
  
  try {
    // 添加时间戳参数防止缓存
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/showmasterpiece/collections?_t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('📡 [服务] 画集请求响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [服务] 获取画集失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const payload = await response.json();
    const collections = Array.isArray(payload)
      ? payload
      : (payload?.collections ?? payload?.data ?? []);

    if (!Array.isArray(collections)) {
      throw new Error('画集数据格式不正确');
    }

    console.log('✅ [服务] 画集数据获取成功:', {
      count: collections.length,
      titles: collections.map((c: ArtCollection) => c.title)
    });

    return collections;
  } catch (error) {
    console.error('❌ [服务] 获取画集数据失败:', error);
    throw error;
  }
};

export const createCollection = async (collectionData: CollectionFormData): Promise<ArtCollection> => {
  const requestBody = collectionData;
    
  const response = await fetch('/api/showmasterpiece/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('图片文件太大，请选择更小的图片或等待图片压缩完成后重试');
    }
    throw new Error('创建画集失败');
  }
  return await response.json();
};

export const updateCollection = async (id: number, collectionData: CollectionFormData): Promise<ArtCollection> => {
  const response = await fetch(`/api/showmasterpiece/collections/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(collectionData),
  });
  
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('图片文件太大，请选择更小的图片或等待图片压缩完成后重试');
    }
    throw new Error('更新画集失败');
  }
  return await response.json();
};

export const deleteCollection = async (id: number): Promise<void> => {
  const url = new URL(`/api/showmasterpiece/collections/${id}`, window.location.origin);
  
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '删除画集失败');
  }
};

// 画集顺序管理
export const updateCollectionOrder = async (collectionOrders: { id: number; displayOrder: number }[]): Promise<void> => {
  const response = await fetch('/api/showmasterpiece/collections?action=reorder', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collectionOrders }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '更新画集顺序失败');
  }
};

export const moveCollection = async (collectionId: number, targetOrder: number): Promise<void> => {
  const response = await fetch('/api/showmasterpiece/collections?action=move', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collectionId, targetOrder }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '移动画集失败');
  }
};

export const moveCollectionUp = async (collectionId: number): Promise<void> => {
  const response = await fetch('/api/showmasterpiece/collections?action=up', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collectionId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '上移画集失败');
  }
};

export const moveCollectionDown = async (collectionId: number): Promise<void> => {
  const response = await fetch('/api/showmasterpiece/collections?action=down', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collectionId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '下移画集失败');
  }
};

// 作品管理
export const addArtworkToCollection = async (collectionId: number, artworkData: ArtworkFormData): Promise<ArtworkPage> => {
  console.log('🌐 [服务] 开始发送作品创建请求:', {
    collectionId,
    title: artworkData.title,
            number: artworkData.number,
    imageSize: artworkData.image ? `${artworkData.image.length} chars` : 'null'
  });
  
  const requestBody = JSON.stringify(artworkData);
  console.log('📦 [服务] 请求体大小:', `${requestBody.length} chars (${(requestBody.length / 1024).toFixed(1)} KB)`);
  
  try {    
    const response = await fetch(`/api/showmasterpiece/collections/${collectionId}/artworks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    console.log('📡 [服务] 收到HTTP响应:', {
      status: response.status,
      statusText: response.statusText,
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type')
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [服务] HTTP请求失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200)
      });
      
      if (response.status === 413) {
        throw new Error('图片文件太大，请选择更小的图片或等待图片压缩完成后重试');
      }
      throw new Error(`添加作品失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ [服务] 作品创建成功:', {
      id: result.id,
      title: result.title,
              number: result.number
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ [服务] 请求过程中发生错误:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接后重试');
    }
    throw error;
  }
};

export const updateArtwork = async (collectionId: number, artworkId: number, artworkData: ArtworkFormData): Promise<ArtworkPage> => {
  const response = await fetch(`/api/showmasterpiece/collections/${collectionId}/artworks/${artworkId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(artworkData),
  });
  
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('图片文件太大，请选择更小的图片或等待图片压缩完成后重试');
    }
    throw new Error('更新作品失败');
  }
  return await response.json();
};

export const deleteArtwork = async (collectionId: number, artworkId: number): Promise<void> => {
  const url = new URL(`/api/showmasterpiece/collections/${collectionId}/artworks/${artworkId}`, window.location.origin);
  
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '删除作品失败');
  }
};

// 作品排序管理
export const getArtworksByCollection = async (collectionId: number): Promise<(ArtworkPage & { pageOrder: number })[]> => {
  // 添加时间戳参数防止缓存
  const timestamp = new Date().getTime();
  const response = await fetch(`/api/showmasterpiece/collections/${collectionId}/artworks?_t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  if (!response.ok) {
    throw new Error('获取作品列表失败');
  }
  return await response.json();
};

export const updateArtworkOrder = async (collectionId: number, artworkOrders: { id: number; pageOrder: number }[]): Promise<void> => {
  const response = await fetch(`/api/showmasterpiece/collections/${collectionId}/artworks?action=reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ artworkOrders }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '更新作品顺序失败');
  }
};

export const moveArtwork = async (collectionId: number, artworkId: number, targetOrder: number): Promise<void> => {
  const response = await fetch(`/api/showmasterpiece/collections/${collectionId}/artworks?action=move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ artworkId, targetOrder }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '移动作品失败');
  }
};

export const moveArtworkUp = async (collectionId: number, artworkId: number): Promise<void> => {
  const response = await fetch(`/api/showmasterpiece/collections/${collectionId}/artworks?action=up`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ artworkId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '上移作品失败');
  }
};

export const moveArtworkDown = async (collectionId: number, artworkId: number): Promise<void> => {
  const response = await fetch(`/api/showmasterpiece/collections/${collectionId}/artworks?action=down`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ artworkId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '下移作品失败');
  }
};

// 分类和标签
export const getCategories = async (): Promise<Array<{ name: string; description?: string | null }>> => {
  const response = await fetch('/api/showmasterpiece/categories');
  if (!response.ok) {
    throw new Error('获取分类失败');
  }
  const payload = await response.json();
  const categories = Array.isArray(payload) ? payload : (payload?.data ?? []);
  if (!Array.isArray(categories)) {
    throw new Error('分类数据格式不正确');
  }
  return categories;
};

export const createCategory = async (name: string, description?: string): Promise<void> => {
  const response = await fetch('/api/showmasterpiece/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '创建分类失败');
  }
};

export const getTags = async (): Promise<string[]> => {
  const response = await fetch('/api/showmasterpiece/tags');
  if (!response.ok) {
    throw new Error('获取标签失败');
  }
  return await response.json();
};

// 获取画集概览（不包含作品详情，用于列表展示）
export async function getCollectionsOverview(): Promise<Omit<ArtCollection, 'pages'>[]> {
  const response = await fetch('/api/showmasterpiece/collections?overview=true');
  if (!response.ok) {
    throw new Error('获取画集概览失败');
  }
  return response.json();
} 
