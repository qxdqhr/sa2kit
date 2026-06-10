'use client';

import { useCallback } from 'react';
import { errorMessage, getAuthClientError } from '../components/utils';

/** Better Auth 客户端（vanilla 或 React 均可） */
export type AuthActionsClient = Record<string, unknown>;

function clientApi(client: AuthActionsClient) {
  return client as {
    signIn: {
      email: (input: { email: string; password: string }) => Promise<unknown>;
      phoneNumber: (input: { phoneNumber: string; password: string }) => Promise<unknown>;
      emailOtp: (input: { email: string; otp: string }) => Promise<unknown>;
    };
    signUp: { email: (input: { email: string; password: string; name: string }) => Promise<unknown> };
    phoneNumber: {
      sendOtp: (input: { phoneNumber: string }) => Promise<unknown>;
      verify: (input: { phoneNumber: string; code: string }) => Promise<unknown>;
      requestPasswordReset: (input: { phoneNumber: string }) => Promise<unknown>;
      resetPassword: (input: { phoneNumber: string; otp: string; newPassword: string }) => Promise<unknown>;
    };
    emailOtp: {
      sendVerificationOtp: (input: {
        email: string;
        type: 'sign-in' | 'email-verification' | 'forget-password';
      }) => Promise<unknown>;
    };
    signOut: () => Promise<unknown>;
  };
}

export function useAuthActions(authClient: AuthActionsClient) {
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await clientApi(authClient).signIn.email({ email, password });
        const err = getAuthClientError(result, '登录失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '登录失败') };
      }
    },
    [authClient],
  );

  const signInWithPhonePassword = useCallback(
    async (phoneNumber: string, password: string) => {
      try {
        const result = await clientApi(authClient).signIn.phoneNumber({ phoneNumber, password });
        const err = getAuthClientError(result, '登录失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '登录失败') };
      }
    },
    [authClient],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const result = await clientApi(authClient).signUp.email({ email, password, name });
        const err = getAuthClientError(result, '注册失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '注册失败') };
      }
    },
    [authClient],
  );

  const sendPhoneOtp = useCallback(
    async (phoneNumber: string) => {
      try {
        const result = await clientApi(authClient).phoneNumber.sendOtp({ phoneNumber });
        const err = getAuthClientError(result, '验证码发送失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '验证码发送失败') };
      }
    },
    [authClient],
  );

  const verifyPhoneOtp = useCallback(
    async (phoneNumber: string, code: string) => {
      try {
        const result = await clientApi(authClient).phoneNumber.verify({ phoneNumber, code });
        const err = getAuthClientError(result, '验证失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '验证失败') };
      }
    },
    [authClient],
  );

  const sendEmailOtp = useCallback(
    async (email: string, type: 'sign-in' | 'email-verification' | 'forget-password' = 'sign-in') => {
      try {
        const result = await clientApi(authClient).emailOtp.sendVerificationOtp({ email, type });
        const err = getAuthClientError(result, '验证码发送失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '验证码发送失败') };
      }
    },
    [authClient],
  );

  const signInWithEmailOtp = useCallback(
    async (email: string, otp: string) => {
      try {
        const result = await clientApi(authClient).signIn.emailOtp({ email, otp });
        const err = getAuthClientError(result, '登录失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '登录失败') };
      }
    },
    [authClient],
  );

  const requestPhonePasswordReset = useCallback(
    async (phoneNumber: string) => {
      try {
        const result = await clientApi(authClient).phoneNumber.requestPasswordReset({ phoneNumber });
        const err = getAuthClientError(result, '发送验证码失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '发送验证码失败') };
      }
    },
    [authClient],
  );

  const resetPhonePassword = useCallback(
    async (phoneNumber: string, otp: string, newPassword: string) => {
      try {
        const result = await clientApi(authClient).phoneNumber.resetPassword({
          phoneNumber,
          otp,
          newPassword,
        });
        const err = getAuthClientError(result, '重置密码失败');
        return err ? { success: false as const, error: err } : { success: true as const };
      } catch (e) {
        return { success: false as const, error: errorMessage(e, '重置密码失败') };
      }
    },
    [authClient],
  );

  const signOut = useCallback(async () => {
    try {
      await clientApi(authClient).signOut();
      return { success: true as const };
    } catch (e) {
      return { success: false as const, error: errorMessage(e, '退出失败') };
    }
  }, [authClient]);

  return {
    signInWithEmail,
    signInWithPhonePassword,
    signUpWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
    sendEmailOtp,
    signInWithEmailOtp,
    requestPhonePasswordReset,
    resetPhonePassword,
    signOut,
  };
}

export type UseAuthActionsReturn = ReturnType<typeof useAuthActions>;
