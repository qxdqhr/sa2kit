/**
 * 太阳系模块类型定义
 */

import type * as THREE from 'three';

// ===== 基础天体类型 =====

/** 天体基础信息 */
export interface CelestialBody {
  id: string;
  name: string;
  nameEn: string;
  type: 'star' | 'planet' | 'moon';
  radius: number; // 半径（相对地球半径）
  mass: number; // 质量（相对地球质量）
  color: string; // 主要颜色
  textureUrl?: string; // 纹理贴图URL
}

/** 行星轨道参数 */
export interface OrbitalElements {
  /** 半长轴（AU - 天文单位） */
  semiMajorAxis: number;
  /** 偏心率 */
  eccentricity: number;
  /** 轨道倾角（度） */
  inclination: number;
  /** 升交点黄经（度） */
  longitudeOfAscendingNode: number;
  /** 近日点幅角（度） */
  argumentOfPeriapsis: number;
  /** 平近点角（度，历元时刻） */
  meanAnomalyAtEpoch: number;
  /** 平均运动（度/天） */
  meanMotion: number;
  /** 历元（儒略日） */
  epoch: number;
}

/** 太阳系行星数据 */
export interface Planet extends CelestialBody {
  type: 'planet';
  orbitalElements: OrbitalElements;
  rotationPeriod: number; // 自转周期（小时）
  orbitalPeriod: number; // 公转周期（天）
  distanceFromSun: number; // 平均距离（AU）
  moons?: string[]; // 卫星名称列表
}

/** 恒星数据 */
export interface Star extends CelestialBody {
  type: 'star';
  temperature: number; // 表面温度（K）
  luminosity: number; // 光度（相对太阳）
}

// ===== 3D场景相关类型 =====

/** 3D天体对象 */
export interface CelestialObject3D {
  id: string;
  mesh: THREE.Mesh;
  data: CelestialBody;
  orbit?: THREE.Line; // 轨道线
  label?: THREE.Sprite; // 标签
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

/** 太阳系场景配置 */
export interface SolarSystemConfig {
  /** 场景缩放比例 */
  scale: {
    distance: number; // 距离缩放
    size: number; // 大小缩放
    time: number; // 时间缩放
  };
  /** 显示选项 */
  display: {
    showOrbits: boolean; // 显示轨道
    showLabels: boolean; // 显示标签
    showStars: boolean; // 显示背景星空
    showGrid: boolean; // 显示网格
  };
  /** 质量设置 */
  quality: {
    planetSegments: number; // 行星球体分段数
    orbitSegments: number; // 轨道分段数
    enableShadows: boolean; // 启用阴影
    enableBloom: boolean; // 启用光晕效果
  };
}

/** 时间控制器状态 */
export interface TimeControlState {
  currentTime: Date; // 当前模拟时间
  timeScale: number; // 时间倍率（1 = 实时，365 = 一天等于一年）
  isPlaying: boolean; // 是否正在播放
  startTime: Date; // 开始时间
  maxTimeScale: number; // 最大时间倍率
  minTimeScale: number; // 最小时间倍率
}

// ===== 组件Props类型 =====

/** 太阳系查看器组件Props */
export interface SolarSystemViewerProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  config?: Partial<SolarSystemConfig>;
  onPlanetClick?: (planet: Planet) => void;
  onTimeChange?: (time: Date) => void;
  onError?: (error: Error) => void;
}

/** 行星信息面板Props */
export interface PlanetInfoProps {
  planet: Planet | null;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

/** 时间控制器Props */
export interface TimeControllerProps {
  timeState: TimeControlState;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onTimeScaleChange: (scale: number) => void;
  onTimeChange: (time: Date) => void;
  className?: string;
}

/** 设置面板Props */
export interface SettingsPanelProps {
  config: SolarSystemConfig;
  onConfigChange: (config: SolarSystemConfig) => void;
  isVisible: boolean;
  onClose: () => void;
} 