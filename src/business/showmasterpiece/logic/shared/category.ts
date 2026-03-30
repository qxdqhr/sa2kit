import type { CollectionCategoryType } from '../../types';

export const CATEGORY_LABELS: Record<string, string> = {
  collection: '画集',
  acrylic: '立牌',
  badge: '吧唧',
  color_paper: '色纸',
  transparent_card: '透卡',
  postcard: '明信片',
  laser_ticket: '镭射票',
  canvas_bag: '帆布包',
  spiral_notebook: '线圈本',
  mouse_pad: '鼠标垫',
  support_stick: '应援棒',
  keychain: '挂件/钥匙扣',
  other: '其它'
};

export const getCategoryLabel = (category?: CollectionCategoryType): string => {
  if (!category) return '未分类';
  return CATEGORY_LABELS[String(category)] ?? String(category);
};
