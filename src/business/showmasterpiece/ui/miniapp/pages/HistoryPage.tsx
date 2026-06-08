import React, { useMemo, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import type { Booking } from '../../../types/booking';
import { FormInput, HistoryRecordCard, PageHeader } from '../index';
import { DEFAULT_BASE_URL, getBookings } from '../../../service/miniapp';
import { ensurePrivacyConsent, hasPrivacyConsent, showAgreementDoc } from '../components/privacyConsent';
import { sm, smCn } from '../../shared/theme';

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
  const [privacyConsented, setPrivacyConsented] = useState<boolean>(() => hasPrivacyConsent());

  useDidShow(() => {
    setPrivacyConsented(hasPrivacyConsent());
  });

  const handleSearch = async () => {
    const consented = await ensurePrivacyConsent();
    if (!consented) {
      Taro.showToast({ title: '请先阅读并同意协议', icon: 'none' });
      return;
    }
    setPrivacyConsented(true);

    if (!qqNumber.trim() || !phoneNumber.trim()) {
      Taro.showToast({ title: '请同时填写QQ号与联系方式', icon: 'none' });
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await getBookings(
        {
          qqNumber: qqNumber.trim(),
          phoneNumber: phoneNumber.trim(),
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
    <View className={smCn(sm.screen, 'pb-12 text-rich-black')}>
      <PageHeader title="历史记录查询" subtitle="请同时填写 QQ 号与联系方式查询预订记录" />

      <View className={smCn('mx-4 mt-5', sm.panel)}>
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

        <View className={smCn('mt-4', sm.panelInset)}>
          <Text className={sm.meta}>查询前请阅读并同意</Text>
          <Text className="ml-1 text-xs text-moonstone" onClick={() => showAgreementDoc('service')}>
            《用户服务协议》
          </Text>
          <Text className={sm.meta}>与</Text>
          <Text className="ml-1 text-xs text-moonstone" onClick={() => showAgreementDoc('privacy')}>
            《隐私政策》
          </Text>
          <Text className={smCn(sm.meta, 'ml-1')}>
            {privacyConsented ? '（已同意）' : '（未同意）'}
          </Text>
        </View>

        <View
          className={smCn(sm.btnPrimary, 'mt-5 w-full', loading && 'opacity-60')}
          onClick={loading ? undefined : handleSearch}
        >
          <Text className={sm.btnTextPrimary}>{loading ? '查询中...' : '查询记录'}</Text>
        </View>
      </View>

      {stats.totalBookings > 0 && (
        <View className={smCn('mx-4 mt-4', sm.panel)}>
          <View className="grid grid-cols-2 gap-2">
            <View className="py-2">
              <Text className={sm.adminStatValue}>{stats.totalBookings}</Text>
              <Text className={sm.adminStatLabel}>总预订次数</Text>
            </View>
            <View className="py-2">
              <Text className={sm.adminStatValue}>{stats.totalQuantity}</Text>
              <Text className={sm.adminStatLabel}>总预订数量</Text>
            </View>
            <View className="py-2">
              <Text className={sm.adminStatValue}>¥{stats.totalAmount}</Text>
              <Text className={sm.adminStatLabel}>总预订金额</Text>
            </View>
            <View className="py-2">
              <Text className={sm.adminStatValue}>{stats.completedCount}</Text>
              <Text className={sm.adminStatLabel}>已完成</Text>
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
          <View className={sm.empty}>暂无记录</View>
        )}

        {records.map((record) => (
          <HistoryRecordCard key={record.id} record={record} />
        ))}
      </View>
    </View>
  );
};

export default HistoryMiniappPage;
