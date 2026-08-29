'use client';

import React, { type ComponentProps, type ReactNode } from 'react';
import { Modal } from '../admin/Modal';
import { Button } from '../admin/Button';
import { Input } from '../admin/Input';
import { Label } from '../admin/Label';
import { cn } from 'sa2kit/common/utils';

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="my-4 rounded-[12px] border border-[var(--sa2-error,#e05a5a)]/40 bg-[var(--sa2-error,#e05a5a)]/10 p-3 text-sm leading-relaxed text-[var(--sa2-error,#e05a5a)]">
      {message}
    </div>
  );
}

export function AuthLinkButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded border-none bg-transparent px-1 py-0.5 text-sm font-medium text-[var(--sa2-primary,#19c8b9)] underline transition-all hover:bg-[var(--sa2-primary-bg,#e6f9f6)] hover:no-underline disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AuthModeChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-1 pt-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Button
            key={opt.value}
            type={active ? 'primary' : 'default'}
            size="small"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

export function AuthField({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export type AuthTextInputProps = ComponentProps<typeof Input> & { id?: string };

export function AuthTextInput(props: AuthTextInputProps) {
  return <Input size="large" shadow={false} {...props} />;
}

export function AuthSubmitButton({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <Button type="primary" block size="large" htmlType="submit" loading={loading} disabled={loading}>
      {children}
    </Button>
  );
}

export function AuthSwitchRow({
  hint,
  actionLabel,
  onAction,
}: {
  hint: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  if (!onAction) return null;
  return (
    <div className="mt-5 border-t border-[var(--sa2-border-light,#e8e2d6)] pt-4 text-center">
      <span className="mr-1 text-sm text-[var(--sa2-text-secondary,#9f927d)]">{hint}</span>
      <AuthLinkButton onClick={onAction}>{actionLabel}</AuthLinkButton>
    </div>
  );
}

export function AuthGateFallback({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center text-[var(--sa2-text-secondary,#9f927d)]">
      <div className="text-5xl opacity-50">🔒</div>
      <div className="text-lg font-medium text-[var(--sa2-text,#794f27)]">请先登录以访问此页面</div>
      <div className="text-sm opacity-70">登录或注册后即可查看相关内容</div>
      <div className="mt-2 flex gap-3">
        <Button type="primary" size="small" onClick={onLogin}>
          登录
        </Button>
        <Button type="default" size="small" onClick={onRegister}>
          注册
        </Button>
      </div>
    </div>
  );
}

export function AuthLoadingGate({ label = '验证登录状态...' }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-[var(--sa2-text-secondary,#9f927d)]">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--sa2-border-light,#e8e2d6)] border-t-[var(--sa2-primary,#19c8b9)]" />
      <div>{label}</div>
    </div>
  );
}

type AuthModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: number | string;
};

/** 动森 Auth 弹窗壳（基于 admin Modal） */
export function AuthModalShell({
  open,
  onClose,
  title,
  description,
  children,
  width = 420,
}: AuthModalShellProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      width={width}
      footer={null}
      typewriter={false}
      maskClosable
    >
      {description ? (
        <p className="mb-4 mt-0 text-sm text-[var(--sa2-text-secondary,#9f927d)]">{description}</p>
      ) : null}
      {children}
    </Modal>
  );
}
