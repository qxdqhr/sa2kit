export interface CardConfig {
  fontSize?: number;
  fontColor?: string;
  textPosition?: { x: number; y: number };
  avatarPosition?: { x: number; y: number };
  avatarSize?: number;
  theme?: string;
}

export interface CardData {
  id?: string;
  userId?: string;
  characterName: string;
  characterDescription?: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  config?: CardConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssetItem {
  id: string;
  type: 'avatar' | 'background' | 'decoration';
  category: 'base' | 'parts' | 'idol' | 'support' | 'photo' | 'other';
  fileUrl: string;
  thumbnailUrl?: string;
  name: string;
  tags?: string[];
}

export interface TabData {
  id: string;
  text: string;
  active: boolean;
}

export interface CardMakerState {
  currentCard: CardData;
  activeTab: string;
  assets: AssetItem[];
  isLoading: boolean;
  isSaving: boolean;
}

export interface AssetGridProps {
  assets: AssetItem[];
  onSelect: (asset: AssetItem) => void;
  selectedAssetId?: string;
}

export interface CardPreviewProps {
  card: CardData;
  className?: string;
}
