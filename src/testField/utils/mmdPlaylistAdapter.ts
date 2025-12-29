// @ts-nocheck
import type { MMDPlaylistConfig, MMDPlaylistNode } from 'sa2kit/mmd';

type PlaylistNodeWithFiles = {
  id: string;
  name: string;
  duration?: number;
  loop?: boolean;
  thumbnailUrl?: string;
  modelUrl: string;
  motionUrl?: string;
  cameraUrl?: string;
  audioUrl?: string;
  stageModelUrl?: string;
  additionalMotionUrls?: string[];
};

export type PlaylistWithFiles = {
  id: string;
  name: string;
  nodes: PlaylistNodeWithFiles[];
  loop?: boolean;
  preload?: 'none' | 'next' | 'all';
  preloadStrategy?: 'none' | 'next' | 'all';
  autoPlay?: boolean;
};

const mapNodeToMmd = (node: PlaylistNodeWithFiles): MMDPlaylistNode => ({
  id: node.id,
  name: node.name,
  loop: node.loop,
  duration: node.duration,
  thumbnail: node.thumbnailUrl,
  resources: {
    modelPath: node.modelUrl,
    motionPath: node.motionUrl,
    cameraPath: node.cameraUrl,
    audioPath: node.audioUrl,
    stageModelPath: node.stageModelUrl,
    additionalMotions: node.additionalMotionUrls,
  },
});

export const convertPlaylistToMmdConfig = (playlist: PlaylistWithFiles): MMDPlaylistConfig => ({
  id: playlist.id,
  name: playlist.name,
  nodes: playlist.nodes.map(mapNodeToMmd),
  loop: playlist.loop,
  preload: playlist.preload ?? playlist.preloadStrategy ?? 'none',
  autoPlay: playlist.autoPlay,
});

