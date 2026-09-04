import matter from 'gray-matter';

export interface ParsedMarkdownFile {
  title: string;
  contentMd: string;
  nodeId?: string;
}

export function parseMarkdownFile(buffer: Buffer, fallbackName: string): ParsedMarkdownFile {
  const raw = buffer.toString('utf8');
  const { data, content } = matter(raw);
  const titleFromMeta = typeof data.title === 'string' ? data.title.trim() : '';
  const nodeId = typeof data.nodeId === 'string' ? data.nodeId.trim() : undefined;
  const fileTitle = fallbackName.replace(/\.md$/i, '').trim();
  const title = titleFromMeta || fileTitle || '未命名节点';

  return {
    title: title.slice(0, 200),
    contentMd: content.trim(),
    nodeId,
  };
}
