'use client';

import React from 'react';
import { LoginModal, RegisterModal } from 'sa2kit/common/auth/components';

export type LoginRegisterModalsProps = {
  loginOpen: boolean;
  registerOpen: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onSuccess?: () => void;
};

export function LoginRegisterModals({
  loginOpen,
  registerOpen,
  onCloseLogin,
  onCloseRegister,
  onOpenLogin,
  onOpenRegister,
  onSuccess,
}: LoginRegisterModalsProps) {
  return (
    <>
      <LoginModal
        isOpen={loginOpen}
        onClose={onCloseLogin}
        onSuccess={onSuccess}
        onSwitchToRegister={() => {
          onCloseLogin();
          onOpenRegister();
        }}
      />
      <RegisterModal
        isOpen={registerOpen}
        onClose={onCloseRegister}
        onSuccess={onSuccess}
        onSwitchToLogin={() => {
          onCloseRegister();
          onOpenLogin();
        }}
      />
    </>
  );
}
