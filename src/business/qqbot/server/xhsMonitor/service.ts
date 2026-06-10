import { XhsMonitorStateStore, XhsNotifier, XhsPost, XhsSource } from './types';

export interface XhsMonitorServiceOptions {
  accountLabel: string;
  source: XhsSource;
  notifier: XhsNotifier;
  stateStore: XhsMonitorStateStore;
  pollIntervalMs: number;
  skipInitialSnapshot?: boolean;
  postLimit?: number;
  now?: () => Date;
}

function sortPostsByPublishedAt(posts: XhsPost[]): XhsPost[] {
  return [...posts].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : Number.NaN;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : Number.NaN;
    if (Number.isNaN(ta) || Number.isNaN(tb)) {
      return 0;
    }
    return ta - tb;
  });
}

export class XhsMonitorService {
  private readonly accountLabel: string;
  private readonly source: XhsSource;
  private readonly notifier: XhsNotifier;
  private readonly stateStore: XhsMonitorStateStore;
  private readonly pollIntervalMs: number;
  private readonly skipInitialSnapshot: boolean;
  private readonly postLimit: number;
  private readonly now: () => Date;
  private timer: NodeJS.Timeout | null = null;
  private initialized = false;
  private running = false;

  constructor(options: XhsMonitorServiceOptions) {
    this.accountLabel = options.accountLabel;
    this.source = options.source;
    this.notifier = options.notifier;
    this.stateStore = options.stateStore;
    this.pollIntervalMs = Math.max(5000, options.pollIntervalMs);
    this.skipInitialSnapshot = options.skipInitialSnapshot ?? true;
    this.postLimit = options.postLimit ?? 20;
    this.now = options.now ?? (() => new Date());
  }

  async checkOnce(): Promise<{ notifiedCount: number; fetchedCount: number }> {
    if (this.running) {
      return { notifiedCount: 0, fetchedCount: 0 };
    }

    this.running = true;
    try {
      const state = await this.stateStore.read();
      const seen = new Set(state.seenPostIds);
      const posts = await this.source.fetchLatestPosts(this.postLimit);
      const orderedPosts = sortPostsByPublishedAt(posts);
      const newlyDetected = orderedPosts.filter((post) => !seen.has(post.id));

      if (!this.initialized && this.skipInitialSnapshot) {
        for (const post of orderedPosts) {
          seen.add(post.id);
        }
        await this.persistSeenIds(seen);
        this.initialized = true;
        return { notifiedCount: 0, fetchedCount: posts.length };
      }

      let notifiedCount = 0;
      for (const post of newlyDetected) {
        await this.notifier.notify({
          accountLabel: this.accountLabel,
          post,
          detectedAt: this.now().toISOString(),
        });
        notifiedCount += 1;
        seen.add(post.id);
      }

      if (newlyDetected.length > 0 || !this.initialized) {
        for (const post of orderedPosts) {
          seen.add(post.id);
        }
        await this.persistSeenIds(seen);
      }

      this.initialized = true;
      return { notifiedCount, fetchedCount: posts.length };
    } finally {
      this.running = false;
    }
  }

  start(immediate = true): void {
    if (this.timer) {
      return;
    }

    const run = async () => {
      try {
        await this.checkOnce();
      } catch (error) {
        console.error('[XhsMonitorService] check failed', error);
      }
    };

    if (immediate) {
      void run();
    }

    this.timer = setInterval(() => {
      void run();
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async persistSeenIds(seenIds: Set<string>): Promise<void> {
    await this.stateStore.write({
      seenPostIds: Array.from(seenIds).slice(-500),
      updatedAt: this.now().toISOString(),
    });
  }
}
