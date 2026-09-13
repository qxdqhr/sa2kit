import type { PromptKind } from '../types';

export type NamedPromptEntry = {
  name: string;
  content: string;
};

export type ImportedTemplate = {
  name: string;
  kind: PromptKind;
  separator: string;
  description?: string;
  namedPrompts: NamedPromptEntry[];
};

/** 提示词库批量导入示例 */
export const PROMPT_LIBRARY_IMPORT_EXAMPLE = `[
  { "name": "aaa", "prompts": "bbb" },
  { "name": "另一个名称", "prompts": "提示词内容" }
]`;

/** 提示词模板导入示例 */
export const TEMPLATE_IMPORT_EXAMPLE = `{
  "name": "模板名称",
  "kind": "positive",
  "separator": ", ",
  "prompts": [
    { "name": "条目1", "prompts": "1girl" },
    { "name": "条目2", "prompts": "masterpiece" }
  ]
}`;

function parseNamedPromptEntry(raw: unknown, index: number): NamedPromptEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? '').trim();
  const content = String(row.prompts ?? row.content ?? row.prompt ?? '').trim();
  if (!name) throw new Error(`第 ${index + 1} 项缺少 name 字段`);
  if (!content) throw new Error(`第 ${index + 1} 项「${name}」缺少 prompts 内容`);
  return { name, content };
}

export function parsePromptLibraryImport(raw: string): NamedPromptEntry[] {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('导入内容为空');

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    throw new Error('请使用 JSON 数组格式，点击「复制模板规则」查看示例');
  }

  if (!Array.isArray(json)) {
    throw new Error('根节点须为 JSON 数组，格式：[{ "name": "名称", "prompts": "内容" }]');
  }

  const entries: NamedPromptEntry[] = [];
  json.forEach((item, index) => {
    const entry = parseNamedPromptEntry(item, index);
    if (entry) entries.push(entry);
  });

  if (!entries.length) {
    throw new Error('未解析到有效提示词，每项需包含 name 与 prompts');
  }
  return entries;
}

export function parseTemplateImport(raw: string): ImportedTemplate {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('导入内容为空');

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    throw new Error('请使用 JSON 格式，点击「复制模板规则」查看示例');
  }

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('模板导入须为 JSON 对象，包含 name 与 prompts 数组');
  }

  const record = json as Record<string, unknown>;
  const name = String(record.name ?? '').trim();
  if (!name) throw new Error('模板 JSON 须包含 name 字段');

  const kind = (record.kind === 'negative' ? 'negative' : 'positive') as PromptKind;
  const separator = String(record.separator ?? ', ');
  const description = record.description ? String(record.description) : undefined;

  if (!Array.isArray(record.prompts)) {
    throw new Error('模板 JSON 须包含 prompts 数组，每项为 { "name": "...", "prompts": "..." }');
  }

  const namedPrompts: NamedPromptEntry[] = [];
  record.prompts.forEach((item, index) => {
    const entry = parseNamedPromptEntry(item, index);
    if (entry) namedPrompts.push(entry);
  });

  if (!namedPrompts.length) {
    throw new Error('prompts 数组为空或格式不正确，每项须包含 name 与 prompts');
  }

  return { name, kind, separator, description, namedPrompts };
}

/** @deprecated 仅用于兼容旧调用，请使用 namedPrompts */
export function splitTemplateText(text: string, separator = ', '): string[] {
  if (!text.trim()) return [];
  const parts = text.split(separator).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  return text
    .split(/[,，;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
