/**
 * @package sa2kit/common/feishu
 * 飞书自定义机器人 Webhook（签名 + post 富文本）
 */
export type {
  FeishuPostElement,
  FeishuPostMessage,
  FeishuSendOptions,
  FeishuSendResult,
} from './types';

export { sendFeishuPostMessage } from './sendPostMessage';
export { buildFeishuPostMessage, type FeishuPostLink } from './buildPostMessage';
export { formatDateTime } from './formatDateTime';
export {
  buildContactFeishuMessage,
  type ContactSubmission,
} from './templates/contactMessage';
export {
  buildCiFeishuMessage,
  type CiNotifyContext,
  type CiNotifyStatus,
} from './templates/ciMessage';
