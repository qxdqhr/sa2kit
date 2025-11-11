/**
 * 文件处理队列管理系统
 * 支持异步任务调度、优先级排序、并发控制等功能
 */

import { EventEmitter } from 'events';
import { createLogger } from '../../../logger';
import type { IFileProcessor, ProcessingOptions, ProcessingResult, ProcessorType } from '../types';

const logger = createLogger('ProcessingQueue');

// 队列任务相关类型定义
export interface QueueTask {
  id: string;
  inputPath: string;
  outputPath: string;
  options: ProcessingOptions;
  priority: TaskPriority;
  status: TaskStatus;
  processor?: IFileProcessor;
  startTime?: number;
  endTime?: number;
  result?: ProcessingResult;
  error?: string;
  retries: number;
  maxRetries: number;
  onProgress?: (task: QueueTask, progress: number) => void;
  onComplete?: (task: QueueTask, result: ProcessingResult) => void;
  onError?: (task: QueueTask, error: string) => void;
}

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface QueueOptions {
  maxConcurrentTasks?: number;
  maxRetries?: number;
  retryDelay?: number;
  taskTimeout?: number;
  autoStart?: boolean;
}

export interface QueueStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  averageProcessingTime: number;
  successRate: number;
}

/**
 * 文件处理队列管理器
 */
export class ProcessingQueue extends EventEmitter {
  private tasks: Map<string, QueueTask> = new Map();
  private runningTasks: Set<string> = new Set();
  private processors: Map<ProcessorType, IFileProcessor> = new Map();

  private options: Required<QueueOptions>;
  private isStarted = false;
  private processInterval: NodeJS.Timeout | null = null;

  constructor(options: QueueOptions = {}) {
    super();

    this.options = {
      maxConcurrentTasks: options.maxConcurrentTasks || 3,
      maxRetries: options.maxRetries || 2,
      retryDelay: options.retryDelay || 5000,
      taskTimeout: options.taskTimeout || 300000, // 5分钟
      autoStart: options.autoStart !== false,
    };

    logger.info('📋 [ProcessingQueue] 队列管理器已创建');

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * 注册文件处理器
   */
  registerProcessor(processor: IFileProcessor): void {
    this.processors.set(processor.type, processor);
    logger.info(`🔧 [ProcessingQueue] 注册处理器: ${processor.type}`);
  }

  /**
   * 添加任务到队列
   */
  addTask(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions,
    taskOptions: Partial<
      Pick<QueueTask, 'priority' | 'maxRetries' | 'onProgress' | 'onComplete' | 'onError'>
    > = {}
  ): string {
    const taskId = this.generateTaskId();

    const task: QueueTask = {
      id: taskId,
      inputPath,
      outputPath,
      options,
      priority: taskOptions.priority || 'normal',
      status: 'pending',
      retries: 0,
      maxRetries: taskOptions.maxRetries || this.options.maxRetries,
      onProgress: taskOptions.onProgress,
      onComplete: taskOptions.onComplete,
      onError: taskOptions.onError,
    };

    // 获取对应的处理器
    const processor = this.processors.get(options.type);
    if (!processor) {
      throw new Error(`未找到类型为 ${options.type} 的文件处理器`);
    }
    task.processor = processor;

    this.tasks.set(taskId, task);

    logger.info(`📝 [ProcessingQueue] 添加任务: ${taskId} (${inputPath})`);

    this.emit('taskAdded', task);

    // 如果队列已启动，尝试立即处理
    if (this.isStarted) {
      this.processNext();
    }

    return taskId;
  }

  /**
   * 启动队列处理
   */
  start(): void {
    if (this.isStarted) {
      console.warn('⚠️ [ProcessingQueue] 队列已经启动');
      return;
    }

    this.isStarted = true;
    logger.info('▶️ [ProcessingQueue] 启动队列处理');

    // 定期检查并处理任务
    this.processInterval = setInterval(() => {
      this.processNext();
    }, 1000);

    this.emit('started');

    // 立即尝试处理任务
    this.processNext();
  }

  /**
   * 停止队列处理
   */
  stop(): void {
    if (!this.isStarted) {
      console.warn('⚠️ [ProcessingQueue] 队列未启动');
      return;
    }

    this.isStarted = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    logger.info('⏹️ [ProcessingQueue] 停止队列处理');
    this.emit('stopped');
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`⚠️ [ProcessingQueue] 任务不存在: ${taskId}`);
      return false;
    }

    if (task.status === 'running') {
      console.warn(`⚠️ [ProcessingQueue] 无法暂停正在运行的任务: ${taskId}`);
      return false;
    }

    task.status = 'cancelled';
    logger.info(`⏸️ [ProcessingQueue] 暂停任务: ${taskId}`);

    this.emit('taskCancelled', task);
    return true;
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`⚠️ [ProcessingQueue] 任务不存在: ${taskId}`);
      return false;
    }

    if (task.status === 'running') {
      console.warn(`⚠️ [ProcessingQueue] 无法取消正在运行的任务: ${taskId}`);
      return false;
    }

    task.status = 'cancelled';
    logger.info(`❌ [ProcessingQueue] 取消任务: ${taskId}`);

    this.emit('taskCancelled', task);
    return true;
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): QueueTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): QueueTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取待处理任务
   */
  getPendingTasks(): QueueTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.status === 'pending');
  }

  /**
   * 获取正在运行的任务
   */
  getRunningTasks(): QueueTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.status === 'running');
  }

  /**
   * 获取队列统计信息
   */
  getStats(): QueueStats {
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter((task) => task.status === 'completed');

    const totalProcessingTime = completedTasks.reduce((sum, task) => {
      if (task.startTime && task.endTime) {
        return sum + (task.endTime - task.startTime);
      }
      return sum;
    }, 0);

    return {
      totalTasks: allTasks.length,
      pendingTasks: allTasks.filter((task) => task.status === 'pending').length,
      runningTasks: allTasks.filter((task) => task.status === 'running').length,
      completedTasks: allTasks.filter((task) => task.status === 'completed').length,
      failedTasks: allTasks.filter((task) => task.status === 'failed').length,
      cancelledTasks: allTasks.filter((task) => task.status === 'cancelled').length,
      averageProcessingTime:
        completedTasks.length > 0 ? totalProcessingTime / completedTasks.length : 0,
      successRate: allTasks.length > 0 ? completedTasks.length / allTasks.length : 0,
    };
  }

  /**
   * 清理已完成的任务
   */
  cleanup(): void {
    const beforeCount = this.tasks.size;

    for (const [taskId, task] of Array.from(this.tasks.entries())) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(taskId);
      }
    }

    const afterCount = this.tasks.size;
    const cleanedCount = beforeCount - afterCount;

    logger.info(`🧹 [ProcessingQueue] 清理完成，移除 ${cleanedCount} 个任务`);
    this.emit('cleanup', { cleaned: cleanedCount, remaining: afterCount });
  }

  // ============= 私有方法 =============

  /**
   * 处理下一个任务
   */
  private async processNext(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    // 检查并发限制
    if (this.runningTasks.size >= this.options.maxConcurrentTasks) {
      return;
    }

    // 获取下一个待处理任务
    const nextTask = this.getNextTask();
    if (!nextTask) {
      return;
    }

    // 开始处理任务
    await this.processTask(nextTask);
  }

  /**
   * 获取下一个待处理任务（按优先级排序）
   */
  private getNextTask(): QueueTask | null {
    const pendingTasks = this.getPendingTasks();
    if (pendingTasks.length === 0) {
      return null;
    }

    // 按优先级排序
    const priorityOrder: Record<TaskPriority, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };

    pendingTasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // 相同优先级按添加时间排序（FIFO）
      return 0;
    });

    return pendingTasks[0] || null;
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: QueueTask): Promise<void> {
    if (!task.processor) {
      this.failTask(task, '未找到对应的文件处理器');
      return;
    }

    logger.info(`🚀 [ProcessingQueue] 开始处理任务: ${task.id}`);

    // 更新任务状态
    task.status = 'running';
    task.startTime = Date.now();
    this.runningTasks.add(task.id);

    this.emit('taskStarted', task);

    // 设置超时
    const timeoutId = setTimeout(() => {
      if (task.status === 'running') {
        this.failTask(task, '任务处理超时');
      }
    }, this.options.taskTimeout);

    try {
      // 执行处理
      const result = await task.processor.process(task.inputPath, task.outputPath, task.options);

      clearTimeout(timeoutId);

      if (result.success) {
        this.completeTask(task, result);
      } else {
        this.retryOrFailTask(task, result.error || '处理失败');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.retryOrFailTask(task, errorMessage);
    }
  }

  /**
   * 完成任务
   */
  private completeTask(task: QueueTask, result: ProcessingResult): void {
    task.status = 'completed';
    task.endTime = Date.now();
    task.result = result;

    this.runningTasks.delete(task.id);

    logger.info(`✅ [ProcessingQueue] 任务完成: ${task.id}`);

    if (task.onComplete) {
      try {
        task.onComplete(task, result);
      } catch (error) {
        console.error('❌ [ProcessingQueue] 任务完成回调错误:', error);
      }
    }

    this.emit('taskCompleted', task, result);

    // 尝试处理下一个任务
    setTimeout(() => this.processNext(), 0);
  }

  /**
   * 重试或失败任务
   */
  private retryOrFailTask(task: QueueTask, error: string): void {
    this.runningTasks.delete(task.id);

    if (task.retries < task.maxRetries) {
      // 重试任务
      task.retries++;
      task.status = 'pending';
      task.error = undefined;

      logger.info(`🔄 [ProcessingQueue] 重试任务: ${task.id} (${task.retries}/${task.maxRetries})`);

      this.emit('taskRetried', task);

      // 延迟重试
      setTimeout(() => {
        if (this.isStarted) {
          this.processNext();
        }
      }, this.options.retryDelay);
    } else {
      // 任务失败
      this.failTask(task, error);
    }
  }

  /**
   * 失败任务
   */
  private failTask(task: QueueTask, error: string): void {
    task.status = 'failed';
    task.endTime = Date.now();
    task.error = error;

    this.runningTasks.delete(task.id);

    console.error(`❌ [ProcessingQueue] 任务失败: ${task.id} - ${error}`);

    if (task.onError) {
      try {
        task.onError(task, error);
      } catch (callbackError) {
        console.error('❌ [ProcessingQueue] 任务失败回调错误:', callbackError);
      }
    }

    this.emit('taskFailed', task, error);

    // 尝试处理下一个任务
    setTimeout(() => this.processNext(), 0);
  }

  /**
   * 生成唯一任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 批量添加任务
   */
  addBatchTasks(
    tasks: Array<{
      inputPath: string;
      outputPath: string;
      options: ProcessingOptions;
      priority?: TaskPriority;
    }>,
    onBatchProgress?: (completed: number, total: number) => void,
    onBatchComplete?: (results: Map<string, ProcessingResult>) => void
  ): string[] {
    const taskIds: string[] = [];
    const results = new Map<string, ProcessingResult>();
    let completedCount = 0;

    logger.info(`📦 [ProcessingQueue] 批量添加 ${tasks.length} 个任务`);

    for (const taskSpec of tasks) {
      const taskId = this.addTask(taskSpec.inputPath, taskSpec.outputPath, taskSpec.options, {
        priority: taskSpec.priority,
        onComplete: (task, result) => {
          results.set(task.id, result);
          completedCount++;

          if (onBatchProgress) {
            onBatchProgress(completedCount, tasks.length);
          }

          if (completedCount === tasks.length && onBatchComplete) {
            onBatchComplete(results);
          }
        },
        onError: (task, error) => {
          results.set(task.id, { success: false, error });
          completedCount++;

          if (onBatchProgress) {
            onBatchProgress(completedCount, tasks.length);
          }

          if (completedCount === tasks.length && onBatchComplete) {
            onBatchComplete(results);
          }
        },
      });

      taskIds.push(taskId);
    }

    return taskIds;
  }

  /**
   * 获取队列健康状态
   */
  getHealthStatus(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查成功率
    if (stats.successRate < 0.8 && stats.totalTasks > 10) {
      issues.push(`成功率过低: ${(stats.successRate * 100).toFixed(1)}%`);
      recommendations.push('检查文件处理器配置和输入文件质量');
    }

    // 检查待处理任务积压
    if (stats.pendingTasks > 50) {
      issues.push(`待处理任务积压: ${stats.pendingTasks} 个`);
      recommendations.push('考虑增加并发处理数或优化处理性能');
    }

    // 检查平均处理时间
    if (stats.averageProcessingTime > 60000) {
      // 超过1分钟
      issues.push(`平均处理时间过长: ${(stats.averageProcessingTime / 1000).toFixed(1)}秒`);
      recommendations.push('优化文件处理逻辑或减少处理复杂度');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
