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

const statusStyleMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

interface HistoryRecordCardProps {
  record: Booking;
}

const HistoryRecordCard: React.FC<HistoryRecordCardProps> = ({ record }) => {
  const statusText = statusLabelMap[record.status] || record.status;
  const statusStyle = statusStyleMap[record.status] || 'bg-slate-100 text-slate-600';

  return (
    <View className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
      {record.collection?.coverImage ? (
        <Image
          src={record.collection.coverImage}
          mode="aspectFill"
          className="h-16 w-16 rounded-lg"
        />
      ) : (
        <View className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
          暂无图片
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-900">
          {record.collection?.title || '画集'}
        </Text>
        <Text className="mt-1 block text-xs text-slate-600">数量：{record.quantity}</Text>
        <Text className="mt-1 block text-xs text-slate-600">
          价格：{formatPrice(record.collection?.price)}
        </Text>
        <View className="mt-2 flex items-center justify-between">
          <View className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>
            <Text>{statusText}</Text>
          </View>
          <Text className="text-xs text-slate-400">{record.createdAt?.slice(0, 10)}</Text>
        </View>
      </View>
    </View>
  );
};

export default HistoryRecordCard;
