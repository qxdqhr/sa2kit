'use client';

/**
 * showmasterpiece client surface（SMP3）
 * types / hooks / contexts / shared / utils；service 以命名空间导出避免冲突。
 */
export * from './types';
export * from './types/booking';
export * from './types/cart';

export * from './logic/hooks';
export * from './logic/contexts';
export {
  CATEGORY_LABELS,
  getCategoryLabel,
  formatPrice,
  getMiniappCart,
  addToMiniappCart,
  updateMiniappCartItem,
  removeMiniappCartItem,
  clearMiniappCart,
  useDeadlinePopupCore,
} from './logic/shared';
export {
  getCart as getSharedStorageCart,
  addToCart as addToSharedStorageCart,
  updateCartItem as updateSharedStorageCartItem,
  removeCartItem as removeSharedStorageCartItem,
  clearCart as clearSharedStorageCart,
} from './logic/shared/cart';

export * as masterpiecesService from './service/client-business/masterpiecesService';
export * as masterpiecesConfigService from './service/client-business/masterpiecesConfigService';
export * as cartService from './service/client-business/cartService';
export * as bookingService from './service/client-business/bookingService';
export * as bookingAdminService from './service/client-business/bookingAdminService';
export * as cartHistoryService from './service/client-business/cartHistoryService';
export * as eventAwareMasterpiecesService from './service/client-business/eventAwareMasterpiecesService';
export * as exportConfigService from './service/client-business/exportConfig';
export * as fileService from './service/client-business/fileService';
export * as webService from './service/web';
export * as apiService from './service/api';

export { showmasterpieceApiPath } from './utils/showmasterpieceApiPath';
export { showmasterpiecePagePath } from './utils/routes';
export { cn } from './utils/cn';
export { sm, smCn } from './shared/theme';
