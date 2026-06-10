export type NavigationDirection = 'horizontal' | 'vertical';

export type NavigationPosition = 'top' | 'bottom' | 'left' | 'right';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  isExternal?: boolean;
  target?: '_blank' | '_self';
}

export interface NavigationConfig {
  direction: NavigationDirection;
  position: NavigationPosition;
  items: NavigationItem[];
  avatar?: {
    src: string;
    alt?: string;
  };
  logo?: {
    src: string;
    alt?: string;
  };
}

export interface NavigationProps {
  config: NavigationConfig;
  isOpen: boolean;
  onToggle: () => void;
  activeItemId?: string;
  onItemClick?: (item: NavigationItem) => void;
  className?: string;
}