/**
 * ShowMasterpiece 模块 - Hooks 导出
 * 
 * 这个文件导出了ShowMasterpiece模块中所有的自定义React Hooks。
 * 这些Hooks都采用了模块化设计，具有以下特点：
 * - 完全自包含，封装业务逻辑
 * - 支持TypeScript类型检查
 * - 统一的错误处理和加载状态
 * - 遵循React Hooks最佳实践
 * 
 * Hook分类：
 * - 数据管理Hook：用于数据获取和状态管理
 * - 业务逻辑Hook：用于特定业务功能封装
 * - 工具类Hook：用于通用功能支持
 */

/** 
 * 画集数据管理Hook
 * 
 * 提供完整的画集数据管理和浏览功能，是ShowMasterpiece模块的核心Hook。
 * 包含画集数据加载、浏览状态管理、翻页操作等功能。
 * 
 * 主要功能：
 * - 画集数据的加载和缓存
 * - 画集浏览状态管理（当前选中的画集、当前页面等）
 * - 翻页操作（上一页、下一页、跳转）
 * - 搜索功能
 * - 错误处理和加载状态管理
 * 
 * 性能优化：
 * - 内存缓存机制，减少重复API调用
 * - 使用useCallback优化函数引用稳定性
 * - 懒加载和按需加载
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   selectedCollection,
 *   currentPage,
 *   loading,
 *   selectCollection,
 *   nextPage,
 *   prevPage
 * } = useMasterpieces();
 * ```
 */
export { useMasterpieces } from './useMasterpieces';

/** 
 * 画集配置管理Hook
 * 
 * 提供画集和作品配置管理的完整功能，用于后台管理界面。
 * 封装了所有的CRUD操作和状态管理逻辑。
 * 
 * 主要功能：
 * - 系统配置的读取和更新
 * - 画集的增删改查操作
 * - 作品的增删改查操作
 * - 拖拽排序功能
 * - 表单验证和错误处理
 * 
 * @example
 * ```tsx
 * const {
 *   config,
 *   collections,
 *   loading,
 *   createCollection,
 *   updateArtwork,
 *   deleteCollection
 * } = useMasterpiecesConfig();
 * ```
 */
export { useMasterpiecesConfig } from './useMasterpiecesConfig';

/** 
 * 购物车功能Hook
 * 
 * 提供购物车功能相关的状态管理和业务逻辑。
 * 支持购物车操作、批量预订等功能。
 * 
 * 主要功能：
 * - 购物车状态管理
 * - 购物车操作（添加、更新、移除、清空）
 * - 批量预订处理
 * - 错误处理和加载状态
 * - 购物车更新事件通知
 * 
 * 导出内容：
 * - useCart Hook
 * - cartUpdateEvents 事件对象
 * - CART_UPDATE_EVENT 事件常量
 * - notifyCartUpdate 通知函数
 * 
 * @example
 * ```tsx
 * const {
 *   cart,
 *   loading,
 *   addToCart,
 *   updateCartItem,
 *   batchBooking
 * } = useCart(userId);
 * ```
 */
export { 
  useCart,
  cartUpdateEvents,
  CART_UPDATE_EVENT,
  notifyCartUpdate 
} from './useCart';

/** 
 * 预订功能Hook
 * 
 * 提供预订功能相关的状态管理和业务逻辑。
 * 包含预订表单管理和预订提交处理。
 * 
 * 主要功能：
 * - 预订表单状态管理
 * - 画集列表加载
 * - 预订提交处理
 * - 错误处理和加载状态
 * 
 * 导出内容：
 * - useBooking Hook - 基础预订功能
 * - useBookingForm Hook - 预订表单管理
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   loading,
 *   refreshCollections
 * } = useBooking();
 * 
 * const {
 *   formData,
 *   updateFormData,
 *   submitBooking
 * } = useBookingForm();
 * ```
 */
export { useBooking, useBookingForm } from './useBooking';

/** 
 * 预订管理Hook
 * 
 * 提供预订管理功能的状态管理和数据获取逻辑。
 * 主要用于管理员查看和管理所有用户的预订信息。
 * 
 * 主要功能：
 * - 获取所有预订数据
 * - 预订统计信息
 * - 状态更新
 * - 加载和错误状态管理
 * - 用户搜索功能
 * 
 * @example
 * ```tsx
 * const {
 *   bookings,
 *   stats,
 *   loading,
 *   updateStatus,
 *   refreshData
 * } = useBookingAdmin();
 * ```
 */
export { useBookingAdmin } from './useBookingAdmin';

/** 
 * 限时弹窗Hook
 * 
 * 管理限时弹窗的显示逻辑，用于显示重要通知和截止日期提醒。
 * 支持弹窗配置管理、显示控制和用户交互处理。
 * 
 * 主要功能：
 * - 弹窗配置检查和加载
 * - 弹窗显示状态管理
 * - 用户交互处理（确认、取消、关闭）
 * - 弹窗显示条件判断
 * - 临时关闭和重置功能
 * 
 * @example
 * ```tsx
 * const {
 *   configs,
 *   hasPopup,
 *   loading,
 *   closePopup,
 *   confirmPopup,
 *   cancelPopup
 * } = useDeadlinePopup('showmasterpiece', 'homepage_visit');
 * ```
 */
export { useDeadlinePopup } from './useDeadlinePopup';

/** 
 * 购物车上下文Hook
 * 
 * 用于在组件中访问购物车上下文状态的Hook。
 * 必须在CartProvider包装的组件内使用。
 * 
 * 主要功能：
 * - 获取购物车数据
 * - 获取加载状态
 * - 获取错误信息
 * - 提供刷新购物车的方法
 * 
 * @example
 * ```tsx
 * const { cart, loading, error, refreshCart } = useCartContext();
 * ```
 */
export { useCartContext } from './useCartContext';

/** 
 * 默认导出
 * 
 * 为了兼容性，同时提供默认导出，指向最常用的Hook
 */
export { useDeadlinePopup as default } from './useDeadlinePopup';
