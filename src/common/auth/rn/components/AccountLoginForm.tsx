/**
 * RN 账密登录（Better Auth 3.0 — 手机/邮箱 + Bearer）
 */
import React, { useCallback, useEffect, useState } from 'react';
import { validateEmail, validatePhoneNumber } from '../../components/utils';
import {
  initSa2kitRnAuthClient,
  resetSa2kitRnAuthClientCache,
  type Sa2kitRnAuthClient,
} from '../create-rn-auth-client';
import { getRnBearerToken } from '../token-storage';
import { signInWithRnAuthClient } from '../sign-in';

// @ts-expect-error react-native 由宿主在运行时提供
const ReactNative = require('react-native') as typeof import('react-native');
const { ActivityIndicator, Pressable, Text, TextInput, View, StyleSheet } = ReactNative;

const defaultStyles = StyleSheet.create({
  label: { fontSize: 12, color: '#8b98a5', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e8edf2',
    backgroundColor: 'rgba(0,0,0,0.2)',
    fontSize: 15,
  },
  err: { color: '#f87171', marginTop: 10, fontSize: 14 },
  btn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  primary: { backgroundColor: '#3d9eff', borderColor: 'transparent' },
  disabled: { opacity: 0.6 },
  btnTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '600' },
  centerInline: { paddingVertical: 24, alignItems: 'center' },
});

const DEFAULT_LABELS = {
  authApiBase: '认证 API 根地址（含 /api）',
  account: '手机号 / 邮箱',
  password: '密码',
  submit: '登录',
} as const;

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
  account?: string;
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
  /** 登录成功，返回 Bearer session token */
  onSuccess: (token: string) => void | Promise<void>;
  theme?: RnAccountLoginTheme;
  labels?: RnAccountLoginLabels;
  placeholders?: {
    authApiBase?: string;
    account?: string;
    phone?: string;
    email?: string;
    password?: string;
  };
};

export function RnAccountLoginForm({
  authApiBase,
  defaultAuthApiBase = '',
  onAuthApiBaseChange,
  submitting = false,
  error = '',
  onError,
  onSuccess,
  theme,
  labels: labelsProp,
  placeholders,
}: RnAccountLoginFormProps) {
  const labels = {
    ...DEFAULT_LABELS,
    account: labelsProp?.account ?? labelsProp?.phone ?? labelsProp?.email ?? DEFAULT_LABELS.account,
    ...labelsProp,
  };
  const [authClient, setAuthClient] = useState<Sa2kitRnAuthClient | null>(null);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const base = authApiBase.trim() || defaultAuthApiBase;
    if (!base) {
      setAuthClient(null);
      return;
    }
    resetSa2kitRnAuthClientCache();
    initSa2kitRnAuthClient(base).then((client) => {
      if (!cancelled) setAuthClient(client);
    });
    return () => {
      cancelled = true;
    };
  }, [authApiBase, defaultAuthApiBase]);

  const handleSubmit = useCallback(async () => {
    if (!authClient) return;
    onError?.('');
    setLoading(true);
    try {
      const trimmedAccount = account.trim();
      if (!trimmedAccount || !password) {
        onError?.('请填写账号和密码');
        return;
      }

      const result = await signInWithRnAuthClient(authClient, trimmedAccount, password);
      if (!result.success) {
        onError?.(result.error);
        return;
      }

      const token = await getRnBearerToken();
      if (!token) {
        onError?.('登录成功但未获取到 Bearer token');
        return;
      }
      await onSuccess(token);
    } finally {
      setLoading(false);
    }
  }, [account, authClient, onError, onSuccess, password]);

  const authApiField = onAuthApiBaseChange ? (
    <>
      <Text style={[defaultStyles.label, theme?.label]}>{labels.authApiBase}</Text>
      <TextInput
        style={[defaultStyles.input, theme?.input, theme?.inputContainer]}
        value={authApiBase}
        onChangeText={onAuthApiBaseChange}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholders?.authApiBase ?? defaultAuthApiBase}
        placeholderTextColor="#6b7a8a"
      />
    </>
  ) : null;

  if (!authClient) {
    return (
      <View style={[defaultStyles.centerInline, theme?.loadingContainer]}>
        <ActivityIndicator />
      </View>
    );
  }

  const busy = loading || submitting;

  return (
    <>
      {authApiField}
      <Text style={[defaultStyles.label, theme?.label]}>{labels.account}</Text>
      <TextInput
        style={[defaultStyles.input, theme?.input, theme?.inputContainer]}
        value={account}
        onChangeText={setAccount}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholders?.account ?? placeholders?.phone ?? '手机号或邮箱'}
        placeholderTextColor="#6b7a8a"
      />
      <Text style={[defaultStyles.label, theme?.label]}>{labels.password}</Text>
      <TextInput
        style={[defaultStyles.input, theme?.input, theme?.inputContainer]}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholders?.password ?? '密码'}
        placeholderTextColor="#6b7a8a"
      />
      {error ? <Text style={[defaultStyles.err, theme?.error]}>{error}</Text> : null}
      <Pressable
        style={[
          defaultStyles.btn,
          defaultStyles.primary,
          theme?.button,
          theme?.buttonPrimary,
          busy && (theme?.buttonDisabled ?? defaultStyles.disabled),
        ]}
        onPress={() => void handleSubmit()}
        disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[defaultStyles.btnTextPrimary, theme?.buttonTextPrimary]}>{labels.submit}</Text>
        )}
      </Pressable>
    </>
  );
}

/** @deprecated 使用 validatePhoneNumber */
export function isPhoneAccount(account: string): boolean {
  return validatePhoneNumber(account.trim());
}
