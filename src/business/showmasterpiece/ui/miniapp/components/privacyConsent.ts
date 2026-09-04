import Taro from '@tarojs/taro';

const CONSENT_STORAGE_KEY = '__showmasterpiece_privacy_consent_v1__';

const SERVICE_TERMS_TEXT =
  '《用户服务协议》摘要：本服务用于画集浏览、购物车下单与历史查询；提交信息仅用于订单处理、发货及售后沟通。';

const PRIVACY_POLICY_TEXT =
  '《隐私政策》摘要：我们会收集您主动填写的QQ号、联系方式与收货信息，用于预订联系与履约；仅在必要期限内保存，不作无关用途。';

export const hasPrivacyConsent = (): boolean => {
  try {
    return Taro.getStorageSync(CONSENT_STORAGE_KEY) === true;
  } catch {
    return false;
  }
};

export const markPrivacyConsent = () => {
  try {
    Taro.setStorageSync(CONSENT_STORAGE_KEY, true);
  } catch (error) {
    console.error('[privacy-consent] persist failed', error);
  }
};

export const showAgreementDoc = async (type: 'service' | 'privacy') => {
  const title = type === 'service' ? '用户服务协议' : '隐私政策';
  const content = type === 'service' ? SERVICE_TERMS_TEXT : PRIVACY_POLICY_TEXT;
  await Taro.showModal({
    title,
    content,
    showCancel: false,
    confirmText: '我知道了',
  });
};

export const ensurePrivacyConsent = async (): Promise<boolean> => {
  if (hasPrivacyConsent()) return true;

  try {
    const { tapIndex } = await Taro.showActionSheet({
      itemList: ['查看《用户服务协议》', '查看《隐私政策》', '同意并继续'],
    });

    if (tapIndex === 0) {
      await showAgreementDoc('service');
      return ensurePrivacyConsent();
    }

    if (tapIndex === 1) {
      await showAgreementDoc('privacy');
      return ensurePrivacyConsent();
    }

    markPrivacyConsent();
    return true;
  } catch {
    return false;
  }
};

