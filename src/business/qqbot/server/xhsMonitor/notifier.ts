import { NapCatClient } from '../client';
import { XhsNotificationPayload, XhsNotifier } from './types';

export interface XhsQqNotifierOptions {
  client: NapCatClient;
  target: { type: 'group'; groupId: number } | { type: 'private'; userId: number };
  messageTemplate?: (payload: XhsNotificationPayload) => string;
}

function defaultMessageTemplate(payload: XhsNotificationPayload): string {
  return [
    `【小红书新帖提醒】${payload.accountLabel}`,
    payload.post.title ? `标题：${payload.post.title}` : undefined,
    `链接：${payload.post.url}`,
    `检测时间：${payload.detectedAt}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export class XhsQqNotifier implements XhsNotifier {
  private readonly client: NapCatClient;
  private readonly target: XhsQqNotifierOptions['target'];
  private readonly messageTemplate: (payload: XhsNotificationPayload) => string;

  constructor(options: XhsQqNotifierOptions) {
    this.client = options.client;
    this.target = options.target;
    this.messageTemplate = options.messageTemplate ?? defaultMessageTemplate;
  }

  async notify(payload: XhsNotificationPayload): Promise<void> {
    const message = this.messageTemplate(payload);
    const response =
      this.target.type === 'group'
        ? await this.client.sendGroupMessage({
            group_id: this.target.groupId,
            message,
          })
        : await this.client.sendPrivateMessage({
            user_id: this.target.userId,
            message,
          });

    if (response.status !== 'ok') {
      throw new Error(`Failed to send QQ message: ${response.message ?? 'Unknown error'}`);
    }
  }
}
