import React from 'react';
import type { MikuContestStateSnapshot } from '../../../types';

export interface MikuContestMiniappHomeProps {
  snapshot: MikuContestStateSnapshot;
}

const MikuContestMiniappHome: React.FC<MikuContestMiniappHomeProps> = ({ snapshot }) => {
  return (
    <div>
      <h3>{snapshot.contest.name}</h3>
      <p>投稿：{snapshot.submissions.length} | 公告：{snapshot.announcements.length}</p>
      <ol>
        {snapshot.leaderboard.slice(0, 3).map((item) => (
          <li key={item.submissionId}>
            {item.title}（{item.voteCount}票）
          </li>
        ))}
      </ol>
    </div>
  );
};

export default MikuContestMiniappHome;
