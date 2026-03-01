import React from 'react';
import { Button, Image, Text, View } from '@tarojs/components';
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
          ? 'flex gap-3 rounded-2xl border border-prussian-blue-200/30 bg-white/95 p-3 shadow-sm'
          : 'overflow-hidden rounded-2xl border border-prussian-blue-200/30 bg-gradient-to-br from-white to-prussian-blue-900/5 shadow-lg'
      }
    >
      <View
        className={
          isCompact
            ? 'relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-prussian-blue-900/5 to-oxford-blue-100/10'
            : 'relative w-full overflow-hidden bg-gradient-to-br from-prussian-blue-900/5 to-oxford-blue-100/10 aspect-[1/1.414]'
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
          <View className="absolute bottom-3 left-3 rounded-full bg-moonstone/90 px-3 py-1 text-[10px] font-semibold text-white shadow-lg">
            <Text>{badgeText}</Text>
          </View>
        )}
      </View>

      <View className={isCompact ? 'flex-1' : 'p-4'}>
        <Text className={isCompact ? 'text-sm font-semibold text-rich-black' : 'text-base font-bold text-rich-black'}>
          {collection.title}
        </Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">编号：{collection.number}</Text>
        {showCategory && collection.category && (
          <Text className="mt-1 block text-xs text-prussian-blue-600">
            分类：{getCategoryLabel(collection.category)}
          </Text>
        )}
        <Text className="mt-1 block text-xs font-medium text-prussian-blue-700">
          价格：{formatPrice(collection.price)}
        </Text>
        {showDescription && collection.description && !isCompact && (
          <Text className="mt-2 block text-xs text-prussian-blue-500">{collection.description}</Text>
        )}
        {actions && actions.length > 0 && (
          <View className={isCompact ? 'mt-3 flex gap-2' : 'mt-4 flex gap-2'}>
            {actions.map(action => (
              <Button
                key={action.label}
                className={
                  action.variant === 'ghost'
                    ? 'h-8 rounded-full border border-prussian-blue-200 bg-white px-4 text-xs font-semibold text-prussian-blue-700'
                    : 'h-8 rounded-full bg-gradient-to-r from-moonstone to-cerulean px-4 text-xs font-semibold text-white shadow-lg'
                }
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default CollectionCard;
