import React, { useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import type { Booking } from '../../../types/booking';
import { FormInput, HistoryRecordCard, PageHeader } from '../index';
import { DEFAULT_BASE_URL, getBookings } from '../../../service/miniapp';

export interface HistoryMiniappPageProps {
  apiBaseUrl?: string;
}

const HistoryMiniappPage: React.FC<HistoryMiniappPageProps> = ({ apiBaseUrl = DEFAULT_BASE_URL }) => {
  const [qqNumber, setQqNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!qqNumber.trim() && !phoneNumber.trim()) {
      Taro.showToast({ title: '请输入QQ号或联系方式', icon: 'none' });
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await getBookings(
        {
          qqNumber: qqNumber.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          page: 1,
          limit: 50,
        },
        apiBaseUrl,
      );

      setRecords(result.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalBookings = records.length;
    const totalQuantity = records.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = records.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.collection?.price || 0),
      0,
    );
    const completedCount = records.filter((item) => item.status === 'completed').length;

    return {
      totalBookings,
      totalQuantity,
      totalAmount,
      completedCount,
    };
  }, [records]);

  return (
    <View className="min-h-screen bg-gradient-to-br from-white to-prussian-blue-100 pb-12 text-rich-black">
      <PageHeader title="历史记录查询" subtitle="输入 QQ 或联系方式查询预订记录" />

      <View className="mx-4 mt-5 rounded-3xl border border-prussian-blue-200 bg-white px-5 py-5 shadow-sm">
        <FormInput
          label="QQ号"
          value={qqNumber}
          placeholder="请输入QQ号"
          onChange={setQqNumber}
          disabled={loading}
        />

        <FormInput
          label="联系方式"
          value={phoneNumber}
          placeholder="请输入联系方式"
          onChange={setPhoneNumber}
          disabled={loading}
        />

        <View
          className="mt-5 flex h-10 w-full items-center justify-center rounded-full"
          style={{
            backgroundColor: loading ? '#93C5FD' : '#2563EB',
            boxShadow: loading ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.28)',
          }}
          onClick={loading ? undefined : handleSearch}
        >
          <Text className="text-sm font-semibold text-white">{loading ? '查询中...' : '查询记录'}</Text>
        </View>
      </View>

      {stats.totalBookings > 0 && (
        <View className="mx-4 mt-4 rounded-3xl border border-prussian-blue-200 bg-white px-4 py-4 shadow-sm">
          <View className="grid grid-cols-2">
            <View className="py-2">
              <Text className="text-xl font-bold text-rich-black">{stats.totalBookings}</Text>
              <Text className="block text-xs text-prussian-blue-600">总预订次数</Text>
            </View>
            <View className="py-2">
              <Text className="text-xl font-bold text-rich-black">{stats.totalQuantity}</Text>
              <Text className="block text-xs text-prussian-blue-600">总预订数量</Text>
            </View>
            <View className="py-2">
              <Text className="text-xl font-bold text-rich-black">¥{stats.totalAmount}</Text>
              <Text className="block text-xs text-prussian-blue-600">总预订金额</Text>
            </View>
            <View className="py-2">
              <Text className="text-xl font-bold text-rich-black">{stats.completedCount}</Text>
              <Text className="block text-xs text-prussian-blue-600">已完成</Text>
            </View>
          </View>
        </View>
      )}

      <View className="mx-4 mt-6 flex flex-col gap-4">
        {error && (
          <View className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
            <Text className="text-xs">{error}</Text>
          </View>
        )}

        {hasSearched && !loading && !error && records.length === 0 && (
          <View className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-prussian-blue-600 shadow-md">
            暂无记录
          </View>
        )}

        {records.map((record) => (
          <HistoryRecordCard key={record.id} record={record} />
        ))}
      </View>
    </View>
  );
};

export default HistoryMiniappPage;
