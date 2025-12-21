import React from 'react';
import { MusicTrack } from '../types';

export interface TrackInfoProps {
  track: MusicTrack;
  className?: string;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, className = '' }) => {
  return (
    <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
      <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
        <h2 className="text-lg font-bold text-white tracking-wider truncate max-w-md">
          {track.title}
        </h2>
      </div>
      <p className="text-sm font-medium text-white/60 drop-shadow-md">
        {track.artist || '未知艺术家'}
      </p>
    </div>
  );
};

