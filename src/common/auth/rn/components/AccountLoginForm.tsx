/**
 * RN 账密登录（Better Auth 3.0 — 手机/邮箱 + Bearer）
 * UI：`sa2kit/common/ui/rn`；逻辑仍在本文件。
 */
import React, { useCallback, useEffect, useState } from 'react';
import { validatePhoneNumber } from '../../components/utils';
import {
  initSa2kitRnAuthClient,
  resetSa2kitRnAuthClientCache,
  type Sa2kitRnAuthClient,
} from '../create-rn-auth-client';
import { getRnBearerToken } from '../token-storage';
import { signInWithRnAuthClient } from '../sign-in';
import { Button, Input, Loading } from '../../../ui/rn';

// @ts-expect-error react-native 由宿主在运行时提供
const ReactNative = require('react-native') as typeof import('react-native');
const { Text, View } = ReactNative;

const DEFAULT_LABELS = {
  authApiBase: '认证 API 根地址（含 /api）',
  account: '手机号 / 邮箱',
  password: '密码',
  submit: '登录',
} as const;

/** @deprecated 主题改走 NativeWind / sa2-*；保留字段以免破坏调用方 */
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

  if (!authClient) {
    return (
      <View className="items-center py-6">
        <Loading active />
      </View>
    );
  }

  const busy = loading || submitting;

  return (
    <View className="gap-1">
      {onAuthApiBaseChange ? (
        <>
          <Text className="mb-1 mt-3 text-xs text-[var(--sa2-text-secondary,#9f927d)]">
            {labels.authApiBase}
          </Text>
          <Input
            value={authApiBase}
            onChangeText={onAuthApiBaseChange}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={placeholders?.authApiBase ?? defaultAuthApiBase}
          />
        </>
      ) : null}

      <Text className="mb-1 mt-3 text-xs text-[var(--sa2-text-secondary,#9f927d)]">{labels.account}</Text>
      <Input
        value={account}
        onChangeText={setAccount}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholders?.account ?? placeholders?.phone ?? '手机号或邮箱'}
      />

      <Text className="mb-1 mt-3 text-xs text-[var(--sa2-text-secondary,#9f927d)]">{labels.password}</Text>
      <Input
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholders?.password ?? '密码'}
      />

      {error ? (
        <Text className="mt-2 text-sm text-[var(--sa2-error,#e05a5a)]">{error}</Text>
      ) : null}

      <View className="mt-4">
        <Button type="primary" block loading={busy} disabled={busy} onPress={() => void handleSubmit()}>
          {labels.submit}
        </Button>
      </View>
    </View>
  );
}

/** @deprecated 使用 validatePhoneNumber */
export function isPhoneAccount(account: string): boolean {
  return validatePhoneNumber(account.trim());
}
