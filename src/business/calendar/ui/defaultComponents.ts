/**
 * 默认 UI 绑定：仅在页面/应用层 import，calendar 业务组件通过 Context 消费。
 */
import { Modal, ConfirmModal } from '@/components/PopWindow';
import type { CalendarUiComponents } from './types';

export const defaultCalendarUi: CalendarUiComponents = {
  Modal,
  ConfirmModal,
};
