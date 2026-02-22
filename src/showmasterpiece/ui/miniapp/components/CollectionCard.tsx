import React from 'react';
import { Button, Image, Text, View } from '@tarojs/components';
import type { ArtCollection, CollectionCategoryType } from '../../../types';
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
  return (
    <View className="overflow-hidden rounded-3xl bg-white shadow-xl">
      {collection.coverImage ? (
        <Image
          src={collection.coverImage}
          mode="aspectFill"
          className={isCompact ? 'h-24 w-24 rounded-2xl' : 'h-44 w-full'}
        />
      ) : (
        <View
          className={
            isCompact
              ? 'flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-200 text-xs text-slate-500'
              : 'flex h-44 items-center justify-center bg-slate-200 text-sm text-slate-500'
          }
        >
          暂无图片
        </View>
      )}
      <View className={isCompact ? 'flex-1 px-3 py-1' : 'px-4 py-4'}>
        <View className="flex items-center justify-between gap-2">
          <Text className={isCompact ? 'text-sm font-semibold' : 'text-base font-semibold'}>
            {collection.title}
          </Text>
          {showCategory && !isCompact && (
            <Text className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {getCategoryLabel(collection.category)}
            </Text>
          )}
        </View>
        {showDescription && collection.description && !isCompact && (
          <Text className="mt-2 block text-xs text-slate-500">{collection.description}</Text>
        )}
        <Text className="mt-1 block text-xs text-slate-500">编号：{collection.number}</Text>
        <Text className="mt-1 block text-xs text-slate-500">
          价格：{formatPrice(collection.price)}
        </Text>
        {actions && actions.length > 0 && (
          <View className={isCompact ? 'mt-2 flex gap-2' : 'mt-4 flex gap-2'}>
            {actions.map(action => (
              <Button
                key={action.label}
                className={
                  action.variant === 'ghost'
                    ? 'h-8 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700'
                    : 'h-8 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white'
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
