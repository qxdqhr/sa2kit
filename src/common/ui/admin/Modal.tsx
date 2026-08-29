'use client';

import { Modal as Sa2Modal, type ModalProps as Sa2ModalProps } from '@sa2kit-ui/react';
import React, { type ReactNode } from 'react';

export type ModalProps = Omit<Sa2ModalProps, 'open'> & {
  open?: boolean;
  /** @deprecated 使用 open；为兼容旧 shadcn/PopWindow API */
  isOpen?: boolean;
  children?: ReactNode;
};

/** 动森 Modal：兼容 isOpen，管理台默认关闭打字机与底部按钮 */
export function Modal({
  open,
  isOpen,
  footer = null,
  typewriter = false,
  ...rest
}: ModalProps) {
  const visible = open ?? isOpen ?? false;
  return (
    <Sa2Modal
      open={visible}
      footer={footer}
      typewriter={typewriter}
      {...rest}
    />
  );
}
