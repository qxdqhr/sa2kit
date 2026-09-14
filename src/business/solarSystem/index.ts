/**
 * 太阳系模块 — `sa2kit/business/solarSystem`
 * 不要从这里 re-export Viewer / astronomyUtils：
 * 那两个文件运行时依赖 three，会把 3D 打进误用 barrel 的页面。
 */
export { default as SolarSystemPage } from './pages/SolarSystemPage';
export * from './utils/planetData';
export type {
  CelestialBody,
  OrbitalElements,
  Planet,
  Star,
  SolarSystemConfig,
  TimeControlState,
  SolarSystemViewerProps,
  PlanetInfoProps,
  TimeControllerProps,
  SettingsPanelProps,
} from './types';
