'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Database, Image, Calendar, RefreshCw, Bell, Cog } from 'lucide-react';
import { useMasterpiecesConfig, useBookingAdmin } from '../../../../logic/hooks';
import {
  ConfigFormData,
  CollectionFormData,
  ArtworkFormData,
  CollectionCategory,
  CollectionCategoryType,
  CategoryOption,
  buildDefaultHomeTabConfig,
  normalizeHomeTabConfig,
  normalizeMiniappFloatingButtonsConfig,
} from '../../../../types';
import { BookingAdminPanel } from '../../components/BookingAdminPanel';
import { PopupConfigManagement } from '../../components/PopupConfigManagement';
import { SystemConfigManager } from '../../components/SystemConfigManager';
import { shouldUseUniversalFileService, getStorageModeDisplayName } from '../../../../service/client-business/fileService';
import { createCategory as createCategoryService } from '../../../../service/client-business/masterpiecesConfigService';
import { AuthGuard, AuthProvider } from '@/auth/legacy';
import {
  Button,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components';

import { GeneralConfigTab } from './components/GeneralConfigTab';
import { HomeTabsTab } from './components/HomeTabsTab';
import { CollectionsTab } from './components/CollectionsTab';
import { ArtworksTab } from './components/ArtworksTab';

type TabType = 'general' | 'homeTabs' | 'collections' | 'artworks' | 'bookings' | 'popup' | 'system';

function ConfigPageContent() {
  const {
    config,
    collections,
    categories,
    tags,
    loading,
    error,
    updateConfig,
    resetConfig,
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
    refreshData,
  } = useMasterpiecesConfig();

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showArtworkForm, setShowArtworkForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<number | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<{ collectionId: number; artworkId: number } | null>(null);
  const [showArtworkOrder, setShowArtworkOrder] = useState(false);
  const [showCollectionOrder, setShowCollectionOrder] = useState(false);
  const [newHomeTabCategory, setNewHomeTabCategory] = useState('');
  const [newHomeTabDescription, setNewHomeTabDescription] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const {
    bookings,
    stats,
    loading: bookingLoading,
    error: bookingError,
    searchParams,
    refreshData: refreshBookingData,
    searchBookings,
    clearSearch,
    updateBookingStatus,
    deleteBooking,
    exportBookings,
  } = useBookingAdmin();

  const [, setUseUniversalService] = useState<boolean>(false);
  const [, setStorageModeDisplay] = useState<string>('检查中...');

  useEffect(() => {
    (async () => {
      try {
        setUseUniversalService(await shouldUseUniversalFileService());
        setStorageModeDisplay(await getStorageModeDisplayName());
      } catch {
        setUseUniversalService(false);
        setStorageModeDisplay('配置加载失败');
      }
    })();
  }, []);

  const [configForm, setConfigForm] = useState<ConfigFormData>({
    siteName: config?.siteName || '',
    siteDescription: config?.siteDescription || '',
    heroTitle: config?.heroTitle || '',
    heroSubtitle: config?.heroSubtitle || '',
    maxCollectionsPerPage: config?.maxCollectionsPerPage || 9,
    enableSearch: config?.enableSearch || true,
    enableCategories: config?.enableCategories || true,
    defaultCategory: config?.defaultCategory || 'all',
    homeTabConfig: normalizeHomeTabConfig(config?.homeTabConfig),
    miniappFloatingButtons: normalizeMiniappFloatingButtonsConfig(config?.miniappFloatingButtons),
    theme: config?.theme || 'light',
    language: config?.language || 'zh',
  });

  const [collectionForm, setCollectionForm] = useState<CollectionFormData>({
    title: '',
    number: '',
    coverImage: '',
    coverImageFileId: undefined,
    description: '',
    category: CollectionCategory.COLLECTION,
    tags: [],
    isPublished: true,
    price: undefined,
  });

  const [artworkForm, setArtworkForm] = useState<ArtworkFormData>({
    title: '',
    number: '',
    image: '',
    description: '',
    createdTime: '',
    theme: '',
  });

  React.useEffect(() => {
    if (config) {
      setConfigForm({
        siteName: config.siteName,
        siteDescription: config.siteDescription || '',
        heroTitle: config.heroTitle,
        heroSubtitle: config.heroSubtitle || '',
        maxCollectionsPerPage: config.maxCollectionsPerPage,
        enableSearch: config.enableSearch,
        enableCategories: config.enableCategories,
        defaultCategory: config.defaultCategory,
        homeTabConfig: normalizeHomeTabConfig(config.homeTabConfig),
        miniappFloatingButtons: normalizeMiniappFloatingButtonsConfig(config.miniappFloatingButtons),
        theme: config.theme,
        language: config.language,
      });
    }
  }, [config]);

  React.useEffect(() => { setCategoryOptions(categories); }, [categories]);

  // ─── HomeTabs handlers ────────────────────────────────────────────────────
  const handleHomeTabMove = (index: number, direction: -1 | 1) => {
    setConfigForm((prev) => {
      const items = [...prev.homeTabConfig];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const updated = [...items];
      const a = updated[index], b = updated[targetIndex];
      if (!a || !b) return prev;
      updated[index] = b;
      updated[targetIndex] = a;
      return { ...prev, homeTabConfig: normalizeHomeTabConfig(updated.map((item, i) => ({ ...item, order: i }))) };
    });
  };

  const handleHomeTabToggle = (category: CollectionCategoryType) => {
    setConfigForm((prev) => ({
      ...prev,
      homeTabConfig: normalizeHomeTabConfig(
        prev.homeTabConfig.map((item) =>
          item.category === category ? { ...item, visible: !item.visible } : item,
        ),
      ),
    }));
  };

  const handleResetHomeTabs = () => {
    setConfigForm((prev) => ({ ...prev, homeTabConfig: buildDefaultHomeTabConfig() }));
    setNewHomeTabCategory('');
    setNewHomeTabDescription('');
  };

  const handleSetAllHomeTabsVisible = (visible: boolean) => {
    setConfigForm((prev) => ({
      ...prev,
      homeTabConfig: normalizeHomeTabConfig(prev.homeTabConfig.map((item) => ({ ...item, visible }))),
    }));
  };

  const handleAddHomeTab = async () => {
    const trimmed = newHomeTabCategory.trim();
    const trimmedDescription = newHomeTabDescription.trim();
    if (!trimmed) { alert('分类名称不能为空'); setNewHomeTabCategory(''); return; }
    if (configForm.homeTabConfig.some((item) => item.category.toLowerCase() === trimmed.toLowerCase())) {
      alert('该分类已存在'); setNewHomeTabCategory(''); return;
    }
    const existingCategory = categoryOptions.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    const description = trimmedDescription || existingCategory?.description || '';
    if (!description) { alert('展示文案不能为空'); return; }
    try {
      if (!existingCategory) {
        await createCategoryService(trimmed, description);
        setCategoryOptions((prev) => [...prev, { name: trimmed, description }]);
      }
      setConfigForm((prev) => ({
        ...prev,
        homeTabConfig: normalizeHomeTabConfig([
          ...prev.homeTabConfig,
          { name: trimmed, description, category: trimmed as CollectionCategoryType, visible: true, order: prev.homeTabConfig.length },
        ]),
      }));
      setNewHomeTabCategory('');
      setNewHomeTabDescription('');
    } catch (error) {
      alert(error instanceof Error ? error.message : '新增分类失败');
    }
  };

  const handleRemoveHomeTab = (category: CollectionCategoryType) => {
    setConfigForm((prev) => {
      if (prev.homeTabConfig.length <= 1) return prev;
      return {
        ...prev,
        homeTabConfig: normalizeHomeTabConfig(prev.homeTabConfig.filter((item) => item.category !== category)),
      };
    });
  };

  // ─── Artwork tab auto-select ──────────────────────────────────────────────
  React.useEffect(() => {
    if (activeTab === 'artworks' && collections.length > 0) {
      if (selectedCollection && !collections.find(c => c.id === selectedCollection)) {
        setSelectedCollection(null);
        setShowArtworkOrder(false);
        setShowArtworkForm(false);
        setEditingArtwork(null);
      } else if (!selectedCollection) {
        setSelectedCollection(collections[0]?.id ?? null);
      }
    }
  }, [activeTab, collections, selectedCollection]);

  React.useEffect(() => {
    if (activeTab !== 'artworks' && (showArtworkOrder || showArtworkForm || editingArtwork)) {
      setShowArtworkOrder(false);
      setShowArtworkForm(false);
      setEditingArtwork(null);
    }
  }, [activeTab, showArtworkOrder, showArtworkForm, editingArtwork]);

  // ─── Save / reset config ──────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    try { await updateConfig(configForm); alert('配置保存成功！'); }
    catch { alert('配置保存失败！'); }
  };

  const handleResetConfig = async () => {
    if (confirm('确定要重置为默认配置吗？')) {
      try { await resetConfig(); alert('配置重置成功！'); }
      catch { alert('配置重置失败！'); }
    }
  };

  // ─── Collection CRUD ──────────────────────────────────────────────────────
  const handleSaveCollection = async () => {
    try {
      if (editingCollection) {
        await updateCollection(editingCollection, collectionForm);
        setEditingCollection(null);
      } else {
        await createCollection(collectionForm);
      }
      setShowCollectionForm(false);
      setCollectionForm({ title: '', number: '', coverImage: '', coverImageFileId: undefined, description: '', category: CollectionCategory.COLLECTION, tags: [], isPublished: true, price: undefined });
      alert('商品保存成功！');
    } catch { alert('商品保存失败！'); }
  };

  const handleEditCollection = (collection: any) => {
    setCollectionForm({
      title: collection.title,
      number: collection.number,
      coverImage: collection.coverImage,
      coverImageFileId: collection.coverImageFileId || undefined,
      description: collection.description,
      category: (collection.category as CollectionCategoryType) || CollectionCategory.COLLECTION,
      tags: collection.tags || [],
      isPublished: collection.isPublished ?? true,
      price: collection.price,
    });
    setEditingCollection(collection.id);
    setShowCollectionForm(true);
  };

  const handleToggleCollectionOrder = async () => {
    if (showCollectionOrder) await refreshData();
    setShowCollectionOrder(!showCollectionOrder);
  };

  // ─── Artwork CRUD ─────────────────────────────────────────────────────────
  const handleSaveArtwork = async () => {
    if (!selectedCollection) return;
    try {
      if (editingArtwork) {
        await updateArtwork(editingArtwork.collectionId, editingArtwork.artworkId, artworkForm);
        setEditingArtwork(null);
      } else {
        await addArtworkToCollection(selectedCollection, artworkForm);
      }
      setShowArtworkForm(false);
      setArtworkForm({ title: '', number: '', image: '', fileId: undefined, description: '', createdTime: '', theme: '' });
      alert('商品详情图保存成功！');
    } catch (err) {
      alert(`商品详情图保存失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleEditArtwork = (collectionId: number, artwork: any) => {
    setArtworkForm({ title: artwork.title, number: artwork.number, image: artwork.image, fileId: artwork.fileId, description: artwork.description, createdTime: artwork.createdTime, theme: artwork.theme });
    setEditingArtwork({ collectionId, artworkId: artwork.id });
    setShowArtworkForm(true);
  };

  const handleToggleArtworkOrder = async () => {
    if (!selectedCollection) { alert('请先选择一个商品'); return; }
    if (showArtworkOrder) await refreshData();
    setShowArtworkOrder(!showArtworkOrder);
  };

  // ─── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4">
          <p className="text-destructive text-lg">加载失败：{error}</p>
          <Button onClick={refreshData}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-8">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft size={20} />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold">商品展览配置管理</h1>
              <p className="text-sm text-muted-foreground">管理展览的所有配置、商品和商品详情图</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings size={16} />基础配置
            </TabsTrigger>
            <TabsTrigger value="homeTabs" className="flex items-center gap-2">
              <Settings size={16} />首页Tab配置
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Database size={16} />商品管理
            </TabsTrigger>
            <TabsTrigger value="artworks" className="flex items-center gap-2">
              <Image size={16} />商品详情管理
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar size={16} />预订管理
            </TabsTrigger>
            <TabsTrigger value="popup" className="flex items-center gap-2">
              <Bell size={16} />弹窗配置
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cog size={16} />系统配置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralConfigTab
              configForm={configForm}
              setConfigForm={setConfigForm}
              onSave={handleSaveConfig}
              onReset={handleResetConfig}
            />
          </TabsContent>

          <TabsContent value="homeTabs" className="space-y-6">
            <HomeTabsTab
              configForm={configForm}
              newHomeTabCategory={newHomeTabCategory}
              setNewHomeTabCategory={setNewHomeTabCategory}
              newHomeTabDescription={newHomeTabDescription}
              setNewHomeTabDescription={setNewHomeTabDescription}
              onSave={handleSaveConfig}
              onResetOrder={handleResetHomeTabs}
              onSetAllVisible={handleSetAllHomeTabsVisible}
              onMove={handleHomeTabMove}
              onToggle={handleHomeTabToggle}
              onAdd={handleAddHomeTab}
              onRemove={handleRemoveHomeTab}
            />
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <CollectionsTab
              collections={collections as any}
              collectionForm={collectionForm}
              setCollectionForm={setCollectionForm}
              showCollectionForm={showCollectionForm}
              setShowCollectionForm={setShowCollectionForm}
              editingCollection={editingCollection}
              setEditingCollection={setEditingCollection}
              showCollectionOrder={showCollectionOrder}
              categoryOptions={categoryOptions}
              onToggleOrder={handleToggleCollectionOrder}
              onSave={handleSaveCollection}
              onEdit={handleEditCollection}
              onDelete={deleteCollection}
              moveCollectionUp={moveCollectionUp}
              moveCollectionDown={moveCollectionDown}
              updateCollectionOrder={updateCollectionOrder}
            />
          </TabsContent>

          <TabsContent value="artworks" className="space-y-6">
            <ArtworksTab
              collections={collections as any}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              artworkForm={artworkForm}
              setArtworkForm={setArtworkForm}
              showArtworkForm={showArtworkForm}
              setShowArtworkForm={setShowArtworkForm}
              editingArtwork={editingArtwork}
              setEditingArtwork={setEditingArtwork}
              showArtworkOrder={showArtworkOrder}
              onToggleOrder={handleToggleArtworkOrder}
              onSave={handleSaveArtwork}
              onEdit={handleEditArtwork}
              onDelete={deleteArtwork}
              moveArtworkUp={moveArtworkUp}
              moveArtworkDown={moveArtworkDown}
              updateArtworkOrder={updateArtworkOrder}
            />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">预订管理</h2>
                <p className="text-slate-600">查看所有用户的预订信息</p>
              </div>
              <button
                onClick={refreshBookingData}
                disabled={bookingLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={bookingLoading ? 'animate-spin' : ''} />
                刷新数据
              </button>
            </div>
            <BookingAdminPanel
              bookings={bookings}
              stats={stats}
              loading={bookingLoading}
              error={bookingError}
              searchParams={searchParams}
              onRefresh={refreshBookingData}
              onSearch={searchBookings}
              onClearSearch={clearSearch}
              onUpdateStatus={updateBookingStatus}
              onDeleteBooking={deleteBooking}
              onExportBookings={exportBookings}
            />
          </TabsContent>

          <TabsContent value="popup" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">弹窗配置</h2>
              <p className="text-slate-600">管理购物车提交时的限时提醒弹窗设置</p>
            </div>
            <PopupConfigManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">系统配置</h2>
              <p className="text-slate-600">管理ShowMasterPieces模块的系统级配置项，为模块独立化做准备</p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Cog className="text-blue-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-blue-900">配置说明</h3>
                    <p className="text-blue-800 text-sm mt-1">
                      这里的配置项将用于ShowMasterPieces模块的独立运行。
                      新创建的配置项会自动添加<code className="bg-blue-100 px-1 rounded">SHOWMASTER_</code>前缀。
                    </p>
                    <p className="text-blue-700 text-xs mt-2">
                      💡 提示：这些配置独立于全局配置，便于模块打包和部署。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <SystemConfigManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <ConfigPageContent />
      </AuthGuard>
    </AuthProvider>
  );
}
