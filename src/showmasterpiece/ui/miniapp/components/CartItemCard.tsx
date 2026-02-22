import React from 'react';
import { Button, Image, Text, View } from '@tarojs/components';
import type { CartItem } from '../../../types/cart';
import { formatPrice } from '../../../logic/shared/format';

interface CartItemCardProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onIncrease, onDecrease, onRemove }) => {
  return (
    <View className="flex gap-3 rounded-2xl bg-white p-3 shadow-md">
      {item.collection.coverImage ? (
        <Image
          src={item.collection.coverImage}
          mode="aspectFill"
          className="h-20 w-20 rounded-2xl"
        />
      ) : (
        <View className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-xs text-slate-500">
          暂无图片
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold">{item.collection.title}</Text>
        <Text className="mt-1 block text-xs text-slate-500">编号：{item.collection.number}</Text>
        <Text className="mt-1 block text-xs text-slate-500">
          价格：{formatPrice(item.collection.price)}
        </Text>
        <View className="mt-3 flex items-center gap-2">
          <Button
            className="h-8 w-8 rounded-full border border-slate-200 bg-white text-base text-slate-700"
            onClick={onDecrease}
          >
            -
          </Button>
          <Text className="text-sm font-semibold">{item.quantity}</Text>
          <Button
            className="h-8 w-8 rounded-full border border-slate-200 bg-white text-base text-slate-700"
            onClick={onIncrease}
          >
            +
          </Button>
          <Button
            className="ml-auto h-8 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs text-rose-600"
            onClick={onRemove}
          >
            移除
          </Button>
        </View>
      </View>
    </View>
  );
};

export default CartItemCard;
