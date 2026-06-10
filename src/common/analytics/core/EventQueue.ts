/**
 * 事件队列管理器
 * Event Queue Manager
 */

import type { AnalyticsEvent } from '../types';

export class EventQueue {
  private queue: AnalyticsEvent[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * 添加事件到队列
   */
  enqueue(event: AnalyticsEvent): void {
    // 如果队列已满，移除最老的低优先级事件
    if (this.queue.length >= this.maxSize) {
      this.removeLowestPriorityEvent();
    }

    this.queue.push(event);

    // 按优先级排序（高优先级在前）
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 批量添加事件
   */
  enqueueBatch(events: AnalyticsEvent[]): void {
    events.forEach((event) => this.enqueue(event));
  }

  /**
   * 获取指定数量的事件
   */
  dequeue(count: number): AnalyticsEvent[] {
    return this.queue.splice(0, count);
  }

  /**
   * 获取所有事件
   */
  dequeueAll(): AnalyticsEvent[] {
    const events = [...this.queue];
    this.queue = [];
    return events;
  }

  /**
   * 获取高优先级事件
   */
  getHighPriorityEvents(): AnalyticsEvent[] {
    const highPriorityEvents = this.queue.filter(
      (event) => event.priority >= 2 // HIGH 和 CRITICAL
    );

    // 从队列中移除这些事件
    this.queue = this.queue.filter((event) => event.priority < 2);

    return highPriorityEvents;
  }

  /**
   * 查看队列长度
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * 队列是否为空
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * 队列是否已满
   */
  isFull(): boolean {
    return this.queue.length >= this.maxSize;
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * 移除最低优先级的事件
   */
  private removeLowestPriorityEvent(): void {
    if (this.queue.length === 0) return;

    // 找到优先级最低的事件
    let lowestPriorityIndex = 0;
    let lowestPriority = this.queue[0]?.priority ?? 0;

    for (let i = 1; i < this.queue.length; i++) {
      const currentPriority = this.queue[i]?.priority ?? 0;
      if (currentPriority < lowestPriority) {
        lowestPriority = currentPriority;
        lowestPriorityIndex = i;
      }
    }

    this.queue.splice(lowestPriorityIndex, 1);
  }

  /**
   * 获取队列快照（不移除事件）
   */
  snapshot(): AnalyticsEvent[] {
    return [...this.queue];
  }
}
