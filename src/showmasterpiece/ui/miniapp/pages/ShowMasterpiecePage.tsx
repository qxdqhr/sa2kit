import React, { useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import {
  getCategoryDisplayName,
  normalizeMiniappFloatingButtonsConfig,
  type ArtCollection,
  type CategoryOption,
  type CollectionCategoryType,
  type MiniappFloatingButtonsConfig,
} from '../../../types';
import { addToCart, getCart } from '../../../logic/shared/cart';
import { CategoryTabs, MiniappCollectionCard, PageHeader } from '../index';
import {
  DEFAULT_BASE_URL,
  getCategories,
  type CollectionOverview,
  getCollectionsOverview,
} from '../../../service/miniapp';
import useDeadlinePopup from '../../../logic/hooks/useDeadlinePopupWechat';
import DeadlinePopupManager from '../components/DeadlinePopup';

type CategoryFilter = {
  value: CollectionCategoryType;
  label: string;
  count?: number;
};

export interface ShowMasterpieceMiniappPageProps {
  apiBaseUrl?: string;
}

const ShowMasterpieceMiniappPage: React.FC<ShowMasterpieceMiniappPageProps> = ({
  apiBaseUrl = DEFAULT_BASE_URL,
}) => {
  const [collections, setCollections] = useState<CollectionOverview[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CollectionCategoryType>('' as CollectionCategoryType);
  const [cartCount, setCartCount] = useState(0);
  const [miniappFloatingButtons, setMiniappFloatingButtons] = useState<MiniappFloatingButtonsConfig>(
    () => normalizeMiniappFloatingButtonsConfig(undefined),
  );

  const {
    configs: popupConfigs,
    triggerCheck,
    closePopup,
    confirmPopup,
    cancelPopup,
  } = useDeadlinePopup('showmasterpiece', 'homepage_visit', apiBaseUrl);

  useEffect(() => {
    try {
      Taro.setStorageSync('__cy_mps_boot_ready__', true);
      Taro.setStorageSync('__cy_mps_boot_retry_once__', false);
    } catch (error) {
      console.error('[ShowMasterpieceMiniappPage] boot ready sync failed', error);
    }
  }, []);

  useEffect(() => {
    const withTimeout = async <T,>(
      task: Promise<T>,
      timeoutMs: number,
      fallbackMessage: string,
    ): Promise<T> => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race<T>([
          task,
          new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error(fallbackMessage)), timeoutMs);
          }),
        ]);
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }
    };

    const loadCollections = async () => {
      setLoading(true);
      setError(null);
      try {
        const [collectionsResult, categoriesResult] = await Promise.allSettled([
          withTimeout(getCollectionsOverview(apiBaseUrl), 12000, '商品数据加载超时'),
          withTimeout(getCategories(apiBaseUrl), 8000, '分类数据加载超时'),
        ]);

        if (collectionsResult.status === 'fulfilled') {
          setCollections(Array.isArray(collectionsResult.value) ? collectionsResult.value : []);
        } else {
          setCollections([]);
          setError(collectionsResult.reason instanceof Error ? collectionsResult.reason.message : '商品加载失败');
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategoryOptions(Array.isArray(categoriesResult.value) ? categoriesResult.value : []);
        } else {
          setCategoryOptions([]);
          if (collectionsResult.status === 'fulfilled') {
            setError('分类加载失败，已使用默认分类展示');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载商品失败');
        setCollections([]);
        setCategoryOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [apiBaseUrl]);

  useEffect(() => {
    setCartCount(getCart().totalQuantity);
  }, []);

  useDidShow(() => {
    setCartCount(getCart().totalQuantity);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCheck();
    }, 600);
    return () => clearTimeout(timer);
  }, [triggerCheck]);

  useEffect(() => {
    const loadMiniappConfig = async () => {
      try {
        const response = await Taro.request({
          url: `${apiBaseUrl.replace(/\/$/, '')}/api/showmasterpiece/config`,
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
          },
        });
        const buttons = normalizeMiniappFloatingButtonsConfig(
          (response.data as any)?.miniappFloatingButtons,
        );
        setMiniappFloatingButtons(buttons);
      } catch (err) {
        setMiniappFloatingButtons(normalizeMiniappFloatingButtonsConfig(undefined));
      }
    };

    loadMiniappConfig();
  }, [apiBaseUrl]);

  const categories = useMemo<CategoryFilter[]>(() => {
    const categoryCounter = new Map<CollectionCategoryType, number>();
    collections.forEach((item) => {
      if (!item.category) return;
      categoryCounter.set(item.category, (categoryCounter.get(item.category) ?? 0) + 1);
    });
    const options = Array.isArray(categoryOptions) ? categoryOptions : [];
    const fromServer = options
      .map((item) => {
        const value = item.name as CollectionCategoryType;
        return {
          value,
          label: (item.description || '').trim() || String(getCategoryDisplayName(value)),
          count: categoryCounter.get(value) ?? 0,
        };
      })
      .filter((item) => item.count > 0);

    const mappedValues = new Set(fromServer.map((item) => item.value));
    const fallbackValues = Array.from(new Set(collections.map((item) => item.category).filter(Boolean)));
    const fallback = fallbackValues
      .filter((value) => !mappedValues.has(value as CollectionCategoryType))
      .map((value) => ({
        value: value as CollectionCategoryType,
        label: String(getCategoryDisplayName(value as CollectionCategoryType)),
        count: categoryCounter.get(value as CollectionCategoryType) ?? 0,
      }));

    return [...fromServer, ...fallback];
  }, [collections, categoryOptions]);

  useEffect(() => {
    if (!categories.length) return;
    const exists = categories.some((item) => item.value === activeCategory);
    if (!exists) {
      const firstCategory = categories[0];
      if (firstCategory) {
        setActiveCategory(firstCategory.value);
      }
    }
  }, [categories, activeCategory]);

  const filteredCollections = useMemo(
    () => (activeCategory ? collections.filter((item) => item.category === activeCategory) : collections),
    [collections, activeCategory],
  );

  const goToCart = () => {
    Taro.navigateTo({ url: '/pages/cart/index' });
  };

  const goToHistory = () => {
    Taro.navigateTo({ url: '/pages/history/index' });
  };

  const goToTop = () => {
    Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
  };

  const handleAddToCart = (collection: CollectionOverview) => {
    const normalizedCollection: ArtCollection = {
      ...collection,
      pages: collection.pages ?? [],
    };
    const next = addToCart(normalizedCollection, 1);
    setCartCount(next.totalQuantity);
    Taro.showToast({ title: '已加入购物车', icon: 'success' });
  };

  return (
    <View className="min-h-screen bg-gradient-to-br from-white to-prussian-blue-100 pb-12 text-rich-black">
      <PageHeader
        title="葱韵魔法屋"
        subtitle="葱韵环京的谷子网站，请大家尽情鉴赏老师们的作品吧！"
      />

      <View className="mx-4 mt-4 rounded-3xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
        <Text className="text-base font-semibold text-rich-black">分类浏览</Text>
        <Text className="mt-1 block text-xs text-teal-700">按分类快速筛选商品内容</Text>
        <CategoryTabs
          items={categories}
          activeValue={activeCategory}
          onChange={(value) => setActiveCategory(value)}
        />
      </View>

      <View className="mx-4 mt-5">
        <Text className="text-lg font-semibold text-rich-black">精选</Text>
        {loading ? (
          <View className="py-10 text-center text-sm text-prussian-blue-600">加载中...</View>
        ) : error ? (
          <View className="mt-4 rounded-2xl bg-rose-50 px-4 py-4 text-rose-700 shadow-md">
            <Text className="text-sm font-semibold">加载失败</Text>
            <Text className="mt-1 block text-xs">{error}</Text>
          </View>
        ) : filteredCollections.length === 0 ? (
          <View className="rounded-2xl bg-white py-10 text-center text-sm text-prussian-blue-600 shadow-md">
            暂无匹配商品
          </View>
        ) : (
          <View className="mt-4 flex flex-col gap-5">
            {filteredCollections.map((collection) => (
              <MiniappCollectionCard
                key={collection.id}
                collection={collection}
                actions={[
                  {
                    label: '加入购物车',
                    onClick: () => handleAddToCart(collection),
                    variant: 'primary',
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <DeadlinePopupManager
        configs={popupConfigs}
        onClose={closePopup}
        onConfirm={confirmPopup}
        onCancel={cancelPopup}
      />

      <View className="fixed bottom-6 right-4 flex flex-col gap-3" style={{ zIndex: 80 }}>
        <View
          className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 shadow-lg"
          onClick={goToTop}
        >
          <Text className="text-lg text-white">↑</Text>
        </View>
        {miniappFloatingButtons.showCart && (
          <View
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 shadow-lg"
            onClick={goToCart}
          >
            <Text className="text-lg text-white">🛒</Text>
            {cartCount > 0 && (
              <View className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1">
                <Text className="text-[10px] font-semibold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
        )}
        {miniappFloatingButtons.showHistory && (
          <View
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 shadow-lg"
            onClick={goToHistory}
          >
            <Text className="text-lg text-white">🕘</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ShowMasterpieceMiniappPage;
