import {
  NapCatConfig,
  OneBotActionResponse,
  OneBotFriendInfo,
  OneBotGroupInfo,
  SendGroupMessagePayload,
  SendPrivateMessagePayload,
} from '../types';

export class NapCatClient {
  private readonly baseUrl: string;
  private readonly accessToken?: string;
  private readonly timeoutMs: number;

  constructor(config: NapCatConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.accessToken = config.accessToken;
    this.timeoutMs = config.timeoutMs ?? 12000;
  }

  async callApi<TData = unknown>(action: string, params?: Record<string, unknown>): Promise<OneBotActionResponse<TData>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        },
        body: JSON.stringify(params ?? {}),
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          status: 'failed',
          retcode: response.status,
          message: `NapCat HTTP ${response.status}`,
        };
      }

      const payload = (await response.json()) as OneBotActionResponse<TData>;
      return payload;
    } catch (error) {
      return {
        status: 'failed',
        retcode: -1,
        message: error instanceof Error ? error.message : 'Unknown NapCat request error',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendGroupMessage(payload: SendGroupMessagePayload) {
    return this.callApi<{ message_id: number }>('send_group_msg', payload as unknown as Record<string, unknown>);
  }

  async sendPrivateMessage(payload: SendPrivateMessagePayload) {
    return this.callApi<{ message_id: number }>('send_private_msg', payload as unknown as Record<string, unknown>);
  }

  async getGroupList() {
    return this.callApi<OneBotGroupInfo[]>('get_group_list');
  }

  async getFriendList() {
    return this.callApi<OneBotFriendInfo[]>('get_friend_list');
  }
}
