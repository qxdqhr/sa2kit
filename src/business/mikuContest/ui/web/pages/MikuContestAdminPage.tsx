import React, { useEffect, useMemo, useState } from 'react';
import { createMikuContestWebClient } from '../../../service/web';
import type { MikuContestApiClient } from '../../../service/api';
import type { MikuContestStateSnapshot, MikuSubmission } from '../../../types';

export interface MikuContestAdminPageProps {
  client?: Pick<
    MikuContestApiClient,
    | 'getSnapshot'
    | 'listSubmissions'
    | 'reviewSubmission'
    | 'setVoterRestriction'
    | 'resetVotes'
    | 'exportSubmissions'
    | 'updateContestConfig'
  >;
  adminId: string;
  title?: string;
}

const MikuContestAdminPage: React.FC<MikuContestAdminPageProps> = ({
  client,
  adminId,
  title = '管理员面板',
}) => {
  const api = useMemo(() => client || createMikuContestWebClient(), [client]);

  const [snapshot, setSnapshot] = useState<MikuContestStateSnapshot | null>(null);
  const [submissions, setSubmissions] = useState<MikuSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voterId, setVoterId] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contest, list] = await Promise.all([api.getSnapshot(), api.listSubmissions()]);
      setSnapshot(contest);
      setSubmissions(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const review = async (item: MikuSubmission, action: 'approve' | 'reject') => {
    try {
      await api.reviewSubmission({
        submissionId: item.id,
        reviewerId: adminId,
        action,
        rejectReason: action === 'reject' ? '管理员驳回' : undefined,
      });
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const toggleVoting = async (enabled: boolean) => {
    if (!snapshot) return;
    try {
      await api.updateContestConfig({
        toggles: {
          ...snapshot.contest.toggles,
          votingEnabled: enabled,
        },
      });
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const setRestriction = async (banned: boolean) => {
    if (!snapshot || !voterId.trim()) return;
    try {
      await api.setVoterRestriction({
        voterId: voterId.trim(),
        banned,
        reason: banned ? '管理员手动封禁' : '管理员解除封禁',
        operatorId: adminId,
      });
      setVoterId('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const resetVotesByVoter = async () => {
    if (!voterId.trim()) return;
    try {
      await api.resetVotes({ voterId: voterId.trim() });
      setVoterId('');
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const exportExcel = async () => {
    try {
      const data = await api.exportSubmissions();
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'miku-submissions.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section>
      <h2>{title}</h2>
      <button onClick={() => void loadData()} disabled={loading}>
        {loading ? '刷新中...' : '刷新数据'}
      </button>
      {error ? <p style={{ color: 'crimson' }}>错误：{error}</p> : null}

      <div>
        <h3>赛事开关</h3>
        <button onClick={() => void toggleVoting(true)} disabled={!snapshot}>
          开启投票
        </button>
        <button onClick={() => void toggleVoting(false)} disabled={!snapshot}>
          关闭投票
        </button>
      </div>

      <div>
        <h3>投稿审核（{submissions.length}）</h3>
        <ul>
          {submissions.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>｜作者：{item.authorNickname}｜状态：{item.status}｜票数：{item.voteCount}
              {item.status === 'pending' ? (
                <>
                  {' '}
                  <button onClick={() => void review(item, 'approve')}>通过</button>
                  <button onClick={() => void review(item, 'reject')}>驳回</button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>投票风控</h3>
        <input value={voterId} onChange={(e) => setVoterId(e.target.value)} placeholder="voterId" />
        <button onClick={() => void setRestriction(true)} disabled={!snapshot}>
          封禁投票
        </button>
        <button onClick={() => void setRestriction(false)} disabled={!snapshot}>
          解除封禁
        </button>
        <button onClick={() => void resetVotesByVoter()}>清零该用户票数</button>
      </div>

      <div>
        <h3>导出</h3>
        <button onClick={() => void exportExcel()}>导出投稿 Excel</button>
      </div>
    </section>
  );
};

export default MikuContestAdminPage;
