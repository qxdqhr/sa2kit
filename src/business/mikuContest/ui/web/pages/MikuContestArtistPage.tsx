import React, { useEffect, useMemo, useState } from 'react';
import { createMikuContestWebClient } from '../../../service/web';
import type { MikuContestApiClient } from '../../../service/api';
import type { CreateMikuSubmissionInput, MikuContestStateSnapshot, MikuSubmission, MikuWorkType } from '../../../types';

export interface MikuContestArtistPageProps {
  client?: Pick<MikuContestApiClient, 'getSnapshot' | 'createSubmission' | 'listSubmissions'>;
  authorId: string;
  authorNickname: string;
  title?: string;
}

const workTypes: MikuWorkType[] = ['visual', 'video', 'text', 'audio'];

const MikuContestArtistPage: React.FC<MikuContestArtistPageProps> = ({
  client,
  authorId,
  authorNickname,
  title = '画师投稿区',
}) => {
  const api = useMemo(() => client || createMikuContestWebClient(), [client]);

  const [snapshot, setSnapshot] = useState<MikuContestStateSnapshot | null>(null);
  const [mySubmissions, setMySubmissions] = useState<MikuSubmission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [workType, setWorkType] = useState<MikuWorkType>('visual');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contest, mine] = await Promise.all([
        api.getSnapshot(),
        api.listSubmissions({ authorId }),
      ]);
      setSnapshot(contest);
      setMySubmissions(mine);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const submitWork = async () => {
    if (!snapshot) return;
    const payload: CreateMikuSubmissionInput = {
      contestId: snapshot.contest.id,
      authorId,
      authorNickname,
      title: titleInput,
      description: descInput,
      type: workType,
      tags: ['web'],
      content: {
        coverImage,
        images: coverImage ? [coverImage] : undefined,
      },
    };

    setSubmitting(true);
    setError(null);
    try {
      await api.createSubmission(payload, 'web');
      setTitleInput('');
      setDescInput('');
      setCoverImage('');
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
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
        <h3>新建投稿</h3>
        <input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="作品标题" />
        <br />
        <textarea value={descInput} onChange={(e) => setDescInput(e.target.value)} placeholder="作品简介" />
        <br />
        <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="封面 URL" />
        <br />
        <select value={workType} onChange={(e) => setWorkType(e.target.value as MikuWorkType)}>
          {workTypes.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
        <button onClick={() => void submitWork()} disabled={submitting || !snapshot}>
          {submitting ? '提交中...' : '提交稿件'}
        </button>
      </div>

      <div>
        <h3>我的投稿（{mySubmissions.length}）</h3>
        <ul>
          {mySubmissions.map((item) => (
            <li key={item.id}>
              {item.title}｜状态：{item.status}｜票数：{item.voteCount}
              {item.rejectReason ? `｜驳回：${item.rejectReason}` : ''}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default MikuContestArtistPage;
