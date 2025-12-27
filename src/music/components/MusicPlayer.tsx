import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Search,
    Volume2,
    VolumeX,
    Music as MusicIcon,
    Loader2,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import { useMusic } from '../hooks/useMusic';
import { MusicTrack } from '../types';
import { MUSIC_SOURCES, DEFAULT_MUSIC_SOURCE, MusicSource, MUSIC_SOURCE_NAMES } from '../constants';

export const MusicPlayer: React.FC = () => {
    const { search, searchResult: searchData, isSearching, getSongUrl } = useMusic();
    const [keyword, setKeyword] = useState('');
    const [selectedSource, setSelectedSource] = useState<MusicSource>(DEFAULT_MUSIC_SOURCE);
    const [currentPage, setCurrentPage] = useState(0);
    const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
    const pageSize = 20;

    const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (keyword.trim()) {
            setCurrentPage(0);
            search({ keyword, source: selectedSource, offset: 0, limit: pageSize });
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        search({ keyword, source: selectedSource, offset: newPage, limit: pageSize });
    };

    const playTrack = async (track: MusicTrack) => {
        setIsLoadingUrl(true);
        const url = await getSongUrl(track.id, track.source);
        setIsLoadingUrl(false);

        if (url) {
            const fullTrack = { ...track, url };
            setCurrentTrack(fullTrack);
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
            }
        } else {
            alert('无法获取播放链接');
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !currentTrack) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setProgress(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '00:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full bg-black text-white font-sans">
            {/* 搜索栏 */}
            <div className="p-6 border-b border-gray-800 max-w-400 mx-auto">
                <form onSubmit={handleSearch} className="flex flex-row items-center gap-4 max-w-screen mx-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="搜索歌曲、歌手..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value as MusicSource)}
                        className="bg-gray-900  p-2 border border-gray-700 text-gray-300 text-sm rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-gray-800"
                    >
                        {MUSIC_SOURCES.map((src) => (
                            <option key={src} value={src}>
                                {MUSIC_SOURCE_NAMES[src]}
                            </option>
                        ))}
                    </select>
                    <div className=" flex items-center justify-center max-w-lg bg-gray-900 rounded-full p-2 border border-gray-700">
                        <button
                           
                            onClick={() => setLayoutMode('list')}
                            className={`p-1.5 rounded-full transition-all ${layoutMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            title="列表视图"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            
                            onClick={() => setLayoutMode('grid')}
                            className={`p-1.5 rounded-full transition-all ${layoutMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            title="网格视图"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-full px-8 py-2 font-medium transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0"
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '搜索'}
                    </button>
                </form>
            </div>

            {/* 歌曲列表和详情区域 */}
            <div className="flex-1 flex overflow-hidden">
                {/* 左侧列表 */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800">
                    {Array.isArray(searchData?.tracks) && searchData.tracks.length > 0 ? (
                        <div className={layoutMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            : "flex flex-col gap-2 max-w-5xl mx-auto"
                        }>
                            {searchData.tracks.map((track) => (
                                <div
                                    key={track.id}
                                    onClick={() => playTrack(track)}
                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${currentTrack?.id === track.id
                                            ? 'bg-blue-600/20 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                            : 'bg-gray-900/50 border border-gray-800 hover:bg-gray-800/80 hover:border-gray-700'
                                        } ${layoutMode === 'list' ? 'hover:pl-5' : ''}`}
                                >
                                    <div className={`relative rounded-lg overflow-hidden shrink-0 bg-gray-800 transition-all ${layoutMode === 'grid' ? 'w-14 h-14' : 'w-12 h-12'
                                        }`}>
                                        {track.pic ? (
                                            <img src={track.pic} alt={track.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <MusicIcon className="w-6 h-6 text-gray-600" />
                                            </div>
                                        )}
                                        {currentTrack?.id === track.id && isPlaying && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="flex gap-0.5 items-end h-4">
                                                    <div className="w-0.5 bg-blue-400 animate-music-bar" style={{ height: '60%' }} />
                                                    <div className="w-0.5 bg-blue-400 animate-music-bar" style={{ height: '100%', animationDelay: '0.2s' }} />
                                                    <div className="w-0.5 bg-blue-400 animate-music-bar" style={{ height: '40%', animationDelay: '0.4s' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-semibold truncate ${layoutMode === 'grid' ? 'text-sm' : 'text-base'}`}>{track.name}</h3>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-800 text-gray-400 shrink-0">
                                                {MUSIC_SOURCE_NAMES[track.source].replace('音乐', '')}
                                            </span>
                                            {track.isVip && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shrink-0 font-bold">
                                                    VIP
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                                    </div>
                                    {layoutMode === 'list' && (
                                        <div className="hidden sm:block text-xs text-gray-500 px-4 truncate max-w-[200px]">
                                            {track.album}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                                <MusicIcon className="w-8 h-8" />
                            </div>
                            <p>{isSearching ? '正在搜索...' : '搜索你喜欢的音乐'}</p>
                        </div>
                    )}

                    {/* 分页控制 */}
                    {searchData?.tracks && searchData.tracks.length > 0 && (
                        <div className="mt-8 flex items-center justify-center gap-4 pb-8">
                            <button
                                onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0 || isSearching}
                                className="p-2 rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-blue-500 bg-blue-500/10 px-3 py-1 rounded-md">
                                    第 {currentPage + 1} 页
                                </span>
                                {searchData.total > 0 && (
                                    <span className="text-xs text-gray-500">
                                        共 {Math.ceil(searchData.total / pageSize)} 页
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={isSearching || (searchData.total > 0 && (currentPage + 1) * pageSize >= searchData.total)}
                                className="p-2 rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 底部播放控制栏 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border-t border-gray-800 p-4 pb-8 md:pb-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
                    {/* 歌曲信息 */}
                    <div className="flex items-center gap-4 w-full md:w-1/4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                            {currentTrack?.pic ? (
                                <img src={currentTrack.pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <MusicIcon className="w-5 h-5 text-gray-600" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{currentTrack?.name || '未在播放'}</h4>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{currentTrack?.artist || '-'}</p>
                        </div>
                    </div>

                    {/* 播放控制 */}
                    <div className="flex flex-col items-center gap-2 flex-1 w-full">
                        <div className="flex items-center gap-6">
                            <button className="text-gray-400 hover:text-white transition-colors">
                                <SkipBack className="w-5 h-5 fill-current" />
                            </button>
                            <button
                                onClick={togglePlay}
                                disabled={!currentTrack || isLoadingUrl}
                                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                {isLoadingUrl ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="w-5 h-5 fill-current" />
                                ) : (
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                )}
                            </button>
                            <button className="text-gray-400 hover:text-white transition-colors">
                                <SkipForward className="w-5 h-5 fill-current" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full max-w-2xl text-xs text-gray-400">
                            <span>{formatTime(progress)}</span>
                            <div className="flex-1 relative h-1 group cursor-pointer">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    step="0.1"
                                    value={progress}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                />
                                <div className="absolute inset-0 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 group-hover:bg-blue-400 transition-colors"
                                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* 音量控制 */}
                    <div className="hidden md:flex items-center gap-3 w-1/4 justify-end">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <div className="w-24 relative h-1 group">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setVolume(val);
                                    setIsMuted(false);
                                    if (audioRef.current) audioRef.current.volume = val;
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                            />
                            <div className="absolute inset-0 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-300 group-hover:bg-blue-400 transition-colors"
                                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

      <audio
        ref={audioRef}
        {...({ referrerPolicy: 'no-referrer' } as any)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />
        </div>
    );
};
