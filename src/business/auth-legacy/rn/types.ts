/** 样式对象由宿主 RN 传入，避免在类型层硬依赖 react-native 包 */
export type RnAccountLoginTheme = Partial<{
  label: object;
  input: object;
  inputContainer: object;
  error: object;
  button: object;
  buttonPrimary: object;
  buttonText: object;
  buttonTextPrimary: object;
  buttonDisabled: object;
  loadingContainer: object;
}>;

export type RnAccountLoginLabels = {
  authApiBase?: string;
  phone?: string;
  email?: string;
  password?: string;
  submit?: string;
};

export type RnAccountLoginFormProps = {
  authApiBase: string;
  defaultAuthApiBase?: string;
  onAuthApiBaseChange?: (value: string) => void;
  submitting?: boolean;
  error?: string;
  onError?: (message: string) => void;
  /** 登录成功，返回 Bearer 可用 token（JWT 或 legacy sessionToken） */
  onSuccess: (token: string) => void | Promise<void>;
  theme?: RnAccountLoginTheme;
  labels?: RnAccountLoginLabels;
  placeholders?: {
    authApiBase?: string;
    phone?: string;
    email?: string;
    password?: string;
  };
};
