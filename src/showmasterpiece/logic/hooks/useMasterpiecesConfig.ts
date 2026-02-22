import { useState, useEffect } from 'react';
import { 
  getConfig,
  updateConfig,
  resetConfig,
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addArtworkToCollection,
  updateArtwork,
  deleteArtwork,
  moveArtworkUp,
  moveArtworkDown,
  updateArtworkOrder,
  moveCollectionUp,
  moveCollectionDown,
  updateCollectionOrder,
  getArtworksByCollection,
  getCategories,
  getTags
} from '../../services';
import type { 
  MasterpiecesConfig, 
  ArtCollection, 
  CollectionFormData, 
  ArtworkFormData,
  CategoryOption,
} from '../../types';

export const useMasterpiecesConfig = () => {
  const [config, setConfig] = useState<MasterpiecesConfig | null>(null);
  const [collections, setCollections] = useState<ArtCollection[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // 加载初始数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔄 [Hook] 开始加载数据...');
    //tabitem
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 [Hook] 并行请求所有数据...');
      
      // 强制不使用缓存，添加时间戳和特殊参数
      const timestamp = Date.now();
      const [configData, collectionsResponse, categoriesData, tagsData] = await Promise.all([
        getConfig(),
        fetch(`/api/showmasterpiece/collections?_t=${timestamp}&nocache=true&includeImages=true`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).then(r => r.json()),
        getCategories(),
        getTags()
      ]);
      
      // 从API响应中提取实际的画集数据
      const collectionsData = collectionsResponse.data || [];
      
      console.log('✅ [Hook] 数据加载完成:', {
        配置: configData ? '已加载' : '未加载',
        画集数量: collectionsData.length,
        分类数量: categoriesData.length,
        标签数量: tagsData.length
      });
      
      // 详细检查每个画集的作品数量
      if (collectionsData.length > 0) {
        console.log('📚 [Hook] 画集详情:');
        collectionsData.forEach((collection: ArtCollection, index: number) => {
          console.log(`  ${index + 1}. ${collection.title} - 作品数量: ${collection.pages.length}`);
          if (collection.pages.length > 0) {
            collection.pages.forEach((page: any, pageIndex: number) => {
              console.log(`    ${pageIndex + 1}. ${page.title} (ID: ${page.id})`);
            });
          }
        });
      }
      
      setConfig(configData);
      setCollections(collectionsData);
      setCategories(categoriesData);
      setTags(tagsData);
      
      console.log('💾 [Hook] 状态更新完成');
      
      // 返回加载的数据，供调用者使用
      return {
        config: configData,
        collections: collectionsData, // 这里已经是提取后的数组数据
        categories: categoriesData,
        tags: tagsData
      };
      
    } catch (err) {
      console.error('❌ [Hook] 加载数据失败:', err);
      console.error('错误详情:', {
        message: err instanceof Error ? err.message : '未知错误',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : '加载数据失败');
      throw err; // 重新抛出错误，让调用者知道加载失败
    } finally {
      setLoading(false);
      console.log('🏁 [Hook] 数据加载流程结束');
    }
  };

  // 统一错误处理函数
  const handleApiError = (error: unknown, operation: string) => {
    if (error instanceof Error) {
      if (error.message.includes('413') || error.message.includes('太大')) {
        throw new Error('图片文件过大，请使用压缩后的图片');
      }
      if (error.message.includes('401')) {
        throw new Error('没有权限执行此操作，请先登录');
      }
      if (error.message.includes('404') || error.message.includes('画集不存在')) {
        throw new Error('画集不存在或已被删除，请刷新页面后重试');
      }
      if (error.message.includes('409')) {
        // 冲突错误，可能是外键约束或其他数据完整性问题
        if (error.message.includes('画集不存在') || error.message.includes('已被删除')) {
          throw new Error('画集不存在或已被删除，请刷新页面后重试');
        }
        throw new Error(error.message); // 保留原始冲突错误信息
      }
      throw new Error(`${operation}失败：${error.message}`);
    }
    throw new Error(`${operation}失败：未知错误`);
  };

  // 配置管理
  const handleUpdateConfig = async (configData: Partial<MasterpiecesConfig>) => {
    try {
      const updatedConfig = await updateConfig(configData);
      setConfig(updatedConfig);
    } catch (err) {
      handleApiError(err, '更新配置');
    }
  };

  const handleResetConfig = async () => {
    try {
      const resetConfigData = await resetConfig();
      setConfig(resetConfigData);
    } catch (err) {
      handleApiError(err, '重置配置');
    }
  };

  // 画集管理
  const handleCreateCollection = async (collectionData: CollectionFormData) => {
    try {
      const newCollection = await createCollection(collectionData);
      // 重新加载数据以确保与数据库完全同步
      await loadData();
    } catch (err) {
      handleApiError(err, '创建画集');
    }
  };

  const handleUpdateCollection = async (id: number, collectionData: CollectionFormData) => {
    try {
      const updatedCollection = await updateCollection(id, collectionData);
      // 重新加载数据以确保与数据库完全同步
      await loadData();
    } catch (err) {
      handleApiError(err, '更新画集');
    }
  };

  const handleDeleteCollection = async (id: number) => {
    try {
      await deleteCollection(id);
      // 重新加载数据以确保与数据库完全同步
      await loadData();
    } catch (err) {
      handleApiError(err, '删除画集');
    }
  };

  // 作品管理
  const handleAddArtworkToCollection = async (collectionId: number, artworkData: ArtworkFormData) => {
    console.log('🎯 [Hook] 开始添加作品到画集:', {
      collectionId,
      title: artworkData.title,
              number: artworkData.number,
      imageSize: artworkData.image ? `${artworkData.image.length} chars` : 'null',
      description: artworkData.description?.substring(0, 50) + (artworkData.description && artworkData.description.length > 50 ? '...' : '')
    });
    
    try {
      console.log('📞 [Hook] 调用API服务...');
      const newArtwork = await addArtworkToCollection(collectionId, artworkData);
      console.log('✅ [Hook] API调用成功，返回作品:', {
        id: newArtwork.id,
        title: newArtwork.title,
        number: newArtwork.number
      });
      
      console.log('🔄 [Hook] 重新加载数据以确保与数据库完全同步...');
      // 重新加载数据以确保与数据库完全同步
      const reloadedData = await loadData();
      console.log('✅ [Hook] 数据重新加载完成');
      
      // 🔍 使用Promise等待下一个事件循环，确保React状态已更新
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 验证新作品是否在重新加载的数据中
      const targetCollection = reloadedData.collections.find((c: ArtCollection) => c.id === collectionId);
      if (targetCollection) {
        const newArtworkInCollection = targetCollection.pages.find((p: any) => p.id === newArtwork.id);
        if (newArtworkInCollection) {
          console.log('✅ [Hook] 验证成功：新作品已在画集中', {
            artworkId: newArtwork.id,
            collectionId: collectionId,
            artworkTitle: newArtworkInCollection.title
          });
        } else {
          console.error('❌ [Hook] 验证失败：新作品不在重新加载的数据中', {
            expectedArtworkId: newArtwork.id,
            collectionId: collectionId,
            currentArtworks: targetCollection.pages.map((p: any) => ({ id: p.id, title: p.title }))
          });
          // 再次尝试加载数据
          console.log('🔄 [Hook] 再次尝试重新加载数据...');
          await loadData();
        }
      } else {
        console.error('❌ [Hook] 验证失败：找不到目标画集', {
          collectionId,
          availableCollections: reloadedData.collections.map((c: ArtCollection) => ({ id: c.id, title: c.title }))
        });
      }
      
      // 🎉 强制触发一次额外的状态更新，确保UI显示最新数据
      console.log('🎉 [Hook] 强制更新状态以确保UI同步...');
      setCollections([...reloadedData.collections]);
      
      // 🔥 触发刷新计数器，强制组件重新渲染
      setRefreshCounter(prev => prev + 1);
      console.log('🔥 [Hook] 触发强制重新渲染');
      
    } catch (err) {
      console.error('❌ [Hook] 添加作品失败:', err);
      console.error('错误详情:', {
        message: err instanceof Error ? err.message : '未知错误',
        collectionId,
        artworkTitle: artworkData.title
      });
      handleApiError(err, '添加作品');
    }
  };

  const handleUpdateArtwork = async (collectionId: number, artworkId: number, artworkData: ArtworkFormData) => {
    try {
      const updatedArtwork = await updateArtwork(collectionId, artworkId, artworkData);
      // 重新加载数据以确保与数据库完全同步
      await loadData();
    } catch (err) {
      handleApiError(err, '更新作品');
    }
  };

  const handleDeleteArtwork = async (collectionId: number, artworkId: number) => {
    try {
      await deleteArtwork(collectionId, artworkId);
      // 重新加载数据以确保与数据库完全同步
      await loadData();
    } catch (err) {
      handleApiError(err, '删除作品');
    }
  };

  // 新增：作品排序管理
  const handleMoveArtworkUp = async (collectionId: number, artworkId: number) => {
    try {
      await moveArtworkUp(collectionId, artworkId);
      // 只更新特定画集的数据，避免重新加载所有数据
      await updateCollectionArtworks(collectionId);
    } catch (err) {
      handleApiError(err, '上移作品');
    }
  };

  const handleMoveArtworkDown = async (collectionId: number, artworkId: number) => {
    try {
      await moveArtworkDown(collectionId, artworkId);
      // 只更新特定画集的数据，避免重新加载所有数据
      await updateCollectionArtworks(collectionId);
    } catch (err) {
      handleApiError(err, '下移作品');
    }
  };

  const handleUpdateArtworkOrder = async (collectionId: number, artworkOrders: { id: number; pageOrder: number }[]) => {
    try {
      await updateArtworkOrder(collectionId, artworkOrders);
      // 只更新特定画集的数据，避免重新加载所有数据
      await updateCollectionArtworks(collectionId);
    } catch (err) {
      handleApiError(err, '更新作品顺序');
    }
  };

  // 更新特定画集的作品数据
  const updateCollectionArtworks = async (collectionId: number) => {
    try {
      const updatedArtworks = await getArtworksByCollection(collectionId);
      
      setCollections(prevCollections => 
        prevCollections.map(collection => 
          collection.id === collectionId 
            ? { ...collection, pages: updatedArtworks }
            : collection
        )
      );
    } catch (err) {
      console.error('更新画集作品数据失败:', err);
      // 如果更新失败，回退到重新加载所有数据
      await loadData();
    }
  };

  // 新增：画集排序管理
  const handleMoveCollectionUp = async (collectionId: number) => {
    try {
      await moveCollectionUp(collectionId);
      // 只更新画集数据，避免重新加载所有数据
      await updateCollectionsData();
    } catch (err) {
      handleApiError(err, '上移画集');
    }
  };

  const handleMoveCollectionDown = async (collectionId: number) => {
    try {
      await moveCollectionDown(collectionId);
      // 只更新画集数据，避免重新加载所有数据
      await updateCollectionsData();
    } catch (err) {
      handleApiError(err, '下移画集');
    }
  };

  const handleUpdateCollectionOrder = async (collectionOrders: { id: number; displayOrder: number }[]) => {
    try {
      await updateCollectionOrder(collectionOrders);
      // 只更新画集数据，避免重新加载所有数据
      await updateCollectionsData();
    } catch (err) {
      handleApiError(err, '更新画集顺序');
    }
  };

  // 更新画集数据
  const updateCollectionsData = async () => {
    try {
      const updatedCollections = await getAllCollections();
      setCollections(updatedCollections);
    } catch (err) {
      console.error('更新画集数据失败:', err);
      // 如果更新失败，回退到重新加载所有数据
      await loadData();
    }
  };

  // 刷新分类和标签
  const refreshCategoriesAndTags = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        getCategories(),
        getTags()
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (err) {
      console.error('刷新分类和标签失败:', err);
    }
  };

  return {
    // 数据
    config,
    collections,
    categories,
    tags,
    loading,
    error,
    refreshCounter,
    
    // 方法
    updateConfig: handleUpdateConfig,
    resetConfig: handleResetConfig,
    createCollection: handleCreateCollection,
    updateCollection: handleUpdateCollection,
    deleteCollection: handleDeleteCollection,
    addArtworkToCollection: handleAddArtworkToCollection,
    updateArtwork: handleUpdateArtwork,
    deleteArtwork: handleDeleteArtwork,
    
    // 新增：作品排序方法
    moveArtworkUp: handleMoveArtworkUp,
    moveArtworkDown: handleMoveArtworkDown,
    updateArtworkOrder: handleUpdateArtworkOrder,
    
    // 新增：画集排序方法
    moveCollectionUp: handleMoveCollectionUp,
    moveCollectionDown: handleMoveCollectionDown,
    updateCollectionOrder: handleUpdateCollectionOrder,
    
    refreshData: loadData,
  };
}; 
