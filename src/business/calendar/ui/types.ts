import type { ComponentType, ReactNode } from 'react';

/** 与 PopWindow Modal 对齐的最小 props（避免 business 依赖整包 @/components） */
export type CalendarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  maskClosable?: boolean;
  children: ReactNode;
  zIndex?: number;
  overlayClassName?: string;
};

export type CalendarConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive';
  isLoading?: boolean;
};

export type CalendarUiComponents = {
  Modal: ComponentType<CalendarModalProps>;
  ConfirmModal: ComponentType<CalendarConfirmModalProps>;
};
