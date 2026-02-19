/**
 * ShowMasterpiece 模块 - Services 导出
 * 
 * 这个文件导出了ShowMasterpiece模块中所有的服务类和API调用函数。
 * 这些服务都采用了模块化设计，具有以下特点：
 * - 完全自包含，封装API调用逻辑
 * - 支持TypeScript类型检查
 * - 统一的错误处理机制
 * - 遵循前端服务层最佳实践
 * 
 * 服务分类：
 * - 数据服务：用于数据获取和操作
 * - 业务服务：用于特定业务功能封装
 * - 工具服务：用于通用功能支持
 * - 配置服务：用于配置管理
 */

/** 
 * 画集数据服务
 * 
 * 提供美术作品前端API服务，主要用于画集数据的获取和查询。
 * 这是一个静态服务类，提供面向对象的API调用接口。
 * 
 * 主要功能：
 * - 画集数据的获取和查询
 * - 搜索和筛选功能
 * - 分类和标签管理
 * - 推荐算法
 * 
 * 设计特点：
 * - 使用静态方法，无需实例化
 * - 统一的错误处理
 * - 支持多种查询方式
 * - TypeScript类型安全
 * 
 * @example
 * ```tsx
 * const collections = await MasterpiecesService.getAllCollections();
 * const filtered = await MasterpiecesService.getCollectionsByCategory(category);
 * ```
 */
export { MasterpiecesService, getMasterpieces } from './masterpiecesService';

/** 
 * 画集配置管理服务
 * 
 * 提供画集和作品配置管理的完整API调用功能，用于后台管理界面。
 * 包含所有与美术作品相关的CRUD操作和配置管理。
 * 
 * 主要功能：
 * - 系统配置的读取和更新
 * - 画集的增删改查操作
 * - 作品的增删改查操作
 * - 拖拽排序功能
 * - 分类和标签管理
 * 
 * 导出内容：
 * - 配置管理：getConfig, updateConfig, resetConfig
 * - 画集管理：getAllCollections, createCollection, updateCollection, deleteCollection
 * - 画集排序：updateCollectionOrder, moveCollection, moveCollectionUp, moveCollectionDown
 * - 作品管理：addArtworkToCollection, updateArtwork, deleteArtwork, getArtworksByCollection
 * - 作品排序：updateArtworkOrder, moveArtwork, moveArtworkUp, moveArtworkDown
 * - 分类标签：getCategories, getTags, getCollectionsOverview
 * 
 * @example
 * ```tsx
 * const config = await getConfig();
 * const collection = await createCollection(formData);
 * await updateCollectionOrder(orderData);
 * ```
 */
export { 
  // 配置管理
  getConfig,
  updateConfig,
  resetConfig,
  
  // 画集管理
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  updateCollectionOrder,
  moveCollection,
  moveCollectionUp,
  moveCollectionDown,
  
  // 作品管理
  addArtworkToCollection,
  updateArtwork,
  deleteArtwork,
  getArtworksByCollection,
  updateArtworkOrder,
  moveArtwork,
  moveArtworkUp,
  moveArtworkDown,
  
  // 分类和标签
  getCategories,
  createCategory,
  getTags,
  getCollectionsOverview
} from './masterpiecesConfigService';

/** 
 * 购物车服务
 * 
 * 提供购物车功能的前端本地存储服务，支持购物车操作和批量预订处理。
 * 包含购物车的完整生命周期管理。
 * 
 * 主要功能：
 * - 添加商品到购物车
 * - 更新购物车商品数量
 * - 从购物车移除商品
 * - 清空购物车
 * - 批量预订处理
 * 
 * 导出内容：
 * - CartService 类 - 完整的购物车服务类
 * - 便捷函数：getCart, addToCart, updateCartItem, removeFromCart, clearCart, batchBooking
 * 
 * @example
 * ```tsx
 * const cart = await getCart(userId);
 * await addToCart({ collectionId, quantity, userId });
 * const result = await batchBooking(bookingData);
 * ```
 */
export { 
  CartService,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  batchBooking
} from './cartService';

/** 
 * 预订服务
 * 
 * 提供画集预订功能的前端API调用服务，用于用户预订画集的完整流程。
 * 包含预订的创建、查询、更新等功能。
 * 
 * 主要功能：
 * - 创建预订
 * - 查询预订列表
 * - 更新预订状态
 * - 获取画集简略信息
 * - 预订数据管理
 * 
 * 导出内容：
 * - BookingService 类 - 完整的预订服务类
 * - 便捷函数：createBooking, getBookings, getBooking, updateBooking, deleteBooking, getBookableCollections
 * 
 * @example
 * ```tsx
 * const collections = await getBookableCollections();
 * const booking = await createBooking(bookingData);
 * const bookings = await getBookings(params);
 * ```
 */
export { 
  BookingService,
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  getBookableCollections
} from './bookingService';

/** 
 * 预订管理服务
 * 
 * 提供预订管理功能的API调用服务，主要用于管理员查看和管理所有用户的预订信息。
 * 包含预订数据获取、统计信息、状态管理等功能。
 * 
 * 主要功能：
 * - 获取所有预订数据
 * - 预订统计信息
 * - 预订状态更新
 * - 预订数据导出
 * - 强制刷新缓存
 * 
 * 导出内容：
 * - BookingAdminService 类 - 完整的预订管理服务类
 * - 类型定义：BookingAdminData, BookingAdminStats, BookingAdminResponse, BookingAdminQueryParams
 * - 便捷函数：getAllBookings, getBookingStats, updateBookingStatus, deleteBooking, exportBookings
 * 
 * @example
 * ```tsx
 * const bookings = await getAllBookings(params);
 * const stats = await getBookingStats();
 * await updateBookingStatus(id, status);
 * ```
 */
export { 
  BookingAdminService,
  getAllBookings,
  getBookingStats,
  forceRefreshAllBookings,
  forceRefreshBookingStats,
  updateBookingStatus as updateBookingAdminStatus,
  deleteBooking as deleteBookingAdmin,
  exportBookings
} from './bookingAdminService';

/** 
 * 预订管理类型定义
 * 
 * 导出预订管理相关的TypeScript类型定义，确保类型安全。
 * 
 * @example
 * ```tsx
 * const handleBookings = (data: BookingAdminData[]) => {
 *   // 处理预订数据
 * };
 * ```
 */
export type {
  BookingAdminData,
  BookingAdminStats,
  BookingAdminResponse,
  BookingAdminQueryParams
} from './bookingAdminService';

/** 
 * 购物车历史服务
 * 
 * 提供购物车历史记录管理的API调用服务，用于用户查看和管理购物车历史。
 * 包含历史记录的增删改查和统计功能。
 * 
 * 主要功能：
 * - 购物车历史记录查询
 * - 历史记录状态管理
 * - 历史数据统计
 * - 历史记录清理
 * 
 * 导出内容：
 * - CartHistoryService 类 - 完整的历史记录服务类
 * - 便捷函数：getCartHistory, updateBookingStatus, deleteHistoryRecord, clearUserHistory, getAllHistory, getStatistics, saveCartHistory
 * 
 * @example
 * ```tsx
 * const history = await getCartHistory(userId, params);
 * const stats = await getStatistics(userId);
 * await saveCartHistory(historyItem);
 * ```
 */
export { 
  CartHistoryService,
  getCartHistory,
  updateBookingStatus as updateCartHistoryBookingStatus,
  deleteHistoryRecord,
  clearUserHistory,
  getAllHistory,
  getStatistics,
  saveCartHistory
} from './cartHistoryService';

/** 
 * 文件服务
 * 
 * 为ShowMasterpiece模块提供特定的文件服务配置和帮助函数。
 * 包含文件上传、图片处理、存储模式检查等功能。
 * 
 * 主要功能：
 * - 获取文件服务配置
 * - 上传作品图片
 * - 获取图片URL
 * - 存储模式检查
 * - 存储模式显示名称
 * 
 * @example
 * ```tsx
 * const config = await getShowMasterpieceFileConfig();
 * const result = await uploadArtworkImage(file, collectionId);
 * const imageUrl = await getArtworkImageUrl(fileId);
 * const useUniversal = await shouldUseUniversalFileService();
 * ```
 */
export { 
  getShowMasterpieceFileConfig,
  uploadArtworkImage,
  getArtworkImageUrl,
  shouldUseUniversalFileService,
  getStorageModeDisplayName,
  clearConfigCache,
  refreshFileServiceConfig
} from './fileService';

/** 
 * 导出配置服务
 * 
 * 提供数据导出相关的配置和字段定义，主要用于预订数据的导出功能。
 * 包含导出字段配置和默认导出设置。
 * 
 * 主要功能：
 * - 预订导出字段配置
 * - 默认导出配置设置
 * - 导出格式定义
 * 
 * @example
 * ```tsx
 * import { BOOKING_EXPORT_FIELDS, DEFAULT_BOOKING_EXPORT_CONFIG } from '@/modules/showmasterpiece';
 * 
 * const exportConfig = {
 *   ...DEFAULT_BOOKING_EXPORT_CONFIG,
 *   fields: BOOKING_EXPORT_FIELDS.filter(field => field.key !== 'sensitive_data')
 * };
 * ```
 */
export { 
  BOOKING_EXPORT_FIELDS,
  DEFAULT_BOOKING_EXPORT_CONFIG
} from './exportConfig';
