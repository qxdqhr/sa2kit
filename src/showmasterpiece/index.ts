/**
 * ShowMasterpiece 模块 - 主入口文件
 * 
 * 这是一个完整的美术作品展示模块，提供了从前端组件到后端API的完整解决方案。
 * 主要功能包括：
 * - 美术作品画集的展示和浏览
 * - 画集和作品的管理配置界面
 * - 拖拽排序功能
 * - 缩略图预览
 * - 数据持久化存储
 * 
 * 架构特点：
 * - 前后端分离，支持服务端渲染
 * - 模块化设计，便于维护和扩展
 * - TypeScript严格类型检查
 * - CSS Modules样式隔离
 * 
 * @version 1.0.0
 * @author Profile-v1 Team
 */

// ===== 客户端组件导出 =====
// 所有组件通过 components/index.ts 统一导出，保持模块化和封装性

/** 
 * ShowMasterpiece 模块所有组件的统一导出
 * 
 * 包含以下组件类别：
 * - 展示组件：CollectionCard, ArtworkViewer, ThumbnailSidebar
 * - 管理组件：CollectionOrderManager, ArtworkOrderManager  
 * - 购物车组件：CartModal, CartPage, CartButton, AddToCartButton
 * - 预订组件：BookingModal, BookingPage, CollectionList, BookingAdminPanel
 * - 配置组件：SystemConfigManager, PopupConfigManagement
 * - 对话框组件：AddConfigItemDialog, DeleteConfirmDialog
 * - 弹窗组件：DeadlinePopup, DeadlinePopupManager
 * - 历史组件：CartHistoryPage
 * - 上传组件：UniversalImageUpload
 * 
 * 使用方式：
 * ```typescript
 * import { CollectionCard, ArtworkViewer } from 'sa2kitsa2kit/showmasterpiece';
 * ```
 */
export * from './components';

/**
 * 通用顺序管理器组件
 * 
 * 抽象的通用排序组件，可以用于任何具有顺序的数据管理。
 * 通过传入操作函数和渲染函数来实现不同类型数据的排序功能。
 * 
 * 主要功能：
 * - 拖拽排序
 * - 上移/下移按钮
 * - 批量保存和重置
 * - 通用的错误处理和加载状态
 * 
 * 注意：此组件已迁移到 @/components/GenericOrderManager
 */
export { GenericOrderManager } from '@/components/GenericOrderManager';


// ===== 页面组件导出 =====
// 完整的页面组件，可以直接用作路由页面

/** 美术作品展示主页面 - 展示所有画集的网格视图 */
export { default as ShowMasterPiecesPage } from './pages/ShowMasterPiecesPage';

/** 美术作品配置管理页面 - 后台管理界面，用于配置和管理画集数据 */
export { default as ShowMasterPiecesConfigPage } from './pages/config/page';

/** 用户购物车历史页面 */
export { default as ShowMasterPiecesHistoryPage } from './pages/history/page';

// ===== Hook导出 =====
// 所有自定义React Hooks通过 hooks/index.ts 统一导出

/** 
 * ShowMasterpiece 模块所有Hooks的统一导出
 * 
 * 包含以下Hook类别：
 * - 数据管理Hook：useMasterpieces, useMasterpiecesConfig
 * - 业务逻辑Hook：useCart, useBooking, useBookingForm, useBookingAdmin
 * - 工具类Hook：useDeadlinePopup
 * - 事件和常量：cartUpdateEvents, CART_UPDATE_EVENT, notifyCartUpdate
 * 
 * 使用方式：
 * ```typescript
 * import { useMasterpieces, useCart } from 'sa2kitsa2kit/showmasterpiece';
 * ```
 */
export * from './hooks';

/** 购物车上下文提供者 - 提供购物车状态的全局管理 */
export { CartProvider } from './contexts/CartContext';

/** 
 * 注意：useCartContext Hook 现已通过 hooks 统一导出
 * 可以通过以下方式导入：
 * import { useCartContext } from 'sa2kitsa2kit/showmasterpiece';
 */

// ===== 客户端服务导出 =====
// 所有客户端API调用服务通过 services/index.ts 统一导出

/** 
 * ShowMasterpiece 模块所有服务的统一导出
 * 
 * 包含以下服务类别：
 * - 数据服务：MasterpiecesService, masterpiecesConfigService 函数集
 * - 业务服务：CartService, BookingService, BookingAdminService, CartHistoryService
 * - 工具服务：fileService 函数集
 * - 配置服务：exportConfig 配置
 * - 类型定义：BookingAdminData, BookingAdminStats 等
 * 
 * 使用方式：
 * ```typescript
 * import { 
 *   MasterpiecesService, 
 *   getConfig, 
 *   CartService,
 *   BookingAdminService 
 * } from 'sa2kitsa2kit/showmasterpiece';
 * ```
 */
export * from './services';

// ===== 类型导出 =====
// TypeScript类型定义，确保类型安全

/** 
 * 导出所有相关的TypeScript类型定义
 * 包括数据模型、表单数据、状态管理等类型
 */
export type {
  MasterpiecesConfig,  // 系统配置类型
  ArtCollection,       // 画集数据类型
  ArtworkPage,         // 作品页面数据类型
  CollectionFormData,  // 画集表单数据类型
  ArtworkFormData,     // 作品表单数据类型
  CollectionCategory,  // 画集分类枚举
  CollectionCategoryType, // 画集分类类型
  getAvailableCategories, // 获取可用分类
  isValidCategory,     // 验证分类
} from './types';

/** 
 * 导出购物车功能相关的TypeScript类型定义
 */
export type {
  Cart,                 // 购物车数据类型
  CartItem,             // 购物车项数据类型
  AddToCartRequest,     // 添加到购物车请求类型
  UpdateCartItemRequest, // 更新购物车项请求类型
  RemoveFromCartRequest, // 从购物车移除请求类型
  ClearCartRequest,     // 清空购物车请求类型
  CartAction,           // 购物车操作类型
  CartState,            // 购物车状态类型
  BatchBookingRequest,  // 批量预订请求类型
  BatchBookingResponse  // 批量预订响应类型
} from './types/cart';



/** 
 * 注意：预订管理相关的TypeScript类型定义现已通过 services 统一导出
 * 包括：BookingAdminData, BookingAdminStats, BookingAdminResponse, BookingAdminQueryParams
 */

// ===== 模块信息 =====
/** 模块版本号 */
export const SHOWMASTERPIECE_MODULE_VERSION = '1.0.0';

/** 模块名称标识 */
export const SHOWMASTERPIECE_MODULE_NAME = '@profilesa2kitsa2kit/showmasterpiece';

// ===== 服务端专用导出 =====
/**
 * 注意：以下导出只能在服务端使用，不要在客户端组件中导入
 * 
 * 服务端专用功能包括：
 * - 数据库直接操作
 * - 服务端配置管理
 * - API路由处理函数
 * 
 * 使用方式：
 * ```typescript
 * import { masterpiecesConfigDbService } from 'sa2kitsa2kit/showmasterpiece/server';
 * ```
 * 
 * 详情请参考 ./server.ts 文件
 */
