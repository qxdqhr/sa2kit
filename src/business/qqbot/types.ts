export interface NapCatConfig {
  baseUrl: string;
  accessToken?: string;
  timeoutMs?: number;
}

export type OneBotStatus = 'ok' | 'failed';

export interface OneBotActionResponse<TData = unknown> {
  status: OneBotStatus;
  retcode: number;
  data?: TData;
  message?: string;
  wording?: string;
  echo?: string;
}

export interface OneBotGroupInfo {
  group_id: number;
  group_name: string;
  member_count?: number;
  max_member_count?: number;
}

export interface OneBotFriendInfo {
  user_id: number;
  nickname: string;
  remark?: string;
}

export interface SendGroupMessagePayload {
  group_id: number;
  message: string;
  auto_escape?: boolean;
}

export interface SendPrivateMessagePayload {
  user_id: number;
  message: string;
  auto_escape?: boolean;
}

export interface NapCatWebApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface NapCatWebhookEvent {
  post_type?: string;
  message_type?: string;
  notice_type?: string;
  request_type?: string;
  self_id?: number;
  time?: number;
  [key: string]: unknown;
}
