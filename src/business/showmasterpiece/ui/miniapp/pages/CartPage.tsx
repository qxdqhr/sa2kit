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
import { ensurePrivacyConsent, hasPrivacyConsent, showAgreementDoc } from '../components/privacyConsent';
import { sm, smCn } from '../../shared/theme';

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
  const [privacyConsented, setPrivacyConsented] = useState<boolean>(() => hasPrivacyConsent());
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
    setPrivacyConsented(hasPrivacyConsent());
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
      nextErrors.phoneNumber = '请输入联系方式';
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      nextErrors.phoneNumber = '联系方式格式不正确';
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
    const consented = await ensurePrivacyConsent();
    if (!consented) {
      Taro.showToast({ title: '请先阅读并同意协议', icon: 'none' });
      return;
    }
    setPrivacyConsented(true);

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
    <View className={smCn(sm.screen, 'pb-12 text-rich-black')}>
      <PageHeader title="购物车" subtitle="确认画集数量并提交预订" />

      <View className="mx-4 mt-5 flex flex-col gap-4">
        {cartItems.length === 0 ? (
          <View className={sm.empty}>购物车暂无画集</View>
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

      <View className={smCn('mx-4 mt-6', sm.panel)}>
        <Text className={sm.titleSm}>批量预订信息</Text>

        <FormInput
          label="QQ号 *"
          value={qqNumber}
          placeholder="请输入您的QQ号"
          onChange={setQqNumber}
          disabled={submitting}
          error={formErrors.qqNumber}
        />

        <FormInput
          label="联系方式 *"
          value={phoneNumber}
          placeholder="请输入您的联系方式"
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
          placeholder={'请填写2月10号以后能收到货的地址\n（1）收件人\n（2）收件地址\n（3）收件联系方式'}
          onChange={setShippingInfo}
          disabled={submitting}
          error={formErrors.pickupMethod}
        />

        <View className={smCn('mt-4', sm.panelInset)}>
          <Text className={sm.meta}>提交前请阅读并同意</Text>
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

        <View className="mt-5 flex items-center justify-between gap-3">
          <View
            className={smCn(sm.btnGhost, sm.btnGhostFlex, submitting && 'opacity-50')}
            onClick={submitting ? undefined : handleClearCart}
          >
            <Text className={sm.btnTextGhost}>清空购物车</Text>
          </View>
          <View
            className={smCn(
              sm.btnPrimary,
              sm.btnPrimaryFlex,
              submitting && 'opacity-60',
            )}
            onClick={submitting ? undefined : handleCheckout}
          >
            <Text className={sm.btnTextPrimary}>
              {submitting ? '提交中...' : '提交申请'}
            </Text>
          </View>
        </View>
        <Text className={smCn(sm.priceLg, 'mt-3 block text-right')}>
          合计：{totalPriceLabel}
        </Text>
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
