export type FestivalCardElementType = 'text' | 'image';

export interface FestivalCardElementBase {
  id: string;
  type: FestivalCardElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface FestivalCardTextElement extends FestivalCardElementBase {
  type: 'text';
  content: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  align?: 'left' | 'center' | 'right';
}

export interface FestivalCardImageElement extends FestivalCardElementBase {
  type: 'image';
  src: string;
  alt?: string;
  borderRadius?: number;
  fit?: 'cover' | 'contain';
}

export type FestivalCardElement = FestivalCardTextElement | FestivalCardImageElement;

export interface FestivalCardPage {
  id: string;
  title?: string;
  elements: FestivalCardElement[];
  background?: {
    color?: string;
    image?: string;
  };
}

export interface FestivalCardAudioConfig {
  src: string;
  loop?: boolean;
  autoPlay?: boolean;
  volume?: number;
}

export interface FestivalCardConfig {
  id?: string;
  name?: string;
  theme?: 'winter' | 'spring' | 'custom';
  coverTitle?: string;
  coverSubtitle?: string;
  pages: FestivalCardPage[];
  backgroundMusic?: FestivalCardAudioConfig;
  background?: {
    colorA?: string;
    colorB?: string;
  };
}

export interface FestivalCardDbAdapter {
  getConfig(id: string): Promise<FestivalCardConfig | null>;
  saveConfig(id: string, config: FestivalCardConfig): Promise<void>;
}

export interface FestivalCardServiceOptions {
  db?: FestivalCardDbAdapter;
}

