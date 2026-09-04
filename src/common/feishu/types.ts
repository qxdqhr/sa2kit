export interface FeishuPostElement {
  tag: string;
  text?: string;
  href?: string;
}

export interface FeishuPostMessage {
  msg_type: 'post';
  content: {
    post: {
      zh_cn: {
        title: string;
        content: Array<Array<FeishuPostElement>>;
      };
    };
  };
}

export interface FeishuSendResult {
  success: boolean;
  status: number;
  errorMessage?: string;
}

export interface FeishuSendOptions {
  /** 请求超时毫秒数，默认 15000 */
  timeoutMs?: number;
}
