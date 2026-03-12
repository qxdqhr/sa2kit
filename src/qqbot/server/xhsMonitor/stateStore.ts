import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { XhsMonitorState, XhsMonitorStateStore } from './types';

const DEFAULT_STATE: XhsMonitorState = {
  seenPostIds: [],
  updatedAt: new Date(0).toISOString(),
};

export interface FileXhsMonitorStateStoreOptions {
  filePath: string;
  maxSeenPostIds?: number;
}

export class FileXhsMonitorStateStore implements XhsMonitorStateStore {
  private readonly filePath: string;
  private readonly maxSeenPostIds: number;

  constructor(options: FileXhsMonitorStateStoreOptions) {
    this.filePath = options.filePath;
    this.maxSeenPostIds = Math.max(10, options.maxSeenPostIds ?? 500);
  }

  async read(): Promise<XhsMonitorState> {
    try {
      const text = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(text) as Partial<XhsMonitorState>;
      const seenPostIds = Array.isArray(parsed.seenPostIds)
        ? parsed.seenPostIds.filter((item): item is string => typeof item === 'string')
        : [];
      const updatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString();
      return {
        seenPostIds: seenPostIds.slice(0, this.maxSeenPostIds),
        updatedAt,
      };
    } catch {
      return DEFAULT_STATE;
    }
  }

  async write(state: XhsMonitorState): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const compactState: XhsMonitorState = {
      seenPostIds: state.seenPostIds.slice(0, this.maxSeenPostIds),
      updatedAt: state.updatedAt,
    };
    await writeFile(this.filePath, JSON.stringify(compactState, null, 2), 'utf8');
  }
}
