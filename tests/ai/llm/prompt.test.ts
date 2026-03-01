import { describe, expect, it } from 'vitest';
import { applyPromptTemplate } from '../../../src/ai/llm';

describe('applyPromptTemplate', () => {
  it('replaces variables', () => {
    const template = 'You are {{role}}. Input: {{input}}';
    const result = applyPromptTemplate(template, { role: 'assistant', input: 'hi' });
    expect(result).toBe('You are assistant. Input: hi');
  });

  it('uses missingValue for missing variables', () => {
    const template = 'Hello {{name}}';
    const result = applyPromptTemplate(template, {}, { missingValue: 'friend' });
    expect(result).toBe('Hello friend');
  });

  it('preserves unknown tokens when configured', () => {
    const template = 'Hello {{name}}';
    const result = applyPromptTemplate(template, {}, { preserveUnknown: true });
    expect(result).toBe('Hello {{name}}');
  });
});
