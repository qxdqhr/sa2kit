import React, { useState } from 'react';
import MikuContestAudiencePage from './MikuContestAudiencePage';
import MikuContestArtistPage from './MikuContestArtistPage';
import MikuContestAdminPage from './MikuContestAdminPage';

type MikuContestView = 'audience' | 'artist' | 'admin';

export interface MikuContestPageProps {
  defaultView?: MikuContestView;
  viewerVoterId?: string;
  artistId?: string;
  artistNickname?: string;
  adminId?: string;
}

const MikuContestPage: React.FC<MikuContestPageProps> = ({
  defaultView = 'audience',
  viewerVoterId = 'viewer-demo',
  artistId = 'artist-demo',
  artistNickname = 'Demo 画师',
  adminId = 'admin-demo',
}) => {
  const [view, setView] = useState<MikuContestView>(defaultView);

  return (
    <div>
      <h1>Miku Contest</h1>
      <div>
        <button onClick={() => setView('audience')}>观众端</button>
        <button onClick={() => setView('artist')}>画师端</button>
        <button onClick={() => setView('admin')}>管理员端</button>
      </div>

      {view === 'audience' ? <MikuContestAudiencePage voterId={viewerVoterId} /> : null}
      {view === 'artist' ? <MikuContestArtistPage authorId={artistId} authorNickname={artistNickname} /> : null}
      {view === 'admin' ? <MikuContestAdminPage adminId={adminId} /> : null}
    </div>
  );
};

export default MikuContestPage;
