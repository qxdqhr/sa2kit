export interface PopupTriggerConfig {
  deadlineTime?: string;
  advanceMinutes?: number;
  triggerType: 'after_deadline' | 'before_deadline' | 'always';
}

export interface PopupContentConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  theme?: 'warning' | 'info' | 'error' | 'success';
}

export interface PopupDisplayConfig {
  width?: number;
  height?: number | string;
  maskClosable?: boolean;
  autoCloseSeconds?: number;
}

export interface PopupConfig {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  enabled?: boolean | null;
  triggerConfig: PopupTriggerConfig;
  contentConfig: PopupContentConfig;
  displayConfig?: PopupDisplayConfig | null;
  blockProcess?: boolean | null;
  businessModule: string;
  businessScene: string;
  sortOrder?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export type NewPopupConfig = Omit<PopupConfig, 'id' | 'createdAt' | 'updatedAt'>;
