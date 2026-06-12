import type { AiTaskDefinition } from './types';

const registry = new Map<string, AiTaskDefinition>();

export function registerAiTask<TInput, TOutput>(task: AiTaskDefinition<TInput, TOutput>): void {
  if (registry.has(task.id)) {
    console.warn(`[aiApi] task "${task.id}" already registered, skipping duplicate`);
    return;
  }
  registry.set(task.id, task as AiTaskDefinition);
}

export function getAiTask(taskId: string): AiTaskDefinition | undefined {
  return registry.get(taskId);
}

export function listAiTasks(): string[] {
  return Array.from(registry.keys());
}

export function clearAiTasksForTest(): void {
  registry.clear();
}
