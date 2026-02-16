import React from 'react';
import { useLocalStorage } from '../storage/hooks/useLocalStorage';
import {
  ImageMappingPanel,
  type ImageMappingItem,
  type ImageMappingPanelProps,
  type ImageMappingValue,
} from './ImageMappingPanel';

export interface LocalImageMappingPanelProps
  extends Omit<ImageMappingPanelProps, 'value' | 'onChange'> {
  storageKey: string;
  defaultValue?: ImageMappingValue;
  onValueChange?: (next: ImageMappingValue) => void;
}

export function LocalImageMappingPanel({
  storageKey,
  defaultValue = {},
  onValueChange,
  ...panelProps
}: LocalImageMappingPanelProps) {
  const [value, setValue] = useLocalStorage<ImageMappingValue>(storageKey, defaultValue);

  return (
    <ImageMappingPanel
      {...panelProps}
      value={value}
      onChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

export type { ImageMappingItem };

