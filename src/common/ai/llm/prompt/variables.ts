export type PromptVariableValue = string | number | boolean | null | undefined;

export type PromptVariables = Record<string, PromptVariableValue>;

export const normalizePromptVariables = (
  variables: PromptVariables = {}
): Record<string, string> => {
  const normalized: Record<string, string> = {};

  Object.entries(variables).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      normalized[key] = '';
    } else {
      normalized[key] = String(value);
    }
  });

  return normalized;
};
