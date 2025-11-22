import type { MMDResources, MMDStage } from './types';

/**
 * MMD 预设配置
 */
export interface MMDPreset {
  /** 预设ID */
  id: string;
  /** 预设名称 */
  name: string;
  /** 预设简介 */
  summary: string;
  /** 预设标签 */
  badges?: string[];
  /** 资源配置 */
  resources: MMDResources;
  /** 舞台配置 */
  stage?: MMDStage;
}

/**
 * 默认预设 - 仅模型
 */
export const defaultMMDPreset: MMDPreset = {
  id: 'default',
  name: '默认模型',
  summary: '仅展示模型，无动作和音频',
  badges: ['模型', '静态'],
  resources: {
    modelPath: '/mikutalking/models/YYB_Z6SakuraMiku/miku.pmx',
  },
  stage: {
    backgroundColor: '#000000',
    cameraPosition: { x: 0, y: 10, z: 30 },
    cameraTarget: { x: 0, y: 10, z: 0 },
    enablePhysics: true,
    showGrid: true,
    ammoPath: '/mikutalking/libs/ammo.wasm.js',
    ammoWasmPath: '/mikutalking/libs/',
  },
};

/**
 * 完整动画预设 - 模型+动作+相机+音频
 */
export const catchTheWavePreset: MMDPreset = {
  id: 'catch-the-wave',
  name: 'Catch The Wave',
  summary: '完整的MMD表演：模型、动作、相机运镜、音频同步',
  badges: ['模型', '动作', '相机', '音频'],
  resources: {
    modelPath: '/mikutalking/models/YYB_Z6SakuraMiku/miku.pmx',
    motionPath: '/mikutalking/actions/CatchTheWave/mmd_CatchTheWave_motion.vmd',
    cameraPath: '/mikutalking/actions/CatchTheWave/camera.vmd',
    audioPath: '/mikutalking/actions/CatchTheWave/pv_268.wav',
  },
  stage: {
    backgroundColor: '#01030b',
    cameraPosition: { x: 0, y: 10, z: 30 },
    cameraTarget: { x: 0, y: 10, z: 0 },
    enablePhysics: true,
    showGrid: false,
    ammoPath: '/mikutalking/libs/ammo.wasm.js',
    ammoWasmPath: '/mikutalking/libs/',
  },
};

/**
 * 简单模型预设
 */
export const simpleModelPreset: MMDPreset = {
  id: 'simple-model',
  name: '简单模型',
  summary: '轻量级测试模型',
  badges: ['模型', '轻量'],
  resources: {
    modelPath: '/mikutalking/models/test/v4c5.0.pmx',
  },
  stage: {
    backgroundColor: '#ffffff',
    cameraPosition: { x: 0, y: 10, z: 30 },
    cameraTarget: { x: 0, y: 10, z: 0 },
    enablePhysics: true,
    showGrid: true,
    ammoPath: '/mikutalking/libs/ammo.wasm.js',
    ammoWasmPath: '/mikutalking/libs/',
  },
};

/**
 * 所有可用的预设
 */
export const availableMMDPresets: MMDPreset[] = [
  catchTheWavePreset,
  defaultMMDPreset,
  simpleModelPreset,
];

