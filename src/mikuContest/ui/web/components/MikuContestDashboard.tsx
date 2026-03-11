import React from 'react';
import type { MikuContestStateSnapshot } from '../../../types';

export interface MikuContestDashboardProps {
  snapshot: MikuContestStateSnapshot;
}

const MikuContestDashboard: React.FC<MikuContestDashboardProps> = ({ snapshot }) => {
  return (
    <div>
      <h2>{snapshot.contest.name}</h2>
      <p>{snapshot.contest.theme}</p>
      <p>投稿数：{snapshot.submissions.length}</p>
      <p>公告数：{snapshot.announcements.length}</p>
      <ul>
        {snapshot.leaderboard.map((item) => (
          <li key={item.submissionId}>
            #{item.rank} {item.title} - {item.voteCount}票
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MikuContestDashboard;
