/**
 * @deprecated 2.x headless 表单状态
 */
export interface LoginFormState {
  email: string;
  password: string;
  loading: boolean;
  error: string | null;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

export interface RegisterFormState {
  email: string;
  password: string;
  username: string;
  loading: boolean;
  error: string | null;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleUsernameChange: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}
