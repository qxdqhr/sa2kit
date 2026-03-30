/**
 * ShowMasterpiece 主页面组件 - Tailwind CSS 版本
 * 
 * 这是ShowMasterpiece模块的主要页面组件，提供完整的画集浏览体验。
 * 支持两种视图模式：画集列表视图和作品详情视图。
 * 
 * 主要功能：
 * - 画集列表展示和搜索
 * - 画集详情浏览和作品查看
 * - 用户权限控制和认证
 * - 响应式设计和优化的用户体验
 * - 配置管理入口（需要管理员权限）
 * 
 * 技术特点：
 * - 使用自定义Hook进行状态管理
 * - 集成认证系统，支持权限控制
 * - 动态配置加载，支持个性化设置
 * - 性能优化：使用useMemo缓存计算结果
 * - 使用 Tailwind CSS 进行样式管理
 * 
 * @component
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Settings, History } from 'lucide-react';
import Link from 'next/link';
import { useMasterpieces, useDeadlinePopup } from '../../../logic/hooks';
import { getConfig } from '../../../service/client-business/masterpiecesConfigService';
import { MasterpiecesConfig, CollectionCategory, CollectionCategoryType, normalizeHomeTabConfig, getCategoryDisplayName } from '../../../types';
import { CollectionCard } from '../components/CollectionCard';
import { ArtworkViewer } from '../components/ArtworkViewer';
import { ThumbnailSidebar } from '../components/ThumbnailSidebar';
import { MobileAlbumViewer } from '../components/MobileAlbumViewer';
import { CartModal } from '../components/CartModal';
import { CartButton } from '../components/CartButton';
import { DeadlinePopupManager } from '../components/DeadlinePopup';
import { CartProvider } from '../../../logic/contexts/CartContext';
import { AuthProvider, useAuth, UserMenu, CustomMenuItem } from '@/auth/legacy';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components';

/**
 * ShowMasterpiece 内容组件
 * 
 * 主要的业务逻辑组件，包含状态管理和视图渲染。
 * 需要在AuthProvider包装器内使用，以便访问认证状态。
 * 
 * @returns React函数组件
 */
function ShowMasterPiecesContent() {
  // ===== Hooks和状态管理 =====
  
  /**
   * 使用自定义Hook管理画集数据和浏览状态
   * 包含画集列表、当前选中画集、翻页操作等
   */
  const {
    collections,        // 所有画集数据
    selectedCollection,  // 当前选中的画集
    currentPage,        // 当前作品页面索引
    loading,            // 数据加载状态
    error,              // 错误信息
    getCurrentArtwork,  // 获取当前作品的方法
    canGoNext,          // 是否可以下一页
    canGoPrev,          // 是否可以上一页
    selectCollection,   // 选择画集的方法
    nextPage,           // 下一页方法
    prevPage,           // 上一页方法
    goToPage,           // 跳转到指定页面的方法
    backToGallery,      // 返回画集列表的方法
  } = useMasterpieces();

  /** 获取用户认证状态和信息 */
  const { isAuthenticated, user } = useAuth();
  
  /** 系统配置状态 */
  const [config, setConfig] = useState<MasterpiecesConfig | null>(null);
  
  /** 购物车弹窗状态 */
  const [cartModalOpen, setCartModalOpen] = useState(false);
  
  /** 当前选中的分类 */
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategoryType>(
    CollectionCategory.OTHER
  );
  
  /** 主页弹窗管理 */
  const {
    configs: popupConfigs,
    hasPopup,
    loading: popupLoading,
    error: popupError,
    triggerCheck,
    closePopup,
    confirmPopup,
    cancelPopup,
  } = useDeadlinePopup('showmasterpiece', 'homepage_visit');

  // ===== 配置加载 =====
  
  /**
   * 组件挂载时加载系统配置
   * 配置信息用于自定义页面标题、副标题等显示内容
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await getConfig();
        setConfig(configData);
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    loadConfig();
  }, []);
  
  /**
   * 组件挂载时检查是否需要显示主页弹窗
   */
  useEffect(() => {
    const checkHomepagePopups = async () => {
      try {
        console.log('🔔 [ShowMasterPieces] 检查主页弹窗...');
        await triggerCheck();
      } catch (err) {
        console.error('❌ [ShowMasterPieces] 检查主页弹窗失败:', err);
      }
    };

    // 延迟检查，确保页面完全加载
    const timer = setTimeout(checkHomepagePopups, 1000);
    return () => clearTimeout(timer);
  }, [triggerCheck]);

  const homeTabConfig = useMemo(
    () => normalizeHomeTabConfig(config?.homeTabConfig),
    [config?.homeTabConfig],
  );

  const visibleHomeTabs = useMemo(
    () => homeTabConfig.filter((item) => item.visible),
    [homeTabConfig],
  );

  const firstVisibleCategory = visibleHomeTabs[0]?.category ?? CollectionCategory.OTHER;

  useEffect(() => {
    const isSelectedVisible = visibleHomeTabs.some((tab) => tab.category === selectedCategory);
    if (!isSelectedVisible) {
      setSelectedCategory(firstVisibleCategory);
    }
  }, [visibleHomeTabs, selectedCategory, firstVisibleCategory]);

  // ===== 数据过滤 =====
  
  /**
   * 根据选中的分类过滤画集
   * 使用 useMemo 缓存过滤结果，避免重复计算
   */
  const filteredCollections = useMemo(() => {
    return collections.filter(collection => collection.category === selectedCategory);
  }, [collections, selectedCategory]);

  // ===== 权限控制 =====
  
  /**
   * 使用 useMemo 缓存权限检查结果，避免重复计算
   * 
   * 权限判断逻辑：
   * - 必须已登录
   * - 用户角色为admin，或者
   * - 用户ID为1（临时管理员）
   */
  const hasAdminAccess = useMemo(() => {
    return isAuthenticated && (user?.role === 'admin' || user?.id === 1);
  }, [isAuthenticated, user?.role, user?.id]);

  // ===== 事件处理函数 =====
  
  /**
   * 处理配置按钮点击事件
   * 检查权限后跳转到配置页面
   */
  const handleConfigClick = () => {
    if (!hasAdminAccess) {
      alert('需要管理员权限才能访问配置页面');
      return;
    }
    window.location.href = '/testField/ShowMasterPieces/config';
  };

  /**
   * 处理购物车按钮点击事件
   * 打开购物车弹窗
   */
  const handleCartClick = () => {
    setCartModalOpen(true);
  };

  // ===== 弹窗处理函数 =====
  
  /**
   * 处理主页弹窗确认
   */
  const handleHomepagePopupConfirm = (configId: string) => {
    console.log('✅ [ShowMasterPieces] 用户确认主页弹窗:', configId);
    confirmPopup(configId);
  };

  /**
   * 处理主页弹窗取消
   */
  const handleHomepagePopupCancel = (configId: string) => {
    console.log('❌ [ShowMasterPieces] 用户取消主页弹窗:', configId);
    cancelPopup(configId);
  };

  // ===== 渲染函数 =====
  
  /**
   * 渲染加载状态
   */
  const renderLoading = () => (
    <div className="min-h-screen bg-gradient-to-br from-white to-prussian-blue-900/5 overflow-x-hidden">
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4">
        <div className="w-10 h-10 border-4 border-prussian-blue-300 border-t-moonstone rounded-full animate-spin"></div>
        <p className="text-prussian-blue-600">加载中...</p>
      </div>
    </div>
  );

  /**
   * 渲染错误状态
   */
  const renderError = () => (
    <div className="min-h-screen bg-gradient-to-br from-white to-prussian-blue-900/5 overflow-x-hidden">
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4 text-center">
        <p className="text-destructive text-lg">加载失败：{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-moonstone to-cerulean hover:from-cerulean hover:to-moonstone text-white shadow-lg transition-all duration-300"
        >
          重试
        </Button>
      </div>
    </div>
  );

  /**
   * 渲染空状态
   */
  const renderEmptyState = () => (
    <div className="min-h-screen bg-gradient-to-br from-white to-prussian-blue-900/5 overflow-x-hidden">
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4 text-center">
        <div className="text-moonstone text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-semibold mb-2 text-rich-black">暂无可用画集</h3>
        <p className="text-prussian-blue-600 mb-6">当前没有可预订的画集，请稍后再试</p>
        {hasAdminAccess && (
          <Button 
            asChild 
            className="bg-gradient-to-r from-moonstone to-cerulean hover:from-cerulean hover:to-moonstone text-white shadow-lg transition-all duration-300"
          >
            <a href="/testField/ShowMasterPieces/config" className="gap-2">
            <Settings size={20} />
            前往配置页面
          </a>
          </Button>
        )}
      </div>
    </div>
  );

  // ===== 主渲染逻辑 =====
  
  // 加载状态
  if (loading) {
    return renderLoading();
  }

  // 错误状态
  if (error) {
    return renderError();
  }

  // 空状态
  if (!collections || collections.length === 0) {
    return renderEmptyState();
  }

  // 获取用户ID，临时默认为1（应该要求登录）
  const userId = user?.id || 1;

  const categoryList = visibleHomeTabs.map((tab) => ({
    category: tab.category,
    displayName: tab.description || tab.name || getCategoryDisplayName(tab.category),
  }));

  return (
    <CartProvider userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-white to-prussian-blue-900/5 overflow-x-hidden">
        {/* 顶部导航 */}
        <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-prussian-blue-200/30 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[44px]">
              {/* 左侧：返回按钮和标题 */}
              <div className="flex items-center gap-4 sm:gap-8 min-w-0 flex-1">
                {selectedCollection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={backToGallery}
                    className="gap-1 sm:gap-2 min-h-[44px] min-w-[44px] flex-shrink-0"
                  >
                    <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">返回</span>
                  </Button>
                )}
                <div className="text-center sm:text-left min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold m-0 truncate text-rich-black">
                      {config?.heroTitle || '艺术画集展览'}
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm text-prussian-blue-600 m-0 hidden sm:block truncate">
                    {config?.heroSubtitle || '探索精美的艺术作品，感受创作的魅力'}
                  </p>
                </div>
              </div>

              {/* 右侧：用户菜单和操作按钮 */}
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                {/* 历史记录链接 */}
                <Link
                  href="/testField/ShowMasterPieces/history"
                  className="flex items-center gap-1 sm:gap-2 text-prussian-blue-600 hover:text-moonstone transition-colors p-1 sm:p-2 rounded-lg min-h-[44px] min-w-[44px] flex-shrink-0"
                  title="查看预订历史"
                >
                  <History size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">历史记录</span>
                </Link>
                
                {/* 购物车按钮 */}
                <CartButton 
                  onClick={handleCartClick} 
                  className="relative p-1 sm:p-2 text-prussian-blue-600 hover:text-moonstone transition-colors" 
                  userId={userId}
                />
                
                {/* 用户菜单 */}
                <UserMenu 
                  customMenuItems={hasAdminAccess ? [
                    {
                      id: 'showmasterpiece-admin',
                      label: '画集管理',
                      icon: Settings,
                      onClick: handleConfigClick,
                      requireAuth: true
                    }
                  ] : []}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        {selectedCollection ? (
          /* 手机相册风格的作品浏览视图 */
          <div className="fixed inset-0 top-[76px] z-40">
            <MobileAlbumViewer
              artworks={selectedCollection.pages}
              collectionId={selectedCollection.id}
              currentIndex={currentPage}
              onIndexChange={goToPage}
              onNext={nextPage}
              onPrev={prevPage}
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
            {/* 画集列表视图 */}
            <div className="space-y-6">
              {/* 分类筛选 */}
              <Card>
                <CardHeader>
                  <CardTitle>商品分类</CardTitle>
                  <CardDescription>选择您感兴趣的商品类型</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CollectionCategoryType)}>
                    <TabsList className="grid grid-cols-3 lg:grid-cols-9 h-auto p-1 bg-moonstone-900/10">
                      {categoryList.map(({ category, displayName }) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="flex flex-col h-auto py-3 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-moonstone data-[state=active]:to-cerulean data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                        >
                          <span className="font-semibold text-xs">{displayName}</span>
                          <Badge variant="outline" className="mt-1 text-xs border-moonstone/30 text-cerulean bg-moonstone-900/5">
                            {collections.filter(c => c.category === category).length}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {/* 画集网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    userId={userId}
                    onSelect={selectCollection}
                  />
                ))}
              </div>
              
              {/* 空状态提示 */}
              {filteredCollections.length === 0 && collections.length > 0 && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="text-prussian-blue-400 text-base sm:text-lg mb-2">
                    当前分类暂无内容
                  </div>
                  <p className="text-prussian-blue-500 text-xs sm:text-sm">
                    请尝试选择其他分类查看
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 购物车弹窗 */}
        <CartModal 
          isOpen={cartModalOpen} 
          onClose={() => setCartModalOpen(false)} 
          title="购物车" 
          userId={userId}
        />

        {/* 主页限时弹窗管理器 */}
        {hasPopup && (
          <DeadlinePopupManager
            configs={popupConfigs}
            onClose={closePopup}
            onConfirm={handleHomepagePopupConfirm}
            onCancel={handleHomepagePopupCancel}
          />
        )}
      </div>
    </CartProvider>
  );
}

interface ShowMasterPiecesPageProps {
  /** Next.js 页面参数 */
  params?: Record<string, string>;
  /** Next.js 搜索参数 */
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * ShowMasterpiece 主组件
 * 
 * 提供认证上下文包装器，确保组件能够访问用户认证状态。
 * 这是模块的对外接口组件。
 * 
 * @returns React函数组件
 */
export default function ShowMasterPieces(props: ShowMasterPiecesPageProps = {}) {
  return (
    <AuthProvider>
      <ShowMasterPiecesContent />
    </AuthProvider>
  );
}

// 导出组件和类型，供其他模块使用
export { ShowMasterPieces as ShowMasterPiecesPage };
export type { ShowMasterPiecesPageProps }; 
