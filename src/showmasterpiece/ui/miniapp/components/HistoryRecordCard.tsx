import React from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { Booking } from '../../../types/booking';
import { formatPrice } from '../../../logic/shared/format';

const statusLabelMap: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
};

interface HistoryRecordCardProps {
  record: Booking;
}

const HistoryRecordCard: React.FC<HistoryRecordCardProps> = ({ record }) => {
  return (
    <View className="flex gap-3 rounded-2xl bg-white p-3 shadow-md">
      {record.collection?.coverImage ? (
        <Image
          src={record.collection.coverImage}
          mode="aspectFill"
          className="h-20 w-20 rounded-2xl"
        />
      ) : (
        <View className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-xs text-slate-500">
          暂无图片
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold">{record.collection?.title || '画集'}</Text>
        <Text className="mt-1 block text-xs text-slate-500">数量：{record.quantity}</Text>
        <Text className="mt-1 block text-xs text-slate-500">
          价格：{formatPrice(record.collection?.price)}
        </Text>
        <View className="mt-2 flex items-center justify-between">
          <Text className="text-xs text-slate-500">
            状态：{statusLabelMap[record.status] || record.status}
          </Text>
          <Text className="text-xs text-slate-400">{record.createdAt?.slice(0, 10)}</Text>
        </View>
      </View>
    </View>
  );
};

export default HistoryRecordCard;
