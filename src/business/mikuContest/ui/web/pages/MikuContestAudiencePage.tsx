import React, { useEffect, useMemo, useState } from 'react';
import { createMikuContestWebClient } from '../../../service/web';
import type { MikuContestApiClient } from '../../../service/api';
import type { MikuContestStateSnapshot, MikuSubmission } from '../../../types';

export interface MikuContestAudiencePageProps {
  client?: Pick<MikuContestApiClient, 'getSnapshot' | 'vote'>;
  voterId: string;
  title?: string;
}

const MikuContestAudiencePage: React.FC<MikuContestAudiencePageProps> = ({
  client,
  voterId,
  title = '观众投票区',
}) => {
  const api = useMemo(() => client || createMikuContestWebClient(), [client]);

  const [snapshot, setSnapshot] = useState<MikuContestStateSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approvedWorks = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.submissions.filter((item) => item.status === 'approved');
  }, [snapshot]);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSnapshot();
      setSnapshot(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const handleVote = async (submission: MikuSubmission) => {
    if (!snapshot) return;
    try {
      await api.vote({
        contestId: snapshot.contest.id,
        submissionId: submission.id,
        voterId,
      });
      await loadSnapshot();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section>
      <h2>{title}</h2>
      <button onClick={() => void loadSnapshot()} disabled={loading}>
        {loading ? '刷新中...' : '刷新数据'}
      </button>
      {error ? <p style={{ color: 'crimson' }}>错误：{error}</p> : null}

      {!snapshot ? null : (
        <>
          <p>
            赛事：{snapshot.contest.name}｜主题：{snapshot.contest.theme}
          </p>
          <p>
            已过审作品：{approvedWorks.length}｜每日上限：{snapshot.contest.votingRules.maxVotesPerDay}
          </p>
          <ul>
            {approvedWorks.map((work) => (
              <li key={work.id}>
                <strong>{work.title}</strong>（{work.authorNickname}）- 当前 {work.voteCount} 票{' '}
                <button onClick={() => void handleVote(work)}>投票</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default MikuContestAudiencePage;
