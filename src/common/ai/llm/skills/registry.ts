import type { AiToolDefinition } from '../types';
import type { SkillDefinition, SkillExecutionContext, SkillRegistry } from './types';

export const skillToToolDefinition = (skill: SkillDefinition): AiToolDefinition => {
  const toolDefinition: AiToolDefinition = {
    type: 'function',
    function: {
      name: skill.name,
      description: skill.description,
    },
  };

  if (skill.inputSchema) {
    toolDefinition.function.parameters = skill.inputSchema;
  }

  return toolDefinition;
};

export class InMemorySkillRegistry implements SkillRegistry {
  private skills = new Map<string, SkillDefinition>();

  constructor(initialSkills?: SkillDefinition[]) {
    initialSkills?.forEach((skill) => {
      this.skills.set(skill.name, skill);
    });
  }

  registerSkill(skill: SkillDefinition): void {
    this.skills.set(skill.name, skill);
  }

  unregisterSkill(name: string): boolean {
    return this.skills.delete(name);
  }

  getSkill(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  listSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  async executeSkill(name: string, input: any, context?: SkillExecutionContext): Promise<any> {
    const skill = this.skills.get(name);
    if (!skill) {
      throw new Error(`Skill not found: ${name}`);
    }
    return await skill.execute(input, context);
  }

  toToolDefinitions(): AiToolDefinition[] {
    return this.listSkills().map(skillToToolDefinition);
  }
}

export const createSkillRegistry = (initialSkills?: SkillDefinition[]): InMemorySkillRegistry => {
  return new InMemorySkillRegistry(initialSkills);
};
