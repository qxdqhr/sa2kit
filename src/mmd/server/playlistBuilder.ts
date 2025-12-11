import type { MMDPlaylistConfig, MMDPlaylistNode } from '../types';

export interface PlaylistModelSource {
  id: string | number;
  name: string;
  filePath: string;
  thumbnailPath?: string | null;
}

export interface PlaylistMotionSource {
  id: string | number;
  name?: string;
  filePath: string;
}

export interface BuildMmdPlaylistOptions {
  playlistId: string;
  playlistName?: string;
  models: PlaylistModelSource[];
  motions?: PlaylistMotionSource[];
  limit?: number;
  loop?: boolean;
  preload?: 'none' | 'next' | 'all';
  autoPlay?: boolean;
  nodeDuration?: number;
  normalizeUrl?: (pathOrUrl: string) => string;
}

const defaultNormalizer = (value: string) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return value.startsWith('/') ? value : `/${value}`;
};

/**
 * 根据数据库中的模型/动作记录快速构建 MMDPlaylistConfig
 */
export function buildMmdPlaylistFromSources(options: BuildMmdPlaylistOptions): MMDPlaylistConfig {
  if (!options.models.length) {
    throw new Error('构建 MMD 播放列表失败：models 为空');
  }

  const limit = Math.max(1, Math.min(options.limit ?? options.models.length, options.models.length));
  const normalizeUrl = options.normalizeUrl ?? defaultNormalizer;
  const motions = options.motions ?? [];
  const hasMotions = motions.length > 0;
  const duration = options.nodeDuration ?? 30;

  const nodes: MMDPlaylistNode[] = options.models.slice(0, limit).map((model, index) => {
    const motion = hasMotions ? motions[index % motions.length] : undefined;
    return {
      id: String(model.id ?? index),
      name: model.name,
      loop: options.loop ?? true,
      duration,
      thumbnail: model.thumbnailPath ? normalizeUrl(model.thumbnailPath) : undefined,
      resources: {
        modelPath: normalizeUrl(model.filePath),
        motionPath: motion ? normalizeUrl(motion.filePath) : undefined,
        cameraPath: undefined,
        audioPath: undefined,
        stageModelPath: undefined,
        additionalMotions: undefined,
      },
    };
  });

  return {
    id: options.playlistId,
    name: options.playlistName ?? `MMD 播放列表 - ${options.playlistId}`,
    nodes,
    loop: options.loop ?? true,
    preload: options.preload ?? 'next',
    autoPlay: options.autoPlay ?? true,
  };
}

