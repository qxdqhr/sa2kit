/**
 * RN 端入口：`sa2kit/business/teachHub/ui/rn`
 *
 * 原生 UI 由 teach-hub-mobile 自绘；本入口 re-export domain 供 RN 宿主单路径依赖。
 */
export {
  TEACH_HUB_RN_SUPPORTED,
  teachHubRnPlatformNote,
  TeachHubRnStub,
} from './stub';

export * from '../../domain';
