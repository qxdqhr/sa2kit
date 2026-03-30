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
  const totalPrice = (record.collection?.price || 0) * record.quantity;

  return (
    <View className="rounded-2xl border border-prussian-blue-200 bg-white p-4 shadow-sm">
      <View className="flex gap-3">
      {record.collection?.coverImage ? (
        <Image
          src={record.collection.coverImage}
          mode="aspectFill"
          className="h-20 w-16 rounded-xl"
        />
      ) : (
        <View className="flex h-20 w-16 items-center justify-center rounded-xl bg-prussian-blue-100 text-xs text-prussian-blue-500">
          暂无图片
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-rich-black">
          {record.collection?.title || '画集'}
        </Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">
          编号：{record.collection?.number || '-'}
        </Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">数量：{record.quantity}</Text>
        <Text className="mt-1 block text-xs text-prussian-blue-600">
          价格：{formatPrice(record.collection?.price)}
        </Text>
        <Text className="mt-1 block text-xs font-semibold text-prussian-blue-700">
          总价：{formatPrice(totalPrice)}
        </Text>
        <View className="mt-2 flex items-center justify-between">
          <View className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle}`}>
            <Text>{statusText}</Text>
          </View>
          <Text className="text-xs text-prussian-blue-500">{record.createdAt?.slice(0, 10)}</Text>
        </View>
      </View>
      </View>
      {(record.notes || record.adminNotes) && (
        <View className="mt-3 border-t border-prussian-blue-200 pt-3">
          {record.notes && (
            <View className="rounded-xl bg-prussian-blue-100 p-2">
              <Text className="text-xs text-prussian-blue-700">备注：{record.notes}</Text>
            </View>
          )}
          {record.adminNotes && (
            <View className="mt-2 rounded-xl bg-moonstone-100 p-2">
              <Text className="text-xs text-prussian-blue-700">管理员备注：{record.adminNotes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default HistoryRecordCard;
