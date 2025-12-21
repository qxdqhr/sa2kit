import React from 'react';
import { X, Play, Music } from 'lucide-react';
import { MusicTrack } from '../types';

export interface PlaylistPanelProps {
  tracks: MusicTrack[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (index: number) => void;
  className?: string;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  tracks,
  currentIndex,
  isOpen,
  onClose,
  onSelectTrack,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-80 bg-gray-900/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col pointer-events-auto transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${className}`}
    >
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">播放列表</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {tracks.map((track, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(index)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${isActive ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Music className="w-6 h-6" />
                  </div>
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-blue-500/40 flex items-center justify-center">
                    <div className="flex gap-1 items-end h-4">
                      <div className="w-1 bg-white animate-music-bar-1" />
                      <div className="w-1 bg-white animate-music-bar-2" />
                      <div className="w-1 bg-white animate-music-bar-3" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <h4 className={`text-sm font-bold truncate ${isActive ? 'text-blue-400' : 'text-white/90'}`}>
                  {track.title}
                </h4>
                <p className="text-xs text-white/40 truncate mt-0.5">
                  {track.artist || '未知艺术家'}
                </p>
              </div>

              {!isActive && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-4 h-4 text-white/40 fill-current" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          共 {tracks.length} 首曲目
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes music-bar-1 {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        @keyframes music-bar-2 {
          0%, 100% { height: 8px; }
          50% { height: 16px; }
        }
        @keyframes music-bar-3 {
          0%, 100% { height: 6px; }
          50% { height: 14px; }
        }
        .animate-music-bar-1 { animation: music-bar-1 0.6s infinite; }
        .animate-music-bar-2 { animation: music-bar-2 0.8s infinite; }
        .animate-music-bar-3 { animation: music-bar-3 0.7s infinite; }
      `}} />
    </div>
  );
};

