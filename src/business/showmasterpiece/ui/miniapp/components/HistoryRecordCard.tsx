import React from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { Booking } from '../../../types/booking';
import { formatPrice } from '../../../logic/shared/format';
import { sm, smCn } from '../../shared/theme';

const statusLabelMap: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

const statusStyleMap: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200/60',
  confirmed: 'bg-prussian-blue-100 text-prussian-blue-800 ring-prussian-blue-200/60',
  completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200/60',
  cancelled: 'bg-rose-100 text-rose-800 ring-rose-200/60',
};

interface HistoryRecordCardProps {
  record: Booking;
}

const HistoryRecordCard: React.FC<HistoryRecordCardProps> = ({ record }) => {
  const statusText = statusLabelMap[record.status] || record.status;
  const statusStyle =
    statusStyleMap[record.status] || 'bg-prussian-blue-50 text-prussian-blue-600';
  const totalPrice = (record.collection?.price || 0) * record.quantity;

  return (
    <View className={sm.cardCompact}>
      <View className="flex gap-3">
        {record.collection?.coverImage ? (
          <Image
            src={record.collection.coverImage}
            mode="aspectFill"
            className={smCn('h-20 w-16', sm.imgThumb)}
          />
        ) : (
          <View className={smCn('h-20 w-16 rounded-xl', sm.imgPlaceholder)}>暂无图片</View>
        )}
        <View className="flex-1">
          <Text className={sm.titleSm}>{record.collection?.title || '画集'}</Text>
          <Text className={smCn(sm.meta, 'mt-1 block')}>
            编号：{record.collection?.number || '-'}
          </Text>
          <Text className={smCn(sm.meta, 'mt-1 block tabular-nums')}>
            数量：{record.quantity}
          </Text>
          <Text className={smCn(sm.meta, 'mt-1 block')}>
            价格：{formatPrice(record.collection?.price)}
          </Text>
          <Text className={smCn(sm.price, 'mt-1 block')}>总价：{formatPrice(totalPrice)}</Text>
          <View className="mt-2 flex items-center justify-between">
            <View className={smCn(sm.adminBadge, 'ring-1', statusStyle)}>
              <Text>{statusText}</Text>
            </View>
            <Text className={smCn(sm.meta, 'tabular-nums')}>
              {record.createdAt?.slice(0, 10)}
            </Text>
          </View>
        </View>
      </View>
      {(record.notes || record.adminNotes) && (
        <View className="mt-3 border-t border-prussian-blue-200/60 pt-3">
          {record.notes && (
            <View className={sm.panelInset}>
              <Text className={sm.meta}>备注：{record.notes}</Text>
            </View>
          )}
          {record.adminNotes && (
            <View className={smCn(sm.panelInset, 'mt-2 bg-moonstone/10')}>
              <Text className={sm.meta}>管理员备注：{record.adminNotes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default HistoryRecordCard;
