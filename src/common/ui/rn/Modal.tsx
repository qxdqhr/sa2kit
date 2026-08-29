
import {
  Modal as Sa2Modal,
  Button,
  type ModalProps as Sa2ModalProps,
} from '@sa2kit-ui/rn';
import React, { type ReactNode } from 'react';

export type ModalProps = Omit<Sa2ModalProps, 'open'> & {
  open?: boolean;
  /** RN 宿主常用 visible，与 Web open 对齐 */
  visible?: boolean;
  children?: ReactNode;
  dismissOnBackdrop?: boolean;
};

export function Modal({
  open,
  visible,
  maskClosable,
  dismissOnBackdrop = true,
  footer = null,
  typewriter = false,
  ...rest
}: ModalProps) {
  const shown = open ?? visible ?? false;
  return (
    <Sa2Modal
      open={shown}
      maskClosable={maskClosable ?? dismissOnBackdrop}
      footer={footer}
      typewriter={typewriter}
      {...rest}
    />
  );
}

export function ModalCancelButton({
  onPress,
  disabled,
  label = '取消',
}: {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button type="default" size="small" disabled={disabled} onPress={onPress}>
      {label}
    </Button>
  );
}

export function ModalPrimaryButton({
  onPress,
  disabled,
  loading,
  danger = false,
  label = '确定',
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  label?: string;
}) {
  return (
    <Button
      type="primary"
      size="small"
      danger={danger}
      disabled={disabled}
      loading={loading}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
