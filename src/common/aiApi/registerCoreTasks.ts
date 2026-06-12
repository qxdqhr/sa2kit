import { registerAiTask } from './taskRegistry';
import { coreLlmCompletionTask } from './tasks/coreLlmCompletion';
import { coreStructuredMultimodalTask } from './tasks/coreStructuredMultimodal';
import { coreConnectivityTestTask } from './tasks/coreConnectivityTest';

let registered = false;

/** 注册内置通用 AI 任务（幂等） */
export function registerCoreAiTasks(): void {
  if (registered) return;
  registerAiTask(coreLlmCompletionTask);
  registerAiTask(coreStructuredMultimodalTask);
  registerAiTask(coreConnectivityTestTask);
  registered = true;
}

/** 别名：确保 core 任务已注册 */
export const ensureCoreAiTasksRegistered = registerCoreAiTasks;

export function resetCoreAiTasksForTest(): void {
  registered = false;
}
