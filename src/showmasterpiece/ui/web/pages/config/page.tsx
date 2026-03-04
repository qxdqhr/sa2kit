'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Database, Image, Tag, Save, RotateCcw, Plus, Edit, Trash2, ArrowUpDown, Calendar, RefreshCw, Bell, Cog } from 'lucide-react';
import { useMasterpiecesConfig, useBookingAdmin } from '../../../../logic/hooks';
import { ConfigFormData, CollectionFormData, ArtworkFormData, CollectionCategory, CollectionCategoryType, CategoryOption, buildDefaultHomeTabConfig, normalizeHomeTabConfig, getCategoryDisplayName } from '../../../../types';
import { UniversalImageUpload } from '../../components/UniversalImageUpload';
import { CollectionOrderManagerV2 as CollectionOrderManager } from '../../components/CollectionOrderManagerV2';
import { ArtworkOrderManagerV2 as ArtworkOrderManager } from '../../components/ArtworkOrderManagerV2';
import { BookingAdminPanel } from '../../components/BookingAdminPanel';
import { PopupConfigManagement } from '../../components/PopupConfigManagement';
import { SystemConfigManager } from '../../components/SystemConfigManager';
import { shouldUseUniversalFileService, getStorageModeDisplayName } from '../../../../service/client-business/fileService';
import { createCategory as createCategoryService } from '../../../../service/client-business/masterpiecesConfigService';
import { AuthGuard, AuthProvider } from '@/auth/legacy';
import { 
  Button, 
  Input, 
  Label, 
  Textarea, 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  Badge,
  Separator,
  ScrollArea,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components';

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

  // 预订管理Hook
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

  // 检查是否使用通用文件服务
  const [useUniversalService, setUseUniversalService] = useState<boolean>(false);
  const [storageModeDisplay, setStorageModeDisplay] = useState<string>('检查中...');

  // 加载文件服务配置
  useEffect(() => {
    const loadFileServiceConfig = async () => {
      try {
        const shouldUse = await shouldUseUniversalFileService();
        const displayName = await getStorageModeDisplayName();
        setUseUniversalService(shouldUse);
        setStorageModeDisplay(displayName);
      } catch (error) {
        console.error('加载文件服务配置失败:', error);
        setUseUniversalService(false);
        setStorageModeDisplay('配置加载失败');
      }
    };
    loadFileServiceConfig();
  }, []);

  // 预订管理包装函数
  const handleBookingSearch = searchBookings;
  const handleBookingClearSearch = clearSearch;
  const handleBookingRefresh = refreshBookingData;

  // 配置表单状态
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
    theme: config?.theme || 'light',
    language: config?.language || 'zh',
  });

  // 商品表单状态
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

  // 商品详情图表单状态
  const [artworkForm, setArtworkForm] = useState<ArtworkFormData>({
    title: '',
    number: '',
    image: '',
    description: '',
    createdTime: '',
    theme: '',
  });

  // 更新配置表单
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
        theme: config.theme,
        language: config.language,
      });
    }
  }, [config]);

  React.useEffect(() => {
    setCategoryOptions(categories);
  }, [categories]);

  const handleHomeTabMove = (index: number, direction: -1 | 1) => {
    setConfigForm((prev) => {
      const items = [...prev.homeTabConfig];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= items.length) {
        return prev;
      }
      const updated = [...items];
      const currentItem = updated[index];
      const targetItem = updated[targetIndex];
      if (!currentItem || !targetItem) {
        return prev;
      }
      updated[index] = targetItem;
      updated[targetIndex] = currentItem;
      const normalized = normalizeHomeTabConfig(
        updated.map((item, newIndex) => ({ ...item, order: newIndex })),
      );
      return { ...prev, homeTabConfig: normalized };
    });
  };

  const handleHomeTabToggle = (category: CollectionCategoryType) => {
    setConfigForm((prev) => {
      const updated = prev.homeTabConfig.map((item) =>
        item.category === category ? { ...item, visible: !item.visible } : item,
      );
      return { ...prev, homeTabConfig: normalizeHomeTabConfig(updated) };
    });
  };

  const handleResetHomeTabs = () => {
    setConfigForm((prev) => ({
      ...prev,
      homeTabConfig: buildDefaultHomeTabConfig(),
    }));
    setNewHomeTabCategory('');
    setNewHomeTabDescription('');
  };

  const handleSetAllHomeTabsVisible = (visible: boolean) => {
    setConfigForm((prev) => {
      const updated = prev.homeTabConfig.map((item) => ({
        ...item,
        visible,
      }));
      return { ...prev, homeTabConfig: normalizeHomeTabConfig(updated) };
    });
  };

  const handleAddHomeTab = async () => {
    const trimmed = newHomeTabCategory.trim();
    const trimmedDescription = newHomeTabDescription.trim();
    if (!trimmed) {
       alert('分类名称不能为空');
      setNewHomeTabCategory('');
      return;
    }
    const exists = configForm.homeTabConfig.some(
      (item) => item.category.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      alert('该分类已存在');
      setNewHomeTabCategory('');
      return;
    }
    const existingCategory = categoryOptions.find(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase(),
    );
    const description = trimmedDescription || existingCategory?.description || '';
    if (!description) {
      alert('展示文案不能为空');
      return;
    }

    try {
      if (!existingCategory) {
        await createCategoryService(trimmed, description);
        setCategoryOptions((prev) => [...prev, { name: trimmed, description }]);
      }

      setConfigForm((prev) => {
        const updated = [
          ...prev.homeTabConfig,
          {
            name: trimmed,
            description,
            category: trimmed as CollectionCategoryType,
            visible: true,
            order: prev.homeTabConfig.length,
          },
        ];
        return { ...prev, homeTabConfig: normalizeHomeTabConfig(updated) };
      });
      setNewHomeTabCategory('');
      setNewHomeTabDescription('');
    } catch (error) {
      console.error('新增分类失败:', error);
      alert(error instanceof Error ? error.message : '新增分类失败');
    }
  };

  const handleRemoveHomeTab = (category: CollectionCategoryType) => {
    setConfigForm((prev) => {
      if (prev.homeTabConfig.length <= 1) {
        return prev;
      }
      const updated = prev.homeTabConfig.filter((item) => item.category !== category);
      return { ...prev, homeTabConfig: normalizeHomeTabConfig(updated) };
    });
  };

  // 商品详情图管理tab自动选择商品逻辑
  React.useEffect(() => {
    if (activeTab === 'artworks' && collections.length > 0) {
      // 检查当前选择的商品是否还存在
      if (selectedCollection && !collections.find(c => c.id === selectedCollection)) {
        console.log('⚠️ [配置页面] 当前选择的商品已不存在，重置选择');
        setSelectedCollection(null);
        setShowArtworkOrder(false);
        setShowArtworkForm(false);
        setEditingArtwork(null);
      }
      // 如果用户未选择商品，自动选择第一个
      else if (!selectedCollection) {
        const firstCollection = collections[0];
        if (firstCollection) {
          console.log('🎯 [配置页面] 商品详情图管理tab首次进入，自动选择第一个商品:', {
            selectedCollection: firstCollection.id,
            title: firstCollection.title
          });
          setSelectedCollection(firstCollection.id);
        }
      }
      // 如果用户已选择且商品存在，保留用户选择
      else {
        const currentCollection = collections.find(c => c.id === selectedCollection);
        console.log('✅ [配置页面] 保留用户选择的商品:', {
          selectedCollection: selectedCollection,
          title: currentCollection?.title
        });
      }
    }
  }, [activeTab, collections, selectedCollection]);

  // 当离开商品详情图管理tab时，重置相关UI状态但保留用户选择的商品
  React.useEffect(() => {
    if (activeTab !== 'artworks') {
      // 只重置UI状态，保留selectedCollection让用户下次进入时还能看到之前选择的商品
      if (showArtworkOrder || showArtworkForm || editingArtwork) {
        console.log('🔄 [配置页面] 离开商品详情图管理tab，重置UI状态但保留用户选择');
        setShowArtworkOrder(false);
        setShowArtworkForm(false);
        setEditingArtwork(null);
      }
    }
  }, [activeTab, showArtworkOrder, showArtworkForm, editingArtwork]);

  // 处理配置保存
  const handleSaveConfig = async () => {
    try {
      await updateConfig(configForm);
      alert('配置保存成功！');
    } catch (err) {
      alert('配置保存失败！');
    }
  };

  // 处理配置重置
  const handleResetConfig = async () => {
    if (confirm('确定要重置为默认配置吗？')) {
      try {
        await resetConfig();
        alert('配置重置成功！');
      } catch (err) {
        alert('配置重置失败！');
      }
    }
  };

  // 处理商品保存
  const handleSaveCollection = async () => {
    try {
      if (editingCollection) {
        await updateCollection(editingCollection, collectionForm);
        setEditingCollection(null);
      } else {
        await createCollection(collectionForm);
      }
      
      setShowCollectionForm(false);
      setCollectionForm({
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
      alert('商品保存成功！');
    } catch (err) {
      alert('商品保存失败！');
    }
  };

  // 处理商品详情图保存
  const handleSaveArtwork = async () => {
    if (!selectedCollection) return;
    
    console.log('📝 [配置页面] 开始保存商品详情图:', {
      isEditing: !!editingArtwork,
      selectedCollection,
      title: artworkForm.title,
      number: artworkForm.number,
      imagePresent: !!artworkForm.image,
      imageSize: artworkForm.image ? `${artworkForm.image.length} chars` : 'null'
    });
    
    try {
      if (editingArtwork) {
        console.log('✏️ [配置页面] 执行商品详情图更新...', {
          collectionId: editingArtwork.collectionId,
          artworkId: editingArtwork.artworkId
        });
        await updateArtwork(editingArtwork.collectionId, editingArtwork.artworkId, artworkForm);
        setEditingArtwork(null);
        console.log('✅ [配置页面] 商品详情图更新完成');
      } else {
        console.log('➕ [配置页面] 执行商品详情图创建...', {
          collectionId: selectedCollection
        });
        await addArtworkToCollection(selectedCollection, artworkForm);
        console.log('✅ [配置页面] 商品详情图创建完成');
      }
      
      console.log('🧹 [配置页面] 清理表单状态...');
      setShowArtworkForm(false);
      setArtworkForm({
        title: '',
        number: '',
        image: '',
        fileId: undefined,
        description: '',
        createdTime: '',
        theme: '',
      });
      
      alert('商品详情图保存成功！');
      console.log('🎉 [配置页面] 商品详情图保存流程完成');
      
    } catch (err) {
      console.error('❌ [配置页面] 保存商品详情图时发生错误:', err);
      console.error('错误上下文:', {
        isEditing: !!editingArtwork,
        selectedCollection,
        artworkTitle: artworkForm.title,
        errorMessage: err instanceof Error ? err.message : '未知错误',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      const errorMessage = err instanceof Error ? err.message : '商品详情图保存失败';
      alert(`商品详情图保存失败：${errorMessage}`);
    }
  };

  // 编辑商品
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

  // 编辑商品详情图
  const handleEditArtwork = (collectionId: number, artwork: any) => {
    setArtworkForm({
      title: artwork.title,
      number: artwork.number,
      image: artwork.image,
      fileId: artwork.fileId,
      description: artwork.description,
      createdTime: artwork.createdTime,
      theme: artwork.theme,
    });
    setEditingArtwork({ collectionId, artworkId: artwork.id });
    setShowArtworkForm(true);
  };

  // 切换商品详情图排序显示
  const handleToggleArtworkOrder = async () => {
    if (!selectedCollection) {
      alert('请先选择一个商品');
      return;
    }
    
    // 如果当前是排序模式，关闭时需要重新加载数据
    if (showArtworkOrder) {
      console.log('🔄 [配置页面] 关闭商品详情图排序，重新加载数据...');
      await refreshData();
    }
    
    setShowArtworkOrder(!showArtworkOrder);
  };

  // 切换商品排序显示
  const handleToggleCollectionOrder = async () => {
    // 如果当前是排序模式，关闭时需要重新加载数据
    if (showCollectionOrder) {
      console.log('🔄 [配置页面] 关闭商品排序，重新加载数据...');
      await refreshData();
    }
    
    setShowCollectionOrder(!showCollectionOrder);
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4">
          <p className="text-destructive text-lg">加载失败：{error}</p>
          <Button onClick={refreshData}>
            重试
          </Button>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2"
            >
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

      

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings size={16} />
              基础配置
            </TabsTrigger>
            <TabsTrigger value="homeTabs" className="flex items-center gap-2">
              <Settings size={16} />
              首页Tab配置
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Database size={16} />
              商品管理
            </TabsTrigger>
            <TabsTrigger value="artworks" className="flex items-center gap-2">
              <Image size={16} />
              商品详情管理
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar size={16} />
              预订管理
            </TabsTrigger>
            <TabsTrigger value="popup" className="flex items-center gap-2">
              <Bell size={16} />
              弹窗配置
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cog size={16} />
              系统配置
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>基础配置</CardTitle>
                    <CardDescription>配置网站的基本信息和显示选项</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={handleResetConfig}
                      className="gap-2"
                    >
                      <RotateCcw size={16} />
                      重置默认
                    </Button>
                    <Button 
                      onClick={handleSaveConfig}
                      className="gap-2"
                    >
                      <Save size={16} />
                      保存配置
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">网站名称</Label>
                    <Input
                      id="siteName"
                      type="text"
                      value={configForm.siteName}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, siteName: e.target.value }))}
                      placeholder="输入网站名称"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">网站描述</Label>
                    <Textarea
                      id="siteDescription"
                      value={configForm.siteDescription}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, siteDescription: e.target.value }))}
                      placeholder="输入网站描述"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroTitle">主标题</Label>
                    <Input
                      id="heroTitle"
                      type="text"
                      value={configForm.heroTitle}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, heroTitle: e.target.value }))}
                      placeholder="输入主标题"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">副标题</Label>
                    <Textarea
                      id="heroSubtitle"
                      value={configForm.heroSubtitle}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                      placeholder="输入副标题"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxCollections">每页显示商品数量</Label>
                    <Input
                      id="maxCollections"
                      type="number"
                      value={configForm.maxCollectionsPerPage}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, maxCollectionsPerPage: parseInt(e.target.value) }))}
                      min="1"
                      max="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">主题</Label>
                    <Select
                      value={configForm.theme}
                      onValueChange={(value) => setConfigForm(prev => ({ ...prev, theme: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择主题" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">浅色</SelectItem>
                        <SelectItem value="dark">深色</SelectItem>
                        <SelectItem value="auto">自动</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">语言</Label>
                    <Select
                      value={configForm.language}
                      onValueChange={(value) => setConfigForm(prev => ({ ...prev, language: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择语言" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="enableSearch"
                      type="checkbox"
                      checked={configForm.enableSearch}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, enableSearch: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="enableSearch" className="text-sm font-medium">
                      启用搜索功能
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="enableCategories"
                      type="checkbox"
                      checked={configForm.enableCategories}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, enableCategories: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="enableCategories" className="text-sm font-medium">
                      启用分类功能
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homeTabs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>首页分类Tab配置</CardTitle>
                    <CardDescription>管理首页分类Tab的显示顺序与显示/隐藏</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => handleSetAllHomeTabsVisible(true)}>
                      全部显示
                    </Button>
                    <Button variant="outline" onClick={() => handleSetAllHomeTabsVisible(false)}>
                      全部隐藏
                    </Button>
                    <Button variant="outline" onClick={handleResetHomeTabs} className="gap-2">
                      <RotateCcw size={16} />
                      重置顺序
                    </Button>
                    <Button onClick={handleSaveConfig} className="gap-2">
                      <Save size={16} />
                      保存配置
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
                    <div className="flex-1 space-y-2">
                      <Label>分类名称</Label>
                      <Input
                        value={newHomeTabCategory}
                        onChange={(e) => setNewHomeTabCategory(e.target.value)}
                        placeholder="输入分类名称"
                      />
                      <Label>展示文案</Label>
                      <Input
                        value={newHomeTabDescription}
                        onChange={(e) => setNewHomeTabDescription(e.target.value)}
                        placeholder="输入展示文案"
                      />
                    </div>
                  <Button onClick={handleAddHomeTab} className="gap-2">
                    <Plus size={16} />
                    新增Tab
                  </Button>
                </div>

                <div className="space-y-2">
                  {configForm.homeTabConfig.map((item, index) => (
                    <div
                      key={item.category}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-slate-200 rounded-lg bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">
                            {item.description || item.name || getCategoryDisplayName(item.category)}
                          </span>
                          {item.description ? (
                            <span className="text-xs text-slate-500">{item.name || item.category}</span>
                          ) : null}
                        </div>
                        {!item.visible && (
                          <Badge variant="secondary" className="text-xs">
                            已隐藏
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHomeTabMove(index, -1)}
                          disabled={index === 0}
                        >
                          上移
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHomeTabMove(index, 1)}
                          disabled={index === configForm.homeTabConfig.length - 1}
                        >
                          下移
                        </Button>
                        <Button
                          variant={item.visible ? 'secondary' : 'default'}
                          size="sm"
                          onClick={() => handleHomeTabToggle(item.category)}
                        >
                          {item.visible ? '隐藏' : '显示'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveHomeTab(item.category)}
                          disabled={configForm.homeTabConfig.length <= 1}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>商品管理</CardTitle>
                    <CardDescription>管理商品</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setCollectionForm({
                          title: '',
                          number: '',
                          coverImage: '',
                          description: '',
                          category: CollectionCategory.COLLECTION,
                          tags: [],
                          isPublished: true,
                          price: undefined,
                        });
                        setEditingCollection(null);
                        setShowCollectionForm(true);
                      }}
                      className="gap-2"
                    >
                      <Plus size={16} />
                      添加商品
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleCollectionOrder()}
                      className="gap-2"
                    >
                      <ArrowUpDown size={16} />
                      {showCollectionOrder ? '关闭排序' : '商品排序'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>

            {showCollectionOrder && (
              <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">商品排序管理</h3>
                  <p className="text-slate-600">
                    拖拽或使用按钮调整商品在前台的显示顺序
                  </p>
                </div>
                <CollectionOrderManager
                  moveCollectionUp={moveCollectionUp}
                  moveCollectionDown={moveCollectionDown}
                  updateCollectionOrder={updateCollectionOrder}
                  onOrderChanged={async () => {
                    console.log('🔄 [配置页面] 商品顺序已更新（排序组件内部已处理数据更新）');
                    // 排序组件内部已经更新了数据，这里不需要额外操作
                  }}
                />
              </div>
            )}

            {!showCollectionOrder && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collections.map((collection) => (
                    <div key={collection.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {collection.coverImage ? (
                        <img 
                          src={collection.coverImage} 
                          alt={collection.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-400 text-sm">暂无封面</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">{collection.title}</h3>
                      <p className="text-slate-600 text-sm mb-1">编号：{collection.number}</p>
                      <p className="text-slate-600 text-sm mb-1">分类：{collection.category.displayName}</p>
                      <p className="text-slate-600 text-sm mb-1">价格：{collection.price ? `¥${collection.price}` : '免费'}</p>
                      <p className="text-slate-600 text-sm mb-1">商品详情图数量：{collection.pages.length}</p>
                      <p className="text-slate-600 text-sm mb-3">状态：{collection.isPublished ? '已发布' : '草稿'}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCollection(collection)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-200 transition-colors"
                        >
                          <Edit size={14} />
                          编辑
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('确定要删除这个商品吗？')) {
                              await deleteCollection(collection.id);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artworks" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">商品详情图管理</h2>
              <div className="flex gap-3">
                <select
                  value={selectedCollection || ''}
                  onChange={(e) => setSelectedCollection(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">选择商品</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title}
                    </option>
                  ))}
                </select>
                {selectedCollection && (
                  <>
                    <button
                      onClick={() => {
                        setArtworkForm({
                          title: '',
                          number: '',
                          image: '',
                          description: '',
                          createdTime: '',
                          theme: '',
                        });
                        setEditingArtwork(null);
                        setShowArtworkForm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                      添加商品详情图
                    </button>
                    <button
                      onClick={handleToggleArtworkOrder}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                      <ArrowUpDown size={16} />
                      {showArtworkOrder ? '关闭排序' : '商品详情图排序'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {selectedCollection && showArtworkOrder && (
              <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">商品详情图排序管理</h3>
                  <p className="text-slate-600">
                    拖拽或使用按钮调整商品详情图在商品中的显示顺序
                  </p>
                </div>
                <ArtworkOrderManager
                  collectionId={selectedCollection}
                  moveArtworkUp={moveArtworkUp}
                  moveArtworkDown={moveArtworkDown}
                  updateArtworkOrder={updateArtworkOrder}
                  onOrderChanged={async () => {
                    console.log('🔄 [配置页面] 商品详情图顺序已更新（排序组件内部已处理数据更新）');
                    // 排序组件内部已经更新了数据，这里不需要额外操作
                  }}
                />
              </div>
            )}

            {selectedCollection && !showArtworkOrder && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections
                  .find(c => c.id === selectedCollection)
                  ?.pages.map((artwork: any) => (
                    <div key={artwork.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-48 bg-slate-100 overflow-hidden">
                        {artwork.image && (
                          <img 
                            src={artwork.image} 
                            alt={artwork.title} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-semibold text-slate-800 mb-2">{artwork.title}</h4>
                        <p className="text-slate-600 text-sm mb-1">编号：{artwork.number}</p>
                        <p className="text-slate-600 text-sm mb-1">创作时间：{artwork.createdTime}</p>
                        <p className="text-slate-600 text-sm mb-1">主题：{artwork.theme}</p>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">{artwork.description}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditArtwork(selectedCollection, artwork)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            <Edit size={14} />
                            编辑
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定要删除这个商品详情图吗？')) {
                                deleteArtwork(selectedCollection, artwork.id);
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            <Trash2 size={14} />
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">预订管理</h2>
                <p className="text-slate-600">查看所有用户的预订信息</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshBookingData}
                  disabled={bookingLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={bookingLoading ? 'animate-spin' : ''} />
                  刷新数据
                </button>
              </div>
            </div>
            <BookingAdminPanel 
              bookings={bookings}
              stats={stats}
              loading={bookingLoading}
              error={bookingError}
              searchParams={searchParams}
              onRefresh={handleBookingRefresh}
              onSearch={handleBookingSearch}
              onClearSearch={handleBookingClearSearch}
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

      {/* 商品表单弹窗 */}
      {showCollectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">{editingCollection ? '编辑商品' : '添加商品'}</h3>
              <button
                onClick={() => setShowCollectionForm(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={collectionForm.title}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入商品标题"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">编号</label>
                  <input
                    type="text"
                    value={collectionForm.number}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="输入编号"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <UniversalImageUpload
                    label="封面图片"
                    value={collectionForm.coverImage}
                    fileId={collectionForm.coverImageFileId}
                    onChange={(data: { image?: string; fileId?: string }) => setCollectionForm(prev => ({ 
                      ...prev, 
                      coverImage: data.image || '',
                      coverImageFileId: data.fileId
                    }))}
                    placeholder="上传封面图片"
                    businessType="cover"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
                  <textarea
                    value={collectionForm.description}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入商品描述"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
                  <select
                    value={collectionForm.category}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, category: e.target.value as CollectionCategoryType }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.description || getCategoryDisplayName(category.name as CollectionCategoryType)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">价格（元）</label>
                  <input
                    type="number"
                    value={collectionForm.price || ''}
                    onChange={(e) => setCollectionForm(prev => ({ 
                      ...prev, 
                      price: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="输入价格（留空表示免费）"
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={collectionForm.isPublished}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">发布商品</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowCollectionForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCollection}
                className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品详情图表单弹窗 */}
      {showArtworkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">{editingArtwork ? '编辑商品详情图' : '添加商品详情图'}</h3>
              <button
                onClick={() => setShowArtworkForm(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={artworkForm.title}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入商品详情图标题"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">编号</label>
                  <input
                    type="text"
                    value={artworkForm.number}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="输入编号"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <UniversalImageUpload
                    label="商品详情图图片"
                    value={artworkForm.image}
                    fileId={artworkForm.fileId}
                    onChange={(data: { image?: string; fileId?: string }) => setArtworkForm(prev => ({ 
                      ...prev, 
                      image: data.image,
                      fileId: data.fileId
                    }))}
                    placeholder="上传商品详情图图片"
                    businessType="artwork"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
                  <textarea
                    value={artworkForm.description}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入商品详情图描述"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">创作时间</label>
                  <input
                    type="text"
                    value={artworkForm.createdTime}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, createdTime: e.target.value }))}
                    placeholder="输入创作时间"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">主题</label>
                  <input
                    type="text"
                    value={artworkForm.theme}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, theme: e.target.value }))}
                    placeholder="输入商品详情图主题"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowArtworkForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveArtwork}
                className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
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
