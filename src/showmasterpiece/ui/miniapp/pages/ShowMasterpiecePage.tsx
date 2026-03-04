import React, { useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { getCategoryDisplayName, type ArtCollection, type CategoryOption, type CollectionCategoryType } from '../../../types';
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

  const {
    configs: popupConfigs,
    triggerCheck,
    closePopup,
    confirmPopup,
    cancelPopup,
  } = useDeadlinePopup('showmasterpiece', 'homepage_visit', apiBaseUrl);

  useEffect(() => {
    const loadCollections = async () => {
      setLoading(true);
      setError(null);
    try {
        const [collectionData, categoryData] = await Promise.all([
          getCollectionsOverview(apiBaseUrl),
          getCategories(apiBaseUrl),
        ]);
        setCollections(collectionData);
        setCategoryOptions(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载商品失败');
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

      <View className="mx-4 mt-4 rounded-3xl border border-prussian-blue-200 bg-white p-4 shadow-sm">
        <Text className="text-base font-semibold text-rich-black">分类浏览</Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">按分类快速筛选商品内容</Text>
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
          className="flex h-11 min-w-28 items-center justify-center rounded-full bg-teal-600 px-4 shadow-lg"
          onClick={goToTop}
        >
          <Text className="text-xs font-semibold text-white">回到顶部</Text>
        </View>
        <View
          className="flex h-11 min-w-28 items-center justify-center rounded-full bg-cyan-500 px-4 shadow-lg"
          onClick={goToCart}
        >
          <Text className="text-xs font-semibold text-white">
            购物车{cartCount > 0 ? ` (${cartCount})` : ''}
          </Text>
        </View>
        <View
          className="flex h-11 min-w-28 items-center justify-center rounded-full bg-blue-700 px-4 shadow-lg"
          onClick={goToHistory}
        >
          <Text className="text-xs font-semibold text-white">历史记录</Text>
        </View>
      </View>
    </View>
  );
};

export default ShowMasterpieceMiniappPage;
