import React, { useMemo, useState } from 'react';
import { useMikuContest } from '../../../logic';
import type { MikuWorkType } from '../../../types';

const MikuContestMiniappPage: React.FC = () => {
  const { service, snapshot, refresh } = useMikuContest();

  const [tab, setTab] = useState<'vote' | 'submit'>('vote');
  const [voterId, setVoterId] = useState('miniapp-voter');
  const [authorId, setAuthorId] = useState('miniapp-author');
  const [authorNickname, setAuthorNickname] = useState('小程序画师');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<MikuWorkType>('visual');
  const [error, setError] = useState<string | null>(null);

  const approvedWorks = useMemo(() => {
    return snapshot.submissions.filter((item) => item.status === 'approved');
  }, [snapshot.submissions]);

  const vote = (submissionId: string) => {
    try {
      service.vote({
        contestId: snapshot.contest.id,
        submissionId,
        voterId,
      });
      refresh();
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submit = () => {
    try {
      service.createSubmission(
        {
          contestId: snapshot.contest.id,
          authorId,
          authorNickname,
          title,
          description: desc,
          type,
          content: {},
        },
        'miniapp',
      );
      setTitle('');
      setDesc('');
      refresh();
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      <h3>{snapshot.contest.name}</h3>
      <p>小程序端示例页面</p>
      <button onClick={() => setTab('vote')}>观众投票</button>
      <button onClick={() => setTab('submit')}>画师投稿</button>

      {error ? <p style={{ color: 'crimson' }}>错误：{error}</p> : null}

      {tab === 'vote' ? (
        <div>
          <input value={voterId} onChange={(e) => setVoterId(e.target.value)} placeholder="voterId" />
          <ul>
            {approvedWorks.map((item) => (
              <li key={item.id}>
                {item.title}（{item.voteCount}票）
                <button onClick={() => vote(item.id)}>投票</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'submit' ? (
        <div>
          <input value={authorId} onChange={(e) => setAuthorId(e.target.value)} placeholder="authorId" />
          <input value={authorNickname} onChange={(e) => setAuthorNickname(e.target.value)} placeholder="作者昵称" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="作品标题" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="作品简介" />
          <select value={type} onChange={(e) => setType(e.target.value as MikuWorkType)}>
            <option value="visual">visual</option>
            <option value="video">video</option>
            <option value="text">text</option>
            <option value="audio">audio</option>
          </select>
          <button onClick={submit}>提交</button>
        </div>
      ) : null}
    </div>
  );
};

export default MikuContestMiniappPage;
