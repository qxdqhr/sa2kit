import type { FeishuPostElement, FeishuPostMessage } from './types';

export interface FeishuPostLink {
  text: string;
  href: string;
}

/**
 * 构建飞书 post 富文本消息体。
 */
export function buildFeishuPostMessage(
  title: string,
  lines: string[],
  link?: FeishuPostLink,
): FeishuPostMessage {
  const content: Array<Array<FeishuPostElement>> = lines
    .filter(Boolean)
    .map((line) => [{ tag: 'text', text: line }]);

  if (link) {
    content.push([{ tag: 'a', text: link.text, href: link.href }]);
  }

  return {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: { title, content },
      },
    },
  };
}
