/**
 * 节点笔记页面路由。
 *
 * - 独立子应用：不设 NEXT_PUBLIC_NODE_NOTES_EMBED_PATH，使用 / 与 /[documentId]
 * - 历史主站嵌入：若设置 NEXT_PUBLIC_NODE_NOTES_EMBED_PATH 则仍走该前缀（已废弃）
 */
export function getNodeNotesBasePath(): string {
  const embed = process.env.NEXT_PUBLIC_NODE_NOTES_EMBED_PATH;
  if (embed !== undefined && embed !== '') {
    return embed.replace(/\/$/, '');
  }
  return '';
}

export function nodeNotesGalleryPath(): string {
  const base = getNodeNotesBasePath();
  return base || '/';
}

export function nodeNotesDocumentPath(documentId: string): string {
  const base = getNodeNotesBasePath();
  return base ? `${base}/${documentId}` : `/${documentId}`;
}

export function getTestFieldPath(): string {
  return process.env.NEXT_PUBLIC_TEST_FIELD_PATH ?? '/testField';
}
