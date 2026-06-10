import { normalizePromptVariables, PromptVariables } from './variables';

export interface PromptTemplateOptions {
  missingValue?: string;
  preserveUnknown?: boolean;
}

export const applyPromptTemplate = (
  template: string,
  variables: PromptVariables = {},
  options: PromptTemplateOptions = {}
): string => {
  if (!template) {
    return '';
  }

  const resolved = normalizePromptVariables(variables);
  const missingValue = options.missingValue ?? '';

  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(resolved, key)) {
      return resolved[key] ?? '';
    }

    return options.preserveUnknown ? `{{${key}}}` : missingValue;
  });
};
