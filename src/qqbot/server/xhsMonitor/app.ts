import { NapCatClient } from '../client';
import { XhsQqNotifier } from './notifier';
import { XhsProfileHtmlSource } from './source';
import { FileXhsMonitorStateStore } from './stateStore';
import { XhsMonitorService } from './service';

export interface CreateXhsMonitorAppOptions {
  accountLabel: string;
  profileUrl: string;
  pollIntervalMs: number;
  stateFilePath: string;
  napCat: {
    baseUrl: string;
    accessToken?: string;
    timeoutMs?: number;
  };
  target: { type: 'group'; groupId: number } | { type: 'private'; userId: number };
  skipInitialSnapshot?: boolean;
  postLimit?: number;
}

export function createXhsMonitorApp(options: CreateXhsMonitorAppOptions): XhsMonitorService {
  const client = new NapCatClient(options.napCat);
  const source = new XhsProfileHtmlSource({
    profileUrl: options.profileUrl,
  });
  const stateStore = new FileXhsMonitorStateStore({
    filePath: options.stateFilePath,
  });
  const notifier = new XhsQqNotifier({
    client,
    target: options.target,
  });

  return new XhsMonitorService({
    accountLabel: options.accountLabel,
    source,
    notifier,
    stateStore,
    pollIntervalMs: options.pollIntervalMs,
    skipInitialSnapshot: options.skipInitialSnapshot,
    postLimit: options.postLimit,
  });
}
