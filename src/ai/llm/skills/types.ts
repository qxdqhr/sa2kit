import type { AiLogger, AiMessage, AiToolDefinition } from '../types';

export type SkillInputSchema = Record<string, any>;

export interface SkillExecutionContext {
  messages?: AiMessage[];
  logger?: AiLogger;
  metadata?: Record<string, any>;
}

export interface SkillDefinition<Input = any, Output = any> {
  name: string;
  description?: string;
  inputSchema?: SkillInputSchema;
  execute: (input: Input, context?: SkillExecutionContext) => Promise<Output> | Output;
}

export interface SkillRegistry {
  registerSkill(skill: SkillDefinition): void;
  unregisterSkill(name: string): boolean;
  getSkill(name: string): SkillDefinition | undefined;
  listSkills(): SkillDefinition[];
  executeSkill(name: string, input: any, context?: SkillExecutionContext): Promise<any>;
  toToolDefinitions?(): AiToolDefinition[];
}
