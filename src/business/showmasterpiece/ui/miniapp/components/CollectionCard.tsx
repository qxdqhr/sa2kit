import React from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { ArtCollection, CollectionCategoryType } from '../../../types';
import { CollectionCategory } from '../../../types';
import { formatPrice } from '../../../logic/shared/format';
import { getCategoryLabel } from '../../../logic/shared/category';
import { sm, smCn } from '../../shared/theme';

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
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';
  const pageCount = collection.pages?.length ?? 0;
  const isCollection = collection.category === CollectionCategory.COLLECTION;
  const badgeText = isCollection ? (pageCount > 0 ? `${pageCount} 页` : '画集') : '商品';

  return (
    <View className={isCompact ? smCn(sm.cardCompact, 'flex gap-3') : sm.cardLg}>
      <View
        className={
          isCompact
            ? smCn('relative h-24 w-20 shrink-0 overflow-hidden', sm.imgPlaceholder)
            : 'relative h-80 w-full overflow-hidden bg-gradient-to-br from-prussian-blue-100 to-oxford-blue-100'
        }
      >
        {collection.coverImage ? (
          <Image
            src={collection.coverImage}
            mode="aspectFill"
            className={smCn('h-full w-full', sm.imgCover)}
          />
        ) : (
          <View className={smCn('flex h-full w-full items-center justify-center', sm.meta)}>
            暂无图片
          </View>
        )}
        {!isCompact && (
          <View className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-gradient-to-t from-rich-black/70 via-rich-black/20 to-transparent px-4 py-3">
            <View className="rounded-full bg-moonstone/95 px-3 py-1 shadow-md backdrop-blur-sm">
              <Text className="text-xs font-semibold text-white">{badgeText}</Text>
            </View>
            <View className="rounded-full bg-white/95 px-3 py-1 shadow-sm backdrop-blur-sm">
              <Text className={smCn(sm.price, 'text-xs')}>{formatPrice(collection.price)}</Text>
            </View>
          </View>
        )}
      </View>

      <View className={isCompact ? 'flex-1' : 'p-4'}>
        <Text className={isCompact ? sm.titleSm : smCn(sm.title, 'text-lg')}>
          {collection.title}
        </Text>
        <Text className={smCn(sm.meta, 'mt-1 block')}>编号：{collection.number}</Text>
        {showCategory && collection.category && (
          <Text className={smCn(sm.meta, 'mt-1 block')}>
            分类：{getCategoryLabel(collection.category)}
          </Text>
        )}
        {isCompact && (
          <Text className={smCn(sm.price, 'mt-1 block')}>
            价格：{formatPrice(collection.price)}
          </Text>
        )}
        {showDescription && collection.description && !isCompact && (
          <Text className={smCn(sm.subtitle, 'mt-2 block line-clamp-2')}>
            {collection.description}
          </Text>
        )}
        {actions && actions.length > 0 && (
          <View className={isCompact ? 'mt-3 flex gap-2' : 'mt-4 flex gap-2'}>
            {actions.map((action) => (
              <View
                key={action.label}
                className={
                  action.variant === 'ghost'
                    ? smCn(sm.btnGhost, sm.btnGhostFlex)
                    : smCn(sm.btnPrimary, sm.btnPrimaryFlex)
                }
                onClick={action.onClick}
              >
                <Text
                  className={
                    action.variant === 'ghost' ? sm.btnTextGhost : sm.btnTextPrimary
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
