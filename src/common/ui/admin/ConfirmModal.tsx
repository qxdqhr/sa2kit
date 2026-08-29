'use client';

import React, { type ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
};

/** 动森确认框：兼容旧 PopWindow ConfirmModal API */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  isLoading = false,
}: ConfirmModalProps) {
  const footer: ReactNode = (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" disabled={isLoading} onClick={onClose}>
        {cancelText}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        loading={isLoading}
        disabled={isLoading}
        onClick={onConfirm}
      >
        {isLoading ? '处理中...' : confirmText}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      maskClosable={!isLoading}
      typewriter={false}
    >
      <p className="m-0 text-[var(--sa2-text-body,#725d42)]">{message}</p>
    </Modal>
  );
}
