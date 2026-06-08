import React from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { CartItem } from '../../../types/cart';
import { formatPrice } from '../../../logic/shared/format';
import { sm, smCn } from '../../shared/theme';

interface CartItemCardProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const subtotal = (item.collection.price || 0) * item.quantity;

  return (
    <View className={smCn(sm.cardCompact, 'flex gap-3')}>
      {item.collection.coverImage ? (
        <Image
          src={item.collection.coverImage}
          mode="aspectFill"
          className={smCn('h-20 w-16', sm.imgThumb)}
        />
      ) : (
        <View
          className={smCn(
            'flex h-20 w-16 items-center justify-center',
            sm.imgPlaceholder,
            'rounded-xl',
          )}
        >
          暂无图片
        </View>
      )}
      <View className="flex-1">
        <Text className={sm.titleSm}>{item.collection.title}</Text>
        <Text className={smCn(sm.meta, 'mt-1 block')}>编号：{item.collection.number}</Text>
        <Text className={smCn(sm.meta, 'mt-1 block')}>
          价格：{formatPrice(item.collection.price)}
        </Text>
        <Text className={smCn(sm.price, 'mt-1 block')}>
          小计：{formatPrice(subtotal)}
        </Text>
        <View className="mt-3 flex items-center gap-2">
          <View className={sm.btnIcon} onClick={onDecrease}>
            <Text className="text-base font-medium">−</Text>
          </View>
          <Text className="w-8 text-center text-sm font-semibold tabular-nums">
            {item.quantity}
          </Text>
          <View className={sm.btnIcon} onClick={onIncrease}>
            <Text className="text-base font-medium">+</Text>
          </View>
          <View className={smCn(sm.btnDanger, 'ml-auto px-3')} onClick={onRemove}>
            <Text className={sm.btnTextDanger}>移除</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CartItemCard;
