import { describe, expect, it } from 'vitest';
import { createSkillRegistry } from '../../../src/ai/llm';

describe('skill registry', () => {
  it('registers and executes skills', async () => {
    const registry = createSkillRegistry([
      {
        name: 'echo',
        execute: (input: { text: string }) => ({ value: input.text }),
      },
    ]);

    const result = await registry.executeSkill('echo', { text: 'hello' });
    expect(result).toEqual({ value: 'hello' });
    expect(registry.listSkills()).toHaveLength(1);
  });

  it('throws for missing skills', async () => {
    const registry = createSkillRegistry();
    await expect(registry.executeSkill('missing', {})).rejects.toThrow('Skill not found');
  });
});
