import type { ComfyPrompt, BuildPromptOptions } from '../types';

export function formatPromptSegment(prompt: ComfyPrompt, wrapWeight = true): string {
  const content = prompt.content.trim();
  if (!content) return '';
  if (!wrapWeight || !prompt.weight) return content;
  const weight = Number(prompt.weight);
  if (!Number.isFinite(weight) || weight === 1) return content;
  return `(${content}:${weight})`;
}

export function buildPromptString(
  prompts: ComfyPrompt[],
  options: BuildPromptOptions = {},
): string {
  const separator = options.separator ?? ', ';
  const wrapWeight = options.wrapWeight ?? true;
  return prompts
    .map((p) => formatPromptSegment(p, wrapWeight))
    .filter(Boolean)
    .join(separator);
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function tagsToInput(tags: string[] | null | undefined): string {
  return (tags ?? []).join(', ');
}
