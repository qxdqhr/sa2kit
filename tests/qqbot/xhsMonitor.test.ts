import { describe, expect, it, vi } from 'vitest';
import { XhsMonitorService } from '../../src/qqbot/server/xhsMonitor/service';
import { XhsMonitorState, XhsMonitorStateStore, XhsNotifier, XhsPost, XhsSource } from '../../src/qqbot/server/xhsMonitor/types';

class MemoryStateStore implements XhsMonitorStateStore {
  state: XhsMonitorState = {
    seenPostIds: [],
    updatedAt: new Date(0).toISOString(),
  };

  async read(): Promise<XhsMonitorState> {
    return this.state;
  }

  async write(state: XhsMonitorState): Promise<void> {
    this.state = state;
  }
}

class SequenceSource implements XhsSource {
  private readonly rounds: XhsPost[][];
  private cursor = 0;

  constructor(rounds: XhsPost[][]) {
    this.rounds = rounds;
  }

  async fetchLatestPosts(): Promise<XhsPost[]> {
    const result = this.rounds[this.cursor] ?? [];
    this.cursor += 1;
    return result;
  }
}

class FakeNotifier implements XhsNotifier {
  notify = vi.fn(async () => undefined);
}

describe('XhsMonitorService', () => {
  it('skips initial snapshot by default and notifies only new posts later', async () => {
    const source = new SequenceSource([
      [{ id: 'a', title: 'old-a', url: 'https://x/a' }],
      [
        { id: 'a', title: 'old-a', url: 'https://x/a' },
        { id: 'b', title: 'new-b', url: 'https://x/b' },
      ],
    ]);
    const notifier = new FakeNotifier();
    const stateStore = new MemoryStateStore();
    const service = new XhsMonitorService({
      accountLabel: 'tester',
      source,
      notifier,
      stateStore,
      pollIntervalMs: 5000,
    });

    const first = await service.checkOnce();
    const second = await service.checkOnce();

    expect(first.notifiedCount).toBe(0);
    expect(second.notifiedCount).toBe(1);
    expect(notifier.notify).toHaveBeenCalledTimes(1);
    expect(stateStore.state.seenPostIds).toContain('a');
    expect(stateStore.state.seenPostIds).toContain('b');
  });

  it('can notify on the first run when skipInitialSnapshot is false', async () => {
    const source = new SequenceSource([[{ id: 'x', title: 'new-x', url: 'https://x/x' }]]);
    const notifier = new FakeNotifier();
    const stateStore = new MemoryStateStore();
    const service = new XhsMonitorService({
      accountLabel: 'tester',
      source,
      notifier,
      stateStore,
      pollIntervalMs: 5000,
      skipInitialSnapshot: false,
    });

    const result = await service.checkOnce();
    expect(result.notifiedCount).toBe(1);
    expect(notifier.notify).toHaveBeenCalledTimes(1);
  });

  it('does not notify duplicate post ids', async () => {
    const source = new SequenceSource([
      [{ id: 'dup', title: 'post', url: 'https://x/dup' }],
      [{ id: 'dup', title: 'post', url: 'https://x/dup' }],
    ]);
    const notifier = new FakeNotifier();
    const stateStore = new MemoryStateStore();
    const service = new XhsMonitorService({
      accountLabel: 'tester',
      source,
      notifier,
      stateStore,
      pollIntervalMs: 5000,
      skipInitialSnapshot: false,
    });

    await service.checkOnce();
    await service.checkOnce();

    expect(notifier.notify).toHaveBeenCalledTimes(1);
  });
});
