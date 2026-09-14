import { createHash } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import type { SkillSyncTask } from '../domain/types';
import { skillManagerSyncStates, skillManagerSyncTasks } from './schema';
import { readMeta, type SkillManagerFileStore } from './fileStore';

export type SkillManagerDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
};

export type TaskItem = {
  id: string;
  skillId: string;
  status: 'success' | 'failed';
  reason?: string;
};

export type SyncTask = SkillSyncTask;

type SkillSyncState = {
  baseHash: string;
  remoteHash: string;
  updatedAt: string;
};

type SyncStateMap = Record<string, SkillSyncState>;

export function createSkillManagerSyncService(deps: {
  db: SkillManagerDrizzleDb;
  fileStore: SkillManagerFileStore;
}) {
  const { db, fileStore } = deps;

  async function readTasks(): Promise<SyncTask[]> {
    const rows = await db
      .select()
      .from(skillManagerSyncTasks)
      .orderBy(desc(skillManagerSyncTasks.createdAt))
      .limit(200);
    return rows.map((row: any) => ({
      taskId: row.taskId,
      mode: row.mode as SyncTask['mode'],
      strategy: row.strategy as SyncTask['strategy'],
      status: row.status as SyncTask['status'],
      total: row.total,
      successCount: row.successCount,
      failedCount: row.failedCount,
      createdAt: row.createdAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString(),
      items: (Array.isArray(row.items) ? row.items : []) as TaskItem[],
      metrics: (row.metrics || undefined) as SyncTask['metrics'],
      logs: (row.logs || []) as SyncTask['logs'],
    }));
  }

  async function readSyncStateMap(): Promise<SyncStateMap> {
    const rows = await db.select().from(skillManagerSyncStates);
    const result: SyncStateMap = {};
    for (const row of rows as any[]) {
      result[row.skillId] = {
        baseHash: row.baseHash,
        remoteHash: row.remoteHash,
        updatedAt: row.updatedAt.toISOString(),
      };
    }
    return result;
  }

  async function writeSyncStateMap(state: SyncStateMap): Promise<void> {
    const entries = Object.entries(state);
    if (!entries.length) return;
    for (const [skillId, value] of entries) {
      await db
        .insert(skillManagerSyncStates)
        .values({
          skillId,
          baseHash: value.baseHash || '',
          remoteHash: value.remoteHash || '',
          updatedAt: new Date(value.updatedAt || new Date().toISOString()),
        })
        .onConflictDoUpdate({
          target: skillManagerSyncStates.skillId,
          set: {
            baseHash: value.baseHash || '',
            remoteHash: value.remoteHash || '',
            updatedAt: new Date(value.updatedAt || new Date().toISOString()),
          },
        });
    }
  }

  async function upsertTask(task: SyncTask): Promise<void> {
    await db
      .insert(skillManagerSyncTasks)
      .values({
        taskId: task.taskId,
        mode: task.mode,
        strategy: task.strategy,
        status: task.status,
        total: task.total,
        successCount: task.successCount,
        failedCount: task.failedCount,
        createdAt: new Date(task.createdAt),
        finishedAt: task.finishedAt ? new Date(task.finishedAt) : null,
        items: task.items,
        metrics: task.metrics || null,
        logs: task.logs || [],
      })
      .onConflictDoUpdate({
        target: skillManagerSyncTasks.taskId,
        set: {
          status: task.status,
          total: task.total,
          successCount: task.successCount,
          failedCount: task.failedCount,
          finishedAt: task.finishedAt ? new Date(task.finishedAt) : null,
          items: task.items,
          metrics: task.metrics || null,
          logs: task.logs || [],
        },
      });
  }

  async function getSkillMarkdownHash(skillId: string): Promise<string | null> {
    try {
      const file = await fileStore.getSkillFileByRelativePath(skillId, 'SKILL.md');
      if (!file) return null;
      const content = await fileStore.readTextFileById(file.id);
      return createHash('sha256').update(content).digest('hex');
    } catch {
      return null;
    }
  }

  async function getCurrentSkillMarkdownHash(skillId: string): Promise<string | null> {
    return getSkillMarkdownHash(skillId);
  }

  async function saveSkillMarkdownBySyncDecision(skillId: string, content: string): Promise<string | null> {
    const existing = await fileStore.getSkillFileByRelativePath(skillId, 'SKILL.md');
    const prevMeta = existing
      ? readMeta(existing)
      : {
          source: 'manual_upload' as const,
          status: 'draft' as const,
        };
    await fileStore.uploadSkillFile({
      skillId,
      relativePath: 'SKILL.md',
      content,
      source: prevMeta.source,
      status: prevMeta.status,
      uploaderId: 'sync-task',
    });
    return createHash('sha256').update(content).digest('hex');
  }

  async function getSkillSyncState(skillId: string): Promise<SkillSyncState | null> {
    const rows = await db.select().from(skillManagerSyncStates).where(eq(skillManagerSyncStates.skillId, skillId)).limit(1);
    const row = (rows as any[])[0];
    if (!row) return null;
    return {
      baseHash: row.baseHash || '',
      remoteHash: row.remoteHash || '',
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async function setSkillSyncState(skillId: string, state: SkillSyncState): Promise<void> {
    await db
      .insert(skillManagerSyncStates)
      .values({
        skillId,
        baseHash: state.baseHash || '',
        remoteHash: state.remoteHash || '',
        updatedAt: new Date(state.updatedAt || new Date().toISOString()),
      })
      .onConflictDoUpdate({
        target: skillManagerSyncStates.skillId,
        set: {
          baseHash: state.baseHash || '',
          remoteHash: state.remoteHash || '',
          updatedAt: new Date(state.updatedAt || new Date().toISOString()),
        },
      });
  }

  function evaluateByStrategy(input: {
    strategy: 'ff-only' | 'manual';
    localHash: string;
    baseHash: string;
    remoteHash: string;
  }): { ok: boolean; reason?: string; nextState?: SkillSyncState } {
    const { strategy, localHash, baseHash, remoteHash } = input;
    const now = new Date().toISOString();

    if (!baseHash && !remoteHash) {
      return {
        ok: true,
        nextState: { baseHash: localHash, remoteHash: localHash, updatedAt: now },
      };
    }

    if (localHash === remoteHash) {
      return {
        ok: true,
        reason: 'No-op: local 与 remote 一致',
        nextState: { baseHash, remoteHash, updatedAt: now },
      };
    }

    if (baseHash === remoteHash && localHash !== remoteHash) {
      return {
        ok: true,
        reason: 'Fast-forward: local 领先',
        nextState: { baseHash: localHash, remoteHash: localHash, updatedAt: now },
      };
    }

    if (baseHash === localHash && remoteHash !== localHash) {
      return {
        ok: false,
        reason:
          strategy === 'manual'
            ? 'Behind: remote 领先，需手工决策（选择本地/远端/合并）'
            : 'Behind: remote 领先，ff-only 策略拒绝同步',
      };
    }

    return {
      ok: false,
      reason:
        strategy === 'manual'
          ? 'Diverged: local 与 remote 分叉，需手工决策（选择本地/远端/合并）'
          : 'Diverged: local 与 remote 分叉，ff-only 策略拒绝同步',
    };
  }

  async function executeSyncTask(input: {
    skillIds: string[];
    strategy: 'ff-only' | 'manual';
    prevState?: SyncStateMap;
  }): Promise<{ items: TaskItem[]; nextState: SyncStateMap }> {
    const state = input.prevState ? { ...input.prevState } : await readSyncStateMap();
    const items: TaskItem[] = [];

    for (const skillId of input.skillIds) {
      const localHash = await getSkillMarkdownHash(skillId);
      if (!localHash) {
        items.push({
          id: `${skillId}-${Date.now()}`,
          skillId,
          status: 'failed',
          reason: 'SKILL.md 不存在或不可读取',
        });
        continue;
      }

      const current = state[skillId] || { baseHash: '', remoteHash: '', updatedAt: '' };
      const evaluated = evaluateByStrategy({
        strategy: input.strategy,
        localHash,
        baseHash: current.baseHash,
        remoteHash: current.remoteHash,
      });

      if (evaluated.ok) {
        if (evaluated.nextState) {
          state[skillId] = evaluated.nextState;
        }
        items.push({
          id: `${skillId}-${Date.now()}`,
          skillId,
          status: 'success',
          reason: evaluated.reason,
        });
      } else {
        items.push({
          id: `${skillId}-${Date.now()}`,
          skillId,
          status: 'failed',
          reason: evaluated.reason || '同步失败',
        });
      }
    }

    return { items, nextState: state };
  }

  function buildTaskFromItems(input: {
    taskId: string;
    strategy: 'ff-only' | 'manual';
    items: TaskItem[];
    createdAt?: string;
    logs?: SyncTask['logs'];
  }): SyncTask {
    const successCount = input.items.filter((x) => x.status === 'success').length;
    const failedCount = input.items.length - successCount;
    const status: SyncTask['status'] = failedCount === 0 ? 'success' : successCount > 0 ? 'partial' : 'failed';
    const now = new Date().toISOString();
    const createdAt = input.createdAt || now;
    const durationMs = Math.max(0, new Date(now).getTime() - new Date(createdAt).getTime());
    const total = input.items.length;
    const successRate = total ? Number((successCount / total).toFixed(4)) : 0;
    const conflictRate = total ? Number((failedCount / total).toFixed(4)) : 0;
    return {
      taskId: input.taskId,
      mode: 'local-to-web',
      strategy: input.strategy,
      status,
      total,
      successCount,
      failedCount,
      createdAt,
      finishedAt: now,
      items: input.items,
      metrics: {
        durationMs,
        successRate,
        conflictRate,
      },
      logs: input.logs || [],
    };
  }

  return {
    readTasks,
    writeSyncStateMap,
    upsertTask,
    getCurrentSkillMarkdownHash,
    saveSkillMarkdownBySyncDecision,
    getSkillSyncState,
    setSkillSyncState,
    executeSyncTask,
    buildTaskFromItems,
    readSyncStateMap,
  };
}

export type SkillManagerSyncService = ReturnType<typeof createSkillManagerSyncService>;
