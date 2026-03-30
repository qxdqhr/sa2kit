import React from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { CartItem } from '../../../types/cart';
import { formatPrice } from '../../../logic/shared/format';

interface CartItemCardProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onIncrease, onDecrease, onRemove }) => {
  const subtotal = (item.collection.price || 0) * item.quantity;

  return (
    <View className="flex gap-3 rounded-2xl border border-prussian-blue-200 bg-white p-3 shadow-sm">
      {item.collection.coverImage ? (
        <Image
          src={item.collection.coverImage}
          mode="aspectFill"
          className="h-20 w-16 rounded-xl"
        />
      ) : (
        <View className="flex h-20 w-16 items-center justify-center rounded-xl bg-prussian-blue-100 text-xs text-prussian-blue-500">
          暂无图片
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-rich-black">{item.collection.title}</Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">编号：{item.collection.number}</Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">
          价格：{formatPrice(item.collection.price)}
        </Text>
        <Text className="mt-1 block text-xs font-semibold text-prussian-blue-700">
          小计：{formatPrice(subtotal)}
        </Text>
        <View className="mt-3 flex items-center gap-2">
          <View
            className="flex h-9 w-9 items-center justify-center rounded-full border border-prussian-blue-200 bg-white text-base text-prussian-blue-700"
            onClick={onDecrease}
          >
            <Text>-</Text>
          </View>
          <Text className="w-8 text-center text-sm font-semibold">{item.quantity}</Text>
          <View
            className="flex h-9 w-9 items-center justify-center rounded-full border border-prussian-blue-200 bg-white text-base text-prussian-blue-700"
            onClick={onIncrease}
          >
            <Text>+</Text>
          </View>
          <View
            className="ml-auto flex h-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3"
            onClick={onRemove}
          >
            <Text className="text-xs font-semibold text-rose-600">移除</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CartItemCard;
