import React from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { ArtCollection, CollectionCategoryType } from '../../../types';
import { CollectionCategory } from '../../../types';
import { formatPrice } from '../../../logic/shared/format';
import { getCategoryLabel } from '../../../logic/shared/category';

type ActionButton = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
};

type CollectionLike = Pick<
  ArtCollection,
  'id' | 'title' | 'number' | 'coverImage' | 'price'
> & {
  description?: string;
  category?: CollectionCategoryType;
  pages?: ArtCollection['pages'];
};

interface CollectionCardProps {
  collection: CollectionLike;
  actions?: ActionButton[];
  showCategory?: boolean;
  showDescription?: boolean;
  variant?: 'default' | 'compact';
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  actions,
  showCategory = true,
  showDescription = true,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';
  const pageCount = collection.pages?.length ?? 0;
  const isCollection = collection.category === CollectionCategory.COLLECTION;
  const badgeText = isCollection ? (pageCount > 0 ? `${pageCount} 页` : '画集') : '商品';

  return (
    <View
      className={
        isCompact
          ? 'flex gap-3 rounded-2xl border border-prussian-blue-200 bg-white p-3 shadow-sm'
          : 'overflow-hidden rounded-3xl border border-prussian-blue-200 bg-white shadow-lg'
      }
    >
      <View
        className={
          isCompact
            ? 'relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-prussian-blue-100 to-oxford-blue-100'
            : 'relative h-80 w-full overflow-hidden bg-gradient-to-br from-prussian-blue-100 to-oxford-blue-100'
        }
      >
        {collection.coverImage ? (
          <Image
            src={collection.coverImage}
            mode="aspectFill"
            className={isCompact ? 'h-full w-full' : 'h-full w-full'}
          />
        ) : (
          <View className="flex h-full w-full items-center justify-center text-xs text-prussian-blue-500">
            暂无图片
          </View>
        )}
        {!isCompact && (
          <View className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-gradient-to-t from-rich-black to-transparent px-4 py-3">
            <View className="rounded-full bg-moonstone-400 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              <Text>{badgeText}</Text>
            </View>
            <View className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-prussian-blue-700">
              <Text>{formatPrice(collection.price)}</Text>
            </View>
          </View>
        )}
      </View>

      <View className={isCompact ? 'flex-1' : 'p-4'}>
        <Text className={isCompact ? 'text-sm font-semibold text-rich-black' : 'text-lg font-bold text-rich-black'}>
          {collection.title}
        </Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">编号：{collection.number}</Text>
        {showCategory && collection.category && (
          <Text className="mt-1 block text-xs text-prussian-blue-600">
            分类：{getCategoryLabel(collection.category)}
          </Text>
        )}
        {isCompact && (
          <Text className="mt-1 block text-xs font-medium text-prussian-blue-700">
            价格：{formatPrice(collection.price)}
          </Text>
        )}
        {showDescription && collection.description && !isCompact && (
          <Text className="mt-2 block text-xs text-prussian-blue-500">{collection.description}</Text>
        )}
        {actions && actions.length > 0 && (
          <View className={isCompact ? 'mt-3 flex gap-2' : 'mt-4 flex gap-2'}>
            {actions.map(action => (
              <View
                key={action.label}
                className={
                  action.variant === 'ghost'
                    ? 'flex h-9 flex-1 items-center justify-center rounded-full border border-prussian-blue-200 bg-white px-4'
                    : 'flex h-9 flex-1 items-center justify-center rounded-full px-4 shadow-lg'
                }
                style={action.variant === 'ghost' ? undefined : { backgroundColor: '#1e88e5' }}
                onClick={action.onClick}
              >
                <Text
                  className={
                    action.variant === 'ghost'
                      ? 'text-xs font-semibold text-prussian-blue-700'
                      : 'text-xs font-semibold text-white'
                  }
                >
                  {action.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default CollectionCard;
