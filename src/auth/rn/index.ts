/** 1.x 兼容：common RN client + legacy 手机号登录表单 */
export * from '../../common/auth/rn';
export {
  loginWithLegacyPhone,
  isPhoneAccount,
  RnAccountLoginForm,
  type LegacyPhoneLoginResult,
  type RnAccountLoginFormProps,
  type RnAccountLoginTheme,
  type RnAccountLoginLabels,
} from '../../business/auth-legacy/rn';
