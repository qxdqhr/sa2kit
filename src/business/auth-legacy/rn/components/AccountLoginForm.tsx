/**
 * RN 账密登录表单：手机号 → legacy /auth/login；邮箱 → sa2kit LoginForm + BaseApiClient
 */
import React, { useCallback, useEffect, useState } from 'react';
import { LoginForm } from '../../../../common/auth/components/LoginForm';
import { initRnAuthClient, resetRnAuthClientCache } from '../../../../common/auth/rn/client';
import { isPhoneAccount, loginWithLegacyPhone } from '../legacy-login';
import type { RnAccountLoginFormProps } from '../types';

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
  phone: '手机号',
  email: '邮箱',
  password: '密码',
  submit: '登录',
} as const;

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
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [apiClient, setApiClient] = useState<
    Awaited<ReturnType<typeof initRnAuthClient>> | null
  >(null);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [useLegacyPhone, setUseLegacyPhone] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const base = authApiBase.trim() || defaultAuthApiBase;
    if (!base) {
      setApiClient(null);
      return;
    }
    resetRnAuthClientCache();
    initRnAuthClient(base).then(c => {
      if (!cancelled) {
        setApiClient(c);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authApiBase, defaultAuthApiBase]);

  useEffect(() => {
    const trimmed = account.trim();
    if (!trimmed) {
      setUseLegacyPhone(true);
      return;
    }
    setUseLegacyPhone(isPhoneAccount(trimmed));
  }, [account]);

  const handleLegacySubmit = useCallback(async () => {
    const base = authApiBase.trim() || defaultAuthApiBase;
    onError?.('');
    const result = await loginWithLegacyPhone(base, account, password);
    if (!result.success || !result.token) {
      onError?.(result.message ?? '登录失败');
      return;
    }
    await onSuccess(result.token);
  }, [account, authApiBase, defaultAuthApiBase, onError, onSuccess, password]);

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

  if (!apiClient) {
    return (
      <View style={[defaultStyles.centerInline, theme?.loadingContainer]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (useLegacyPhone) {
    return (
      <>
        {authApiField}
        <Text style={[defaultStyles.label, theme?.label]}>{labels.phone}</Text>
        <TextInput
          style={[defaultStyles.input, theme?.input, theme?.inputContainer]}
          value={account}
          onChangeText={setAccount}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholders?.phone ?? '13800138000'}
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
            submitting && (theme?.buttonDisabled ?? defaultStyles.disabled),
          ]}
          onPress={handleLegacySubmit}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[defaultStyles.btnTextPrimary, theme?.buttonTextPrimary]}>
              {labels.submit}
            </Text>
          )}
        </Pressable>
      </>
    );
  }

  return (
    <>
      {authApiField}
      <LoginForm
        apiClient={apiClient}
        onSuccess={() => {
          const tok = apiClient.getToken();
          if (tok) {
            void onSuccess(tok);
          } else {
            onError?.('登录成功但未获取到令牌');
          }
        }}
        onError={msg => onError?.(msg)}>
        {({
          email,
          password: pwd,
          loading,
          error: formErr,
          handleEmailChange,
          handlePasswordChange,
          handleSubmit,
        }) => (
          <>
            <Text style={[defaultStyles.label, theme?.label]}>{labels.email}</Text>
            <TextInput
              style={[defaultStyles.input, theme?.input, theme?.inputContainer]}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={placeholders?.email ?? 'user@example.com'}
              placeholderTextColor="#6b7a8a"
            />
            <Text style={[defaultStyles.label, theme?.label]}>{labels.password}</Text>
            <TextInput
              style={[defaultStyles.input, theme?.input, theme?.inputContainer]}
              value={pwd}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={placeholders?.password ?? '密码'}
              placeholderTextColor="#6b7a8a"
            />
            {(formErr || error) ? (
              <Text style={[defaultStyles.err, theme?.error]}>{formErr ?? error}</Text>
            ) : null}
            <Pressable
              style={[
                defaultStyles.btn,
                defaultStyles.primary,
                theme?.button,
                theme?.buttonPrimary,
                (loading || submitting) &&
                  (theme?.buttonDisabled ?? defaultStyles.disabled),
              ]}
              onPress={() => handleSubmit()}
              disabled={loading || submitting}>
              {loading || submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[defaultStyles.btnTextPrimary, theme?.buttonTextPrimary]}>
                  {labels.submit}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </LoginForm>
    </>
  );
}
