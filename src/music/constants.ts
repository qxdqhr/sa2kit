/**
 * 音乐模块常量定义
 */

export const DEFAULT_MUSIC_SOURCE = 'kugou';

export const MUSIC_SOURCES = ['netease', 'tencent', 'kugou', 'xiami'] as const;

export type MusicSource = (typeof MUSIC_SOURCES)[number];

export const MUSIC_SOURCE_NAMES: Record<MusicSource, string> = {
    netease: '网易云',
    tencent: '腾讯音乐',
    kugou: '酷狗音乐',
    xiami: '虾米音乐',
};

