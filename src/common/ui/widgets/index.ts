/**
 * 装饰 / 域 widgets：实现落在此目录；common/components 仅再导出。
 * 后续可整体迁入 sa2kit-ui。
 */
export { CollisionBalls } from './CollisionBalls';
export type { Ball, CollisionBallsConfig } from './CollisionBalls';

export { Timeline } from './Timeline';
export type { TimelineItem, TimelineConfig } from './Timeline';

export { Grid } from './Grid';
export type { GridProps, GridItem, GridColumns, GridGap } from './Grid';

export { GenericOrderManager } from './GenericOrderManager';
export type {
  GenericOrderManagerProps,
  OrderableItem,
  OrderManagerOperations,
} from './GenericOrderManager';

export { ImageMappingPanel } from './ImageMappingPanel';
export type {
  ImageMappingPanelProps,
  ImageMappingItem,
  ImageMappingValue,
} from './ImageMappingPanel';

export { LocalImageMappingPanel } from './LocalImageMappingPanel';
export type { LocalImageMappingPanelProps } from './LocalImageMappingPanel';
