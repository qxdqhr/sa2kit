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
    <View className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
      {item.collection.coverImage ? (
        <Image
          src={item.collection.coverImage}
          mode="aspectFill"
          className="h-16 w-16 rounded-lg"
        />
      ) : (
        <View className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
          暂无图片
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-900">{item.collection.title}</Text>
        <Text className="mt-1 block text-xs text-slate-600">编号：{item.collection.number}</Text>
        <Text className="mt-1 block text-xs text-slate-600">
          价格：{formatPrice(item.collection.price)}
        </Text>
        <View className="mt-3 flex items-center gap-2">
          <Button
            className="h-9 w-9 rounded-full border border-slate-300 bg-white text-base text-slate-700"
            onClick={onDecrease}
          >
            -
          </Button>
          <Text className="text-sm font-semibold">{item.quantity}</Text>
          <Button
            className="h-9 w-9 rounded-full border border-slate-300 bg-white text-base text-slate-700"
            onClick={onIncrease}
          >
            +
          </Button>
          <Button
            className="ml-auto h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-600"
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
