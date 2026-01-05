'use client';

/**
 * MMD光照调试面板
 * 实时调整渲染器、光源、材质参数
 */

import React, { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

/**
 * 光照参数接口
 */
export interface MMDLightingParams {
  /** 色调映射类型 (0=None, 1=Linear, 2=Reinhard, 3=Cineon, 4=ACESFilmic) */
  toneMapping: number;
  /** 色调映射曝光值 */
  toneMappingExposure: number;
  /** 环境光强度 */
  ambientIntensity: number;
  /** 主方向光强度 */
  directionalIntensity: number;
  /** 主方向光X轴位置 */
  directionalX: number;
  /** 主方向光Y轴位置 */
  directionalY: number;
  /** 主方向光Z轴位置 */
  directionalZ: number;
  /** 侧面补光强度 */
  sideIntensity: number;
  /** 半球光强度 */
  hemisphereIntensity: number;
  /** 材质自发光强度 */
  emissiveIntensity: number;
  /** 颜色亮度系数 */
  colorBrightness: number;
  /** 颜色饱和度系数 */
  colorSaturation: number;
  /** 是否启用阴影 */
  enableShadows: boolean;
  /** 模型是否接收阴影 */
  receiveShadow: boolean;
  /** 阴影偏移 */
  shadowBias: number;
  /** 高光强度（Shininess） */
  shininess: number;
  /** 高光颜色亮度 */
  specularIntensity: number;
  /** 反射率 */
  reflectivity: number;
  /** 金属度 */
  metalness: number;
  /** 粗糙度 */
  roughness: number;
  /** 环境光遮蔽强度 */
  aoMapIntensity: number;
  /** 边缘光强度 */
  rimLightIntensity: number;
  /** 边缘光颜色 */
  rimLightColor: string;
}

/**
 * 场景引用接口
 */
export interface MMDSceneRefs {
  /** 渲染器 */
  renderer: THREE.WebGLRenderer | null;
  /** 环境光 */
  ambientLight: THREE.AmbientLight | null;
  /** 主方向光 */
  directionalLight: THREE.DirectionalLight | null;
  /** 侧面补光 */
  sideLight: THREE.DirectionalLight | null;
  /** 半球光 */
  hemisphereLight: THREE.HemisphereLight | null;
  /** MMD模型网格 */
  mmdMesh: THREE.SkinnedMesh | null;
}

/**
 * 组件Props
 */
export interface MMDLightingDebugPanelProps {
  /** 场景引用（包含渲染器、光源、模型等） */
  sceneRefs: React.MutableRefObject<MMDSceneRefs>;
  /** 初始参数（可选） */
  initialParams?: Partial<MMDLightingParams>;
  /** 参数变化回调（可选） */
  onParamsChange?: (params: MMDLightingParams) => void;
  /** 是否默认显示（默认true） */
  defaultVisible?: boolean;
  /** 面板位置（默认'right'） */
  position?: 'left' | 'right';
  /** 自定义类名 */
  className?: string;
}

/**
 * 默认参数
 */
const DEFAULT_PARAMS: MMDLightingParams = {
  toneMapping: 4, // ACESFilmic
  toneMappingExposure: 1.4,
  ambientIntensity: 1.5,
  directionalIntensity: 0.8,
  directionalX: 5,
  directionalY: 10,
  directionalZ: 5,
  sideIntensity: 0.5,
  hemisphereIntensity: 0.6,
  emissiveIntensity: 0.35,
  colorBrightness: 1.35,
  colorSaturation: 1.15,
  enableShadows: true,
  receiveShadow: true,
  shadowBias: -0.0001,
  shininess: 30,
  specularIntensity: 0.5,
  reflectivity: 0.5,
  metalness: 0.0,
  roughness: 0.8,
  aoMapIntensity: 1.0,
  rimLightIntensity: 0.0,
  rimLightColor: '#ffffff',
};

/**
 * MMD光照调试面板组件
 */
export const MMDLightingDebugPanel: React.FC<MMDLightingDebugPanelProps> = ({
  sceneRefs,
  initialParams,
  onParamsChange,
  defaultVisible = true,
  position = 'right',
  className = '',
}) => {
  const [showPanel, setShowPanel] = useState(defaultVisible);
  const [params, setParams] = useState<MMDLightingParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });

  // 更新单个参数
  const updateParam = useCallback((key: keyof MMDLightingParams, value: number | boolean | string) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      onParamsChange?.(newParams);
      return newParams;
    });
  }, [onParamsChange]);

  // 应用批量参数
  const applyPreset = useCallback((preset: Partial<MMDLightingParams>) => {
    setParams(prev => {
      const newParams = { ...prev, ...preset };
      onParamsChange?.(newParams);
      return newParams;
    });
  }, [onParamsChange]);

  // 实时应用参数到场景
  useEffect(() => {
    const refs = sceneRefs.current;
    
    // 更新渲染器
    if (refs.renderer) {
      refs.renderer.toneMapping = params.toneMapping as THREE.ToneMapping;
      refs.renderer.toneMappingExposure = params.toneMappingExposure;
      refs.renderer.shadowMap.enabled = params.enableShadows;
    }
    
    // 更新环境光
    if (refs.ambientLight) {
      refs.ambientLight.intensity = params.ambientIntensity;
    }
    
    // 更新主方向光
    if (refs.directionalLight) {
      refs.directionalLight.intensity = params.directionalIntensity;
      refs.directionalLight.position.set(
        params.directionalX,
        params.directionalY,
        params.directionalZ
      );
      refs.directionalLight.shadow.bias = params.shadowBias;
    }
    
    // 更新侧面补光
    if (refs.sideLight) {
      refs.sideLight.intensity = params.sideIntensity;
    }
    
    // 更新半球光
    if (refs.hemisphereLight) {
      refs.hemisphereLight.intensity = params.hemisphereIntensity;
    }
    
    // 更新模型材质
    if (refs.mmdMesh) {
      refs.mmdMesh.receiveShadow = params.receiveShadow;
      
      refs.mmdMesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const meshChild = child as THREE.Mesh;
          if (meshChild.material) {
            const materials = Array.isArray(meshChild.material) 
              ? meshChild.material 
              : [meshChild.material];
            
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || 
                  mat instanceof THREE.MeshPhongMaterial ||
                  mat instanceof THREE.MeshToonMaterial) {
                if (mat.color) {
                  // 保存原始颜色（如果还没有）
                  const originalColor = mat.userData.originalColor || mat.color.clone();
                  if (!mat.userData.originalColor) {
                    mat.userData.originalColor = originalColor;
                  }
                  
                  // 保存原始自发光颜色
                  if ('emissive' in mat && !mat.userData.originalEmissive) {
                    mat.userData.originalEmissive = (mat as any).emissive.clone();
                  }
                  
                  // 应用亮度和饱和度调整
                  const hsl = { h: 0, s: 0, l: 0 };
                  originalColor.getHSL(hsl);
                  
                  mat.color.setHSL(
                    hsl.h, 
                    Math.min(hsl.s * params.colorSaturation, 1), 
                    Math.min(hsl.l * params.colorBrightness, 1)
                  );
                  
                  // 设置自发光
                  if ('emissive' in mat) {
                    const emissiveHsl = { h: 0, s: 0, l: 0 };
                    mat.userData.originalEmissive.getHSL(emissiveHsl);
                    
                    (mat as any).emissive.setHSL(
                      emissiveHsl.h,
                      Math.min(emissiveHsl.s * params.colorSaturation, 1),
                      Math.min(emissiveHsl.l * params.colorBrightness, 1)
                    );
                    (mat as any).emissiveIntensity = params.emissiveIntensity;
                  }
                  
                  // 🎨 应用高光和反射属性（MeshPhongMaterial）
                  if (mat instanceof THREE.MeshPhongMaterial) {
                    // 高光强度
                    mat.shininess = params.shininess;
                    
                    // 高光颜色
                    const specularColor = new THREE.Color(0x888888);
                    specularColor.multiplyScalar(params.specularIntensity);
                    mat.specular = specularColor;
                    
                    // 反射率
                    if ('reflectivity' in mat) {
                      (mat as any).reflectivity = params.reflectivity;
                    }
                  }
                  
                  // 🎨 MeshToonMaterial的特殊处理
                  if (mat instanceof THREE.MeshToonMaterial) {
                    // Toon材质使用gradientMap控制阶梯数
                    // 高光颜色
                    if ('specular' in mat) {
                      const specularColor = new THREE.Color(0x888888);
                      specularColor.multiplyScalar(params.specularIntensity);
                      (mat as any).specular = specularColor;
                    }
                  }
                  
                  // 🎨 应用PBR材质属性（MeshStandardMaterial）
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.metalness = params.metalness;
                    mat.roughness = params.roughness;
                    
                    // 环境光遮蔽强度
                    if (mat.aoMap) {
                      mat.aoMapIntensity = params.aoMapIntensity;
                    }
                  }
                  
                  // 🌟 边缘光效果（通过自定义shader或emissive模拟）
                  if (params.rimLightIntensity > 0) {
                    // 简单的边缘光效果：增强自发光
                    if ('emissive' in mat) {
                      const rimColor = new THREE.Color(params.rimLightColor);
                      (mat as any).emissive.lerp(rimColor, params.rimLightIntensity * 0.5);
                    }
                  }
                  
                  // 标记材质需要更新
                  mat.needsUpdate = true;
                }
              }
            });
          }
        }
      });
    }
  }, [params, sceneRefs]);

  const toneMappingNames = ['None', 'Linear', 'Reinhard', 'Cineon', 'ACESFilmic'];
  const positionClass = position === 'right' ? 'right-0' : 'left-0';
  const translateClass = position === 'right' 
    ? (showPanel ? 'translate-x-0' : 'translate-x-full')
    : (showPanel ? 'translate-x-0' : '-translate-x-full');

  return (
    <>
      {/* 调试面板 */}
      <div 
        className={`fixed top-0 ${positionClass} z-[9999] w-80 h-screen bg-white/95 backdrop-blur-md shadow-2xl overflow-y-auto transition-transform duration-300 ${translateClass} ${className}`}
      >
        <div className="p-4">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🎨 光照调试</h2>
            <button
              onClick={() => setShowPanel(false)}
              className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              aria-label="关闭面板"
            >
              ✕
            </button>
          </div>

          {/* 渲染器设置 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">🖼️ 渲染器</h3>
            
            <label className="block mb-2">
              <span className="text-xs text-gray-700">色调映射</span>
              <select
                value={params.toneMapping}
                onChange={(e) => updateParam('toneMapping', Number(e.target.value))}
                className="w-full mt-1 p-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {toneMappingNames.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">曝光值</span>
                <span className="text-xs font-mono text-blue-600">{params.toneMappingExposure.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={params.toneMappingExposure}
                onChange={(e) => updateParam('toneMappingExposure', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>
          </div>

          {/* 光源强度 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">💡 光源强度</h3>
            
            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">环境光</span>
                <span className="text-xs font-mono text-blue-600">{params.ambientIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={params.ambientIntensity}
                onChange={(e) => updateParam('ambientIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">主方向光</span>
                <span className="text-xs font-mono text-blue-600">{params.directionalIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={params.directionalIntensity}
                onChange={(e) => updateParam('directionalIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">侧面补光</span>
                <span className="text-xs font-mono text-blue-600">{params.sideIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={params.sideIntensity}
                onChange={(e) => updateParam('sideIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">半球光</span>
                <span className="text-xs font-mono text-blue-600">{params.hemisphereIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={params.hemisphereIntensity}
                onChange={(e) => updateParam('hemisphereIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>
          </div>

          {/* 光源位置 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">📍 主光源位置</h3>
            
            <label className="block mb-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">X 轴</span>
                <span className="text-xs font-mono text-blue-600">{params.directionalX.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={params.directionalX}
                onChange={(e) => updateParam('directionalX', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">Y 轴</span>
                <span className="text-xs font-mono text-blue-600">{params.directionalY.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={params.directionalY}
                onChange={(e) => updateParam('directionalY', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">Z 轴</span>
                <span className="text-xs font-mono text-blue-600">{params.directionalZ.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={params.directionalZ}
                onChange={(e) => updateParam('directionalZ', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>
          </div>

          {/* 材质设置 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">🎨 材质属性</h3>
            
            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">自发光强度 ⭐</span>
                <span className="text-xs font-mono text-blue-600">{params.emissiveIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.emissiveIntensity}
                onChange={(e) => updateParam('emissiveIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">颜色亮度</span>
                <span className="text-xs font-mono text-blue-600">{params.colorBrightness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={params.colorBrightness}
                onChange={(e) => updateParam('colorBrightness', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">颜色饱和度</span>
                <span className="text-xs font-mono text-blue-600">{params.colorSaturation.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={params.colorSaturation}
                onChange={(e) => updateParam('colorSaturation', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>
          </div>

          {/* 高光和反射 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">✨ 高光与反射</h3>
            
            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">高光强度 (Shininess)</span>
                <span className="text-xs font-mono text-blue-600">{params.shininess.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={params.shininess}
                onChange={(e) => updateParam('shininess', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">高光颜色强度</span>
                <span className="text-xs font-mono text-blue-600">{params.specularIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={params.specularIntensity}
                onChange={(e) => updateParam('specularIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">反射率</span>
                <span className="text-xs font-mono text-blue-600">{params.reflectivity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.reflectivity}
                onChange={(e) => updateParam('reflectivity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">金属度 (PBR)</span>
                <span className="text-xs font-mono text-blue-600">{params.metalness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.metalness}
                onChange={(e) => updateParam('metalness', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">粗糙度 (PBR)</span>
                <span className="text-xs font-mono text-blue-600">{params.roughness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.roughness}
                onChange={(e) => updateParam('roughness', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>
          </div>

          {/* 高级效果 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">🌟 高级效果</h3>
            
            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">环境光遮蔽 (AO)</span>
                <span className="text-xs font-mono text-blue-600">{params.aoMapIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={params.aoMapIntensity}
                onChange={(e) => updateParam('aoMapIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">边缘光强度</span>
                <span className="text-xs font-mono text-blue-600">{params.rimLightIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.rimLightIntensity}
                onChange={(e) => updateParam('rimLightIntensity', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>

            <label className="block mb-2">
              <span className="text-xs text-gray-700">边缘光颜色</span>
              <input
                type="color"
                value={params.rimLightColor}
                onChange={(e) => updateParam('rimLightColor', e.target.value)}
                className="w-full mt-1 h-8 cursor-pointer"
              />
            </label>
          </div>

          {/* 阴影设置 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">🌑 阴影</h3>
            
            <label className="flex items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.enableShadows}
                onChange={(e) => updateParam('enableShadows', e.target.checked)}
                className="mr-2"
              />
              <span className="text-xs text-gray-700">启用阴影</span>
            </label>

            <label className="flex items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.receiveShadow}
                onChange={(e) => updateParam('receiveShadow', e.target.checked)}
                className="mr-2"
              />
              <span className="text-xs text-gray-700">模型接收阴影</span>
            </label>

            <label className="block mb-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">阴影偏移</span>
                <span className="text-xs font-mono text-blue-600">{params.shadowBias.toFixed(4)}</span>
              </div>
              <input
                type="range"
                min="-0.001"
                max="0.001"
                step="0.0001"
                value={params.shadowBias}
                onChange={(e) => updateParam('shadowBias', Number(e.target.value))}
                className="w-full mt-1"
              />
            </label>
          </div>

          {/* 快速预设 */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b">⚡ 快速预设</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset({
                  toneMappingExposure: 1.4,
                  ambientIntensity: 1.5,
                  emissiveIntensity: 0.35,
                })}
                className="p-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                默认
              </button>
              <button
                onClick={() => applyPreset({
                  toneMappingExposure: 1.8,
                  ambientIntensity: 2.0,
                  emissiveIntensity: 0.5,
                })}
                className="p-2 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
              >
                超亮
              </button>
              <button
                onClick={() => applyPreset({
                  toneMappingExposure: 1.0,
                  ambientIntensity: 0.8,
                  emissiveIntensity: 0.1,
                })}
                className="p-2 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
              >
                暗调
              </button>
              <button
                onClick={() => applyPreset({
                  colorSaturation: 1.5,
                  colorBrightness: 1.4,
                  specularIntensity: 1.0,
                  shininess: 40,
                })}
                className="p-2 bg-pink-500 text-white rounded text-xs hover:bg-pink-600 transition-colors"
              >
                鲜艳
              </button>
              <button
                onClick={() => applyPreset({
                  toneMapping: 1, // Linear
                  toneMappingExposure: 1.2,
                  ambientIntensity: 0.8,
                  directionalIntensity: 1.2,
                  sideIntensity: 0.4,
                  emissiveIntensity: 0.1,
                  colorBrightness: 1.2,
                  colorSaturation: 1.3,
                  shininess: 50,
                  specularIntensity: 1.2,
                  reflectivity: 0.6,
                  rimLightIntensity: 0.15,
                  rimLightColor: '#88ccff',
                })}
                className="p-2 bg-cyan-500 text-white rounded text-xs hover:bg-cyan-600 transition-colors"
              >
                卡通增强
              </button>
              <button
                onClick={() => applyPreset({
                  toneMapping: 1, // Linear
                  toneMappingExposure: 1.0,
                  ambientIntensity: 0.6,
                  directionalIntensity: 1.0,
                  sideIntensity: 0.3,
                  emissiveIntensity: 0,
                  colorBrightness: 1.0,
                  colorSaturation: 1.0,
                  shininess: 30,
                  specularIntensity: 0.8,
                  reflectivity: 0.5,
                  metalness: 0.0,
                  roughness: 0.8,
                  rimLightIntensity: 0,
                })}
                className="p-2 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 transition-colors"
              >
                MMD标准
              </button>
              <button
                onClick={() => applyPreset(DEFAULT_PARAMS)}
                className="p-2 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
              >
                重置全部
              </button>
            </div>
          </div>

          {/* 导出配置 */}
          <button
            onClick={() => {
              console.log('💡 当前光照配置:', params);
              const json = JSON.stringify(params, null, 2);
              console.log('📋 JSON格式:', json);
              alert('配置已输出到控制台！按 F12 查看');
            }}
            className="w-full p-2 bg-green-500 text-white rounded text-sm font-bold hover:bg-green-600 transition-colors"
          >
            📋 导出配置到控制台
          </button>

          {/* 使用说明 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-xs font-bold text-blue-900 mb-1">💡 使用提示</h4>
            <ul className="text-xs text-blue-800 space-y-0.5">
              <li>• 实时调整参数，立即生效</li>
              <li>• 尝试"卡通增强"预设获得接近MMD的效果</li>
              <li>• 调整"高光强度"和"高光颜色"增强光泽感</li>
              <li>• 导出配置保存到代码</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 切换按钮（面板关闭时显示） */}
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className={`fixed top-4 ${position === 'right' ? 'right-4' : 'left-4'} z-[9999] px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 text-sm transition-colors`}
          aria-label="打开调试面板"
        >
          🎨 光照调试
        </button>
      )}
    </>
  );
};

MMDLightingDebugPanel.displayName = 'MMDLightingDebugPanel';

export default MMDLightingDebugPanel;

