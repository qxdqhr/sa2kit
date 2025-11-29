export type PhotoWallLayout = 'masonry' | 'grid' | 'columns' | 'list' | 'timeline';

export interface PhotoWallProps {
  source: string;
  type?: 'oss' | 'public';
  initialLayout?: PhotoWallLayout;
  onSelectionChange?: (selected: string[]) => void;
}

export interface LightboxProps {
  src: string;
  onClose: () => void;
}

export interface ImageEditorProps {
  src: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export interface AlbumManagerProps {
  albums: Record<string, string[]>;
  onRenameAlbum: (oldName: string) => void;
  onDeleteAlbum: (name: string) => void;
  onClose: () => void;
}

