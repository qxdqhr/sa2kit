export interface ProducerPack {
  id: string;
  name: string;
  passiveDescription: string;
  themeColor?: string;
}

export interface SongPack {
  id: string;
  name: string;
  bpm?: number;
  difficultyHint?: string;
}

export interface ThemePack {
  id: string;
  name: string;
  orbColors: string[];
  backgroundTop: string;
  backgroundBottom: string;
}

export interface MikuFusionContentRegistry {
  producers: ProducerPack[];
  songs: SongPack[];
  themes: ThemePack[];
}

