import React, { useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import type { Cart } from '../../../types/cart';
import {
  clearMiniappCart as clearCart,
  formatPrice,
  getMiniappCart as getCart,
  removeMiniappCartItem as removeCartItem,
  updateMiniappCartItem as updateCartItem,
} from '../../../logic/shared';
import { CartItemCard, FormInput, FormTextarea, PageHeader } from '../index';
import { batchBooking, DEFAULT_BASE_URL } from '../../../service/miniapp';
import useDeadlinePopup from '../../../logic/hooks/useDeadlinePopupWechat';
import DeadlinePopupManager from '../components/DeadlinePopup';

export interface CartMiniappPageProps {
  apiBaseUrl?: string;
}

const CartMiniappPage: React.FC<CartMiniappPageProps> = ({ apiBaseUrl = DEFAULT_BASE_URL }) => {
  const [cart, setCart] = useState<Cart>(() => getCart());
  const [qqNumber, setQqNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [shippingInfo, setShippingInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    qqNumber?: string;
    phoneNumber?: string;
    notes?: string;
    pickupMethod?: string;
  }>({});

  const {
    configs: popupConfigs,
    hasPopup,
    triggerCheck,
    closePopup,
    confirmPopup,
    cancelPopup,
    temporaryClosePopup,
  } = useDeadlinePopup('showmasterpiece', 'cart_checkout', apiBaseUrl);

  const cartItems = cart.items;

  const refreshCart = () => {
    setCart(getCart());
  };

  useEffect(() => {
    refreshCart();
  }, []);

  useDidShow(() => {
    refreshCart();
  });

  const handleUpdateQuantity = (collectionId: number, quantity: number) => {
    const next = updateCartItem(collectionId, quantity);
    setCart(next);
  };

  const handleRemove = (collectionId: number) => {
    const next = removeCartItem(collectionId);
    setCart(next);
  };

  const totalPriceLabel = useMemo(() => formatPrice(cart.totalPrice), [cart.totalPrice]);

  const validateForm = () => {
    const nextErrors: typeof formErrors = {};
    const qq = qqNumber.trim();
    const phone = phoneNumber.trim();
    const pickup = shippingInfo.trim();
    const noteText = notes.trim();

    if (!qq) {
      nextErrors.qqNumber = '请输入QQ号';
    } else if (!/^\d{5,11}$/.test(qq)) {
      nextErrors.qqNumber = 'QQ号格式不正确';
    }

    if (!phone) {
      nextErrors.phoneNumber = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      nextErrors.phoneNumber = '手机号格式不正确';
    }

    if (!pickup) {
      nextErrors.pickupMethod = '请填写领取方式';
    }

    if (!noteText) {
      nextErrors.notes = '请填写备注信息';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const performCheckout = async () => {
    if (!cartItems.length) {
      Taro.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }

    if (!validateForm()) {
      Taro.showToast({ title: '请先修正表单错误', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      await batchBooking(
        {
          qqNumber: qqNumber.trim(),
          phoneNumber: phoneNumber.trim(),
          pickupMethod: shippingInfo.trim(),
          notes: notes.trim(),
          items: cartItems.map((item) => ({
            collectionId: item.collectionId,
            quantity: item.quantity,
          })),
        },
        apiBaseUrl,
      );

      clearCart();
      setCart(getCart());
      setNotes('');
      setShippingInfo('');
      setFormErrors({});
      Taro.showToast({ title: '预订提交成功', icon: 'success' });
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '提交失败',
        icon: 'none',
      });
    } finally {
      setPendingCheckout(false);
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      Taro.showToast({ title: '请先修正表单错误', icon: 'none' });
      return;
    }

    const activePopups = await triggerCheck();
    if (activePopups.length > 0) {
      setPendingCheckout(true);
      return;
    }

    await performCheckout();
  };

  const handlePopupConfirm = (configId: string) => {
    const popup = popupConfigs.find((item) => item.id === configId);

    if (popup?.blockProcess) {
      temporaryClosePopup(configId);
      setPendingCheckout(false);
      return;
    }

    confirmPopup(configId);
  };

  const handlePopupCancel = (configId: string) => {
    const popup = popupConfigs.find((item) => item.id === configId);

    if (popup?.blockProcess) {
      temporaryClosePopup(configId);
      setPendingCheckout(false);
      return;
    }

    cancelPopup(configId);
  };

  useEffect(() => {
    if (!pendingCheckout || hasPopup || submitting) return;
    performCheckout();
  }, [pendingCheckout, hasPopup, submitting]);

  const handleClearCart = () => {
    clearCart();
    setCart(getCart());
    Taro.showToast({ title: '购物车已清空', icon: 'success' });
  };

  return (
    <View className="min-h-screen bg-gradient-to-br from-white to-prussian-blue-100 pb-12 text-rich-black">
      <PageHeader title="购物车" subtitle="确认画集数量并提交预订" />

      <View className="mx-4 mt-5 flex flex-col gap-4">
        {cartItems.length === 0 ? (
          <View className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-prussian-blue-600 shadow-md">
            购物车暂无画集
          </View>
        ) : (
          cartItems.map((item) => (
            <CartItemCard
              key={item.collectionId}
              item={item}
              onIncrease={() => handleUpdateQuantity(item.collectionId, item.quantity + 1)}
              onDecrease={() => handleUpdateQuantity(item.collectionId, item.quantity - 1)}
              onRemove={() => handleRemove(item.collectionId)}
            />
          ))
        )}
      </View>

      <View className="mx-4 mt-6 rounded-3xl border border-prussian-blue-200 bg-white px-5 py-5 shadow-sm">
        <Text className="text-base font-semibold text-rich-black">批量预订信息</Text>

        <FormInput
          label="QQ号 *"
          value={qqNumber}
          placeholder="请输入您的QQ号"
          onChange={setQqNumber}
          disabled={submitting}
          error={formErrors.qqNumber}
        />

        <FormInput
          label="手机号 *"
          value={phoneNumber}
          placeholder="请输入您的手机号"
          onChange={setPhoneNumber}
          disabled={submitting}
          error={formErrors.phoneNumber}
        />

        <FormTextarea
          label="备注信息 *"
          value={notes}
          placeholder={'您在葱韵环京的哪个群（方便我们联系您）\n（1）葱韵环京ComicUniverse\n（2）葱韵环京外星开拓群\n（3）葱韵环京比邻星\n（4）葱韵环京华东群\n（5）葱韵环京天津群\n（6）葱韵环京·四维空间'}
          onChange={setNotes}
          disabled={submitting}
          error={formErrors.notes}
        />

        <FormTextarea
          label="收货信息 *"
          value={shippingInfo}
          placeholder={'请填写2月10号以后能收到货的地址\n（1）收件人\n（2）收件地址\n（3）收件手机号'}
          onChange={setShippingInfo}
          disabled={submitting}
          error={formErrors.pickupMethod}
        />

        <View className="mt-5 flex items-center justify-between gap-3">
          <View
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-prussian-blue-100"
            onClick={submitting ? undefined : handleClearCart}
          >
            <Text className="text-sm font-semibold text-prussian-blue-700">清空购物车</Text>
          </View>
          <View
            className={`flex h-11 flex-1 items-center justify-center rounded-xl ${
              submitting ? 'bg-blue-300' : 'bg-blue-600 shadow-lg'
            }`}
            onClick={submitting ? undefined : handleCheckout}
          >
            <Text className="text-sm font-semibold text-white">{submitting ? '提交中...' : '批量预订'}</Text>
          </View>
        </View>
        <Text className="mt-3 block text-right text-sm font-semibold text-rich-black">合计：{totalPriceLabel}</Text>
      </View>

      <DeadlinePopupManager
        configs={popupConfigs}
        onClose={closePopup}
        onConfirm={handlePopupConfirm}
        onCancel={handlePopupCancel}
      />
    </View>
  );
};

export default CartMiniappPage;
