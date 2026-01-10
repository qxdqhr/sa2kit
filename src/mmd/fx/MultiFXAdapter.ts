/**
 * 多FX文件适配器
 * 支持同时应用多个FX效果文件
 */

import * as THREE from 'three';
import { FXParser } from './FXParser';
import { FXToThreeAdapter } from './FXToThreeAdapter';
import type { FXEffect } from './types';
import type { ThreeMaterialConfig, ThreeRenderConfig } from './FXToThreeAdapter';

/**
 * 效果文件类型
 */
export type EffectFileType = 'fx' | 'x' | 'auto';

/**
 * FX文件配置
 */
export interface FXFileConfig {
  /** FX/X文件路径 */
  path: string;
  /** 纹理基础路径 */
  texturePath?: string;
  /** 文件类型 */
  type?: EffectFileType;
  /** 
   * 优先级 (数字越大优先级越高，默认0)
   * - .x文件建议设置为低优先级（如-10），作为基础效果
   * - .fx文件建议设置为高优先级（如10），作为细节效果
   */
  priority?: number;
  /** 
   * 应用目标 
   * - 'all': 应用到所有对象
   * - 'model': 仅应用到模型
   * - 'stage': 仅应用到舞台
   * - 'scene': 仅应用场景配置（光照、阴影等）
   * - string[]: 应用到指定名称的对象
   */
  target?: 'all' | 'model' | 'stage' | 'scene' | string[];
  /** 是否启用 */
  enabled?: boolean;
  /** 描述（用于调试） */
  description?: string;
  /** 是否转换为GLSL并使用ShaderMaterial */
  useShaderMaterial?: boolean;
  /** 顶点着色器函数名（用于GLSL转换） */
  vertexShaderFunction?: string;
  /** 片段着色器函数名（用于GLSL转换） */
  fragmentShaderFunction?: string;
}

/**
 * 多FX合并策略
 */
export type FXMergeStrategy = 
  | 'override'      // 覆盖模式：高优先级完全覆盖低优先级
  | 'merge'         // 合并模式：智能合并参数
  | 'additive';     // 叠加模式：数值参数叠加

/**
 * 多FX适配器配置
 */
export interface MultiFXAdapterOptions {
  /** 合并策略 */
  mergeStrategy?: FXMergeStrategy;
  /** 是否自动加载纹理 */
  autoLoadTextures?: boolean;
}

/**
 * 多FX文件适配器
 * 支持同时加载和应用多个FX效果文件
 */
export class MultiFXAdapter {
  private effects: Map<string, FXEffect> = new Map();
  private adapters: Map<string, FXToThreeAdapter> = new Map();
  private configs: FXFileConfig[] = [];
  private options: Required<MultiFXAdapterOptions>;
  private parser: FXParser;

  constructor(options: MultiFXAdapterOptions = {}) {
    this.options = {
      mergeStrategy: options.mergeStrategy || 'override',
      autoLoadTextures: options.autoLoadTextures ?? true,
    };
    this.parser = new FXParser();
  }

  /**
   * 识别文件类型
   */
  private detectFileType(path: string, configType?: EffectFileType): EffectFileType {
    if (configType && configType !== 'auto') {
      return configType;
    }
    
    const ext = path.toLowerCase().split('.').pop();
    if (ext === 'x') return 'x';
    if (ext === 'fx') return 'fx';
    
    return 'fx'; // 默认为fx
  }

  /**
   * 添加效果文件（支持.fx和.x）
   */
  async addFX(config: FXFileConfig): Promise<void> {
    if (!config.enabled && config.enabled !== undefined) {
      console.log('[MultiFXAdapter] Effect disabled:', config.path);
      return;
    }

    try {
      const fileType = this.detectFileType(config.path, config.type);
      const desc = config.description || config.path;
      
      console.log('[MultiFXAdapter] Loading ' + (fileType.toUpperCase()) + ' file:', desc);
      
      // 解析效果文件（.fx和.x都可以用FXParser解析）
      const effect = await this.parser.loadAndParse(config.path);
      this.effects.set(config.path, effect);
      
      // 创建适配器
      const adapter = new FXToThreeAdapter(effect, config.texturePath || '');
      this.adapters.set(config.path, adapter);
      
      // 加载纹理
      if (this.options.autoLoadTextures) {
        console.log('[MultiFXAdapter] Loading textures for ' + (fileType) + ':', desc);
        await adapter.loadTextures();
      }
      
      // 保存配置，设置默认值
      const defaultPriority = fileType === 'x' ? -10 : 0; // .x文件默认低优先级（基础效果）
      const defaultTarget = fileType === 'x' ? 'all' : 'model'; // .x应用到全部，.fx应用到模型
      
      this.configs.push({
        ...config,
        type: fileType,
        priority: config.priority ?? defaultPriority,
        target: config.target ?? defaultTarget,
        enabled: true,
      });
      
      // 按优先级排序（.x先应用，.fx后应用）
      this.configs.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      
      const lastConfig = this.configs[this.configs.length - 1];
      console.log('[MultiFXAdapter] ' + (fileType.toUpperCase()) + ' loaded successfully:', desc);
      console.log('[MultiFXAdapter]   - Priority: ' + (lastConfig?.priority ?? 0));
      console.log('[MultiFXAdapter]   - Target: ' + (lastConfig?.target ?? 'all'));
    } catch (error) {
      console.error('[MultiFXAdapter] Failed to load effect file:', config.path, error);
      throw error;
    }
  }

  /**
   * 批量添加FX文件
   */
  async addMultipleFX(configs: FXFileConfig[]): Promise<void> {
    await Promise.all(configs.map(config => this.addFX(config)));
  }

  /**
   * 移除FX文件
   */
  removeFX(path: string): void {
    this.effects.delete(path);
    this.adapters.delete(path);
    this.configs = this.configs.filter(c => c.path !== path);
  }

  /**
   * 清空所有FX
   */
  clear(): void {
    this.effects.clear();
    this.adapters.clear();
    this.configs = [];
  }

  /**
   * 合并材质配置
   */
  extractMergedMaterialConfig(target?: string): ThreeMaterialConfig {
    const merged: ThreeMaterialConfig = {
      uniforms: {},
    };

    console.log('[MultiFXAdapter] Extracting material config for target:', target);
    console.log('[MultiFXAdapter] Total configs:', this.configs.length);

    // 按优先级顺序应用
    this.configs.forEach(config => {
      // 检查目标匹配
      let shouldApply = false;
      if (!target || config.target === 'all') {
        shouldApply = true;
      } else if (Array.isArray(config.target)) {
        shouldApply = config.target.includes(target);
      } else {
        shouldApply = config.target === target;
      }
      
      if (!shouldApply) {
        console.log('[MultiFXAdapter]   - Skipping ' + (config.description || config.path) + ' (target mismatch: ' + (config.target) + ' !== ' + (target) + ')');
        return;
      }

      const adapter = this.adapters.get(config.path);
      if (!adapter) {
        console.log('[MultiFXAdapter]   - Skipping ' + (config.description || config.path) + ' (adapter not found)');
        return;
      }

      console.log('[MultiFXAdapter]   ✅ Applying ' + (config.description || config.path) + ' (priority: ' + (config.priority) + ')');
      const materialConfig = adapter.extractMaterialConfig();

      // 根据合并策略应用
      switch (this.options.mergeStrategy) {
        case 'override':
          // 覆盖模式：直接覆盖
          if (materialConfig.color) merged.color = materialConfig.color;
          if (materialConfig.emissive) merged.emissive = materialConfig.emissive;
          if (materialConfig.specular) merged.specular = materialConfig.specular;
          if (materialConfig.shininess !== undefined) merged.shininess = materialConfig.shininess;
          if (materialConfig.opacity !== undefined) merged.opacity = materialConfig.opacity;
          if (materialConfig.transparent !== undefined) merged.transparent = materialConfig.transparent;
          if (materialConfig.uniforms && merged.uniforms) {
            Object.assign(merged.uniforms, materialConfig.uniforms);
          }
          break;

        case 'merge':
          // 合并模式：智能合并
          merged.color = materialConfig.color || merged.color;
          merged.emissive = materialConfig.emissive || merged.emissive;
          merged.specular = materialConfig.specular || merged.specular;
          merged.shininess = materialConfig.shininess ?? merged.shininess;
          merged.opacity = materialConfig.opacity ?? merged.opacity;
          merged.transparent = materialConfig.transparent ?? merged.transparent;
          if (materialConfig.uniforms && merged.uniforms) {
            Object.assign(merged.uniforms, materialConfig.uniforms);
          }
          break;

        case 'additive':
          // 叠加模式：数值参数叠加
          if (materialConfig.color && merged.color) {
            merged.color.add(materialConfig.color);
          } else {
            merged.color = materialConfig.color;
          }
          if (materialConfig.emissive && merged.emissive) {
            merged.emissive.add(materialConfig.emissive);
          } else {
            merged.emissive = materialConfig.emissive;
          }
          // shininess等数值叠加
          if (materialConfig.shininess !== undefined) {
            merged.shininess = (merged.shininess ?? 0) + materialConfig.shininess;
          }
          if (materialConfig.uniforms && merged.uniforms) {
            Object.assign(merged.uniforms, materialConfig.uniforms);
          }
          break;
      }
    });

    return merged;
  }

  /**
   * 合并渲染配置
   */
  extractMergedRenderConfig(): ThreeRenderConfig {
    const merged: ThreeRenderConfig = {};

    console.log('[MultiFXAdapter] Extracting merged render config from', this.configs.length, 'configs');

    // 按优先级顺序应用
    this.configs.forEach(config => {
      const adapter = this.adapters.get(config.path);
      if (!adapter) return;

      const renderConfig = adapter.extractRenderConfig();
      
      console.log('[MultiFXAdapter]   Processing ' + (config.description || config.path) + ':');
      console.log('    - enableShadow:', renderConfig.enableShadow);
      console.log('    - shadowMapSize:', renderConfig.shadowMapSize);
      console.log('    - toneMapping:', renderConfig.toneMapping);

      // 合并配置（高优先级覆盖）
      if (renderConfig.enableShadow !== undefined) {
        merged.enableShadow = renderConfig.enableShadow;
      }
      if (renderConfig.shadowMapSize !== undefined) {
        merged.shadowMapSize = renderConfig.shadowMapSize;
      }
      if (renderConfig.ambientLightIntensity !== undefined) {
        merged.ambientLightIntensity = renderConfig.ambientLightIntensity;
      }
      if (renderConfig.directionalLightIntensity !== undefined) {
        merged.directionalLightIntensity = renderConfig.directionalLightIntensity;
      }
      if (renderConfig.lightDirection) {
        merged.lightDirection = renderConfig.lightDirection;
      }
      if (renderConfig.toneMapping !== undefined) {
        merged.toneMapping = renderConfig.toneMapping;
        console.log(`[MultiFXAdapter]     ✅ ToneMapping set to:`, renderConfig.toneMapping === THREE.NoToneMapping ? 'NoToneMapping (Toon)' : 'ACESFilmicToneMapping');
      }
      if (renderConfig.toneMappingExposure !== undefined) {
        merged.toneMappingExposure = renderConfig.toneMappingExposure;
      }
    });

    console.log('[MultiFXAdapter] Final merged render config:', merged);
    return merged;
  }

  /**
   * 应用到Three.js材质
   * 支持MeshPhongMaterial和MeshToonMaterial（MMD常用）
   */
  applyToMaterial(material: THREE.Material, target?: string): void {
    if (!(material instanceof THREE.MeshPhongMaterial || material instanceof THREE.MeshToonMaterial)) {
      console.warn('[MultiFXAdapter] Material type not supported:', material.type);
      return;
    }
    
    console.log('[MultiFXAdapter] Applying to material type:', material.type);

    const config = this.extractMergedMaterialConfig(target);
    
    // 🔍 调试：打印提取的配置
    console.log('[MultiFXAdapter] Extracted material config for target:', target);
    console.log('  - color:', config.color);
    console.log('  - emissive:', config.emissive);
    console.log('  - specular:', config.specular);
    console.log('  - shininess:', config.shininess);

    let applied = false;
    
    // 🎯 应用颜色（跳过纯黑色，避免覆盖原有材质）
    if (config.color) {
      const isBlack = config.color.r === 0 && config.color.g === 0 && config.color.b === 0;
      if (!isBlack) {
        material.color.copy(config.color);
        applied = true;
      } else {
        console.log('[MultiFXAdapter] Skipping black color (0,0,0) to preserve original material');
      }
    }
    
    // 🎯 应用发光颜色（跳过纯黑色）
    if (config.emissive && (material as any).emissive) {
      const isBlack = config.emissive.r === 0 && config.emissive.g === 0 && config.emissive.b === 0;
      if (!isBlack) {
        (material as any).emissive.copy(config.emissive);
        applied = true;
      }
    }
    
    // 应用高光（仅MeshPhongMaterial有specular）
    if (config.specular && (material as any).specular) {
      (material as any).specular.copy(config.specular);
      applied = true;
      console.log('[MultiFXAdapter] Applied specular');
    }
    
    // 应用光泽度（仅MeshPhongMaterial有shininess）
    if (config.shininess !== undefined && (material as any).shininess !== undefined) {
      (material as any).shininess = config.shininess;
      applied = true;
      console.log('[MultiFXAdapter] Applied shininess:', config.shininess);
    }
    
    if (config.opacity !== undefined) {
      material.opacity = config.opacity;
      applied = true;
    }
    
    if (config.transparent !== undefined) {
      material.transparent = config.transparent;
      applied = true;
    }

    if (applied) {
      console.log('[MultiFXAdapter] ✅ Material config applied to:', target || 'default');
    } else {
      console.warn('[MultiFXAdapter] ⚠️ No material config to apply (all values are undefined)');
    }
  }

  /**
   * 创建ShaderMaterial（如果配置了useShaderMaterial）
   * 返回第一个匹配target的ShaderMaterial，如果没有则返回null
   */
  createShaderMaterial(target?: string): THREE.ShaderMaterial | null {
    // 找到第一个启用了ShaderMaterial且匹配target的配置
    const shaderConfig = this.configs.find(config => {
      if (!config.useShaderMaterial) return false;
      
      // 检查target匹配
      if (!target || config.target === 'all') return true;
      if (Array.isArray(config.target)) return config.target.includes(target);
      return config.target === target;
    });

    if (!shaderConfig) {
      console.log('[MultiFXAdapter] No shader material config found for target: ' + (target));
      return null;
    }

    const adapter = this.adapters.get(shaderConfig.path);
    if (!adapter) {
      console.warn('[MultiFXAdapter] Adapter not found for: ' + (shaderConfig.path));
      return null;
    }

    const material = adapter.createShaderMaterial();
    if (material) {
      console.log('[MultiFXAdapter] ✅ Created ShaderMaterial for target: ' + (target) + ' from ' + (shaderConfig.description || shaderConfig.path));
    }

    return material;
  }

  /**
   * 应用到Three.js场景
   */
  applyToScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    const renderConfig = this.extractMergedRenderConfig();
    
    // 🔍 调试：打印渲染配置
    console.log('[MultiFXAdapter] Applying render config:');
    console.log('  - enableShadow:', renderConfig.enableShadow);
    console.log('  - shadowMapSize:', renderConfig.shadowMapSize);
    console.log('  - toneMapping:', renderConfig.toneMapping);
    console.log('  - ambientLightIntensity:', renderConfig.ambientLightIntensity);
    console.log('  - directionalLightIntensity:', renderConfig.directionalLightIntensity);

    // 配置阴影
    if (renderConfig.enableShadow !== undefined) {
      renderer.shadowMap.enabled = renderConfig.enableShadow;
      if (renderConfig.enableShadow) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      console.log('[MultiFXAdapter] ✅ Shadow config applied:', renderConfig.enableShadow);
    }

    // 配置色调映射
    if (renderConfig.toneMapping !== undefined) {
      renderer.toneMapping = renderConfig.toneMapping;
      const toneMappingName = renderConfig.toneMapping === THREE.NoToneMapping ? 'NoToneMapping' : 'ACESFilmicToneMapping';
      console.log('[MultiFXAdapter] ✅ ToneMapping applied:', toneMappingName);
    }
    if (renderConfig.toneMappingExposure !== undefined) {
      renderer.toneMappingExposure = renderConfig.toneMappingExposure;
    }

    // 🎯 更新现有光源（不添加新光源）
    let ambientLight = scene.children.find(obj => obj instanceof THREE.AmbientLight) as THREE.AmbientLight;
    let directionalLight = scene.children.find(obj => obj instanceof THREE.DirectionalLight) as THREE.DirectionalLight;

    console.log('[MultiFXAdapter] Found lights in scene:', {
      ambientLight: !!ambientLight,
      directionalLight: !!directionalLight,
    });

    if (renderConfig.ambientLightIntensity !== undefined && ambientLight) {
      console.log('[MultiFXAdapter] Updating ambient light intensity:', renderConfig.ambientLightIntensity);
      ambientLight.intensity = renderConfig.ambientLightIntensity;
    }

    if (renderConfig.directionalLightIntensity !== undefined && directionalLight) {
      console.log('[MultiFXAdapter] Updating directional light intensity:', renderConfig.directionalLightIntensity);
      directionalLight.intensity = renderConfig.directionalLightIntensity;
    }

    if (renderConfig.lightDirection && directionalLight) {
      directionalLight.position.copy(renderConfig.lightDirection).multiplyScalar(10);
      console.log('[MultiFXAdapter] Updated light direction');
    }

    if (renderConfig.shadowMapSize && directionalLight?.shadow) {
      directionalLight.shadow.mapSize.width = renderConfig.shadowMapSize;
      directionalLight.shadow.mapSize.height = renderConfig.shadowMapSize;
      console.log('[MultiFXAdapter] Updated shadow map size:', renderConfig.shadowMapSize);
    }

    console.log('[MultiFXAdapter] ✅ Scene config applied');
  }

  /**
   * 获取所有已加载的FX效果
   */
  getLoadedEffects(): FXEffect[] {
    return Array.from(this.effects.values());
  }

  /**
   * 获取配置摘要
   */
  getSummary(): {
    totalFX: number;
    enabledFX: number;
    xFiles: number;  // .x文件数量（场景级）
    fxFiles: number; // .fx文件数量（模型级）
    configs: Array<{
      path: string;
      type: EffectFileType;
      priority: number;
      target: string | string[];
      features: string[];
      description?: string;
    }>;
  } {
    const xCount = this.configs.filter(c => c.type === 'x').length;
    const fxCount = this.configs.filter(c => c.type === 'fx').length;
    
    return {
      totalFX: this.effects.size,
      enabledFX: this.configs.length,
      xFiles: xCount,
      fxFiles: fxCount,
      configs: this.configs.map(config => {
        const adapter = this.adapters.get(config.path);
        const summary = adapter?.getSummary();
        
        return {
          path: config.path,
          type: config.type ?? 'fx',
          priority: config.priority ?? 0,
          target: config.target ?? 'all',
          features: summary?.renderFeatures || [],
          description: config.description,
        };
      }),
    };
  }

  /**
   * 获取指定类型的配置
   */
  getConfigsByType(type: EffectFileType): FXFileConfig[] {
    return this.configs.filter(c => c.type === type);
  }

  /**
   * 获取场景级效果（.x文件）
   */
  getSceneEffects(): FXFileConfig[] {
    return this.getConfigsByType('x');
  }

  /**
   * 获取模型级效果（.fx文件）
   */
  getModelEffects(): FXFileConfig[] {
    return this.getConfigsByType('fx');
  }

  /**
   * 获取合并后的Uniforms
   */
  getMergedUniforms(target?: string): Record<string, { value: any }> {
    const merged: Record<string, { value: any }> = {};

    this.configs.forEach(config => {
      // 检查目标匹配
      if (target && config.target !== 'all') {
        if (Array.isArray(config.target)) {
          if (!config.target.includes(target)) return;
        } else if (config.target !== target) {
          return;
        }
      }

      const adapter = this.adapters.get(config.path);
      if (!adapter) return;

      const uniforms = adapter.getUniforms();
      Object.assign(merged, uniforms);
    });

    return merged;
  }

  /**
   * 分层应用到场景对象
   * @param scene Three.js场景
   * @param renderer Three.js渲染器
   * @param modelMeshes 模型网格数组（可选，用于精确控制）
   * @param stageMeshes 舞台网格数组（可选，用于精确控制）
   */
  applyLayered(
    scene: THREE.Scene, 
    renderer: THREE.WebGLRenderer,
    modelMeshes?: THREE.Object3D[],
    stageMeshes?: THREE.Object3D[]
  ): void {
    console.log('[MultiFXAdapter] Applying layered effects...');
    
    // 第一层：应用.x文件到整个场景
    const sceneEffects = this.getSceneEffects();
    console.log('[MultiFXAdapter] Applying ' + (sceneEffects.length) + ' scene-level effects (.x files)');
    
    sceneEffects.forEach(config => {
      const adapter = this.adapters.get(config.path);
      if (adapter) {
        console.log('[MultiFXAdapter]   - Applying: ' + (config.description || config.path));
        
        // 应用渲染器配置（不添加光源）
        const renderConfig = adapter.extractRenderConfig();
        if (renderConfig.toneMapping !== undefined) {
          renderer.toneMapping = renderConfig.toneMapping;
        }
        if (renderConfig.toneMappingExposure !== undefined) {
          renderer.toneMappingExposure = renderConfig.toneMappingExposure;
        }
        if (renderConfig.enableShadow !== undefined) {
          renderer.shadowMap.enabled = renderConfig.enableShadow;
        }
        
        // .x文件应用到所有对象
        scene.traverse(obj => {
          if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshPhongMaterial) {
            this.applyToMaterial(obj.material, 'scene');
          }
        });
      }
    });
    
    // 第二层：应用.fx文件到模型
    const modelEffects = this.getModelEffects();
    console.log('[MultiFXAdapter] Applying ' + (modelEffects.length) + ' model-level effects (.fx files)');
    
    modelEffects.forEach(config => {
      console.log('[MultiFXAdapter]   - Applying: ' + (config.description || config.path));
      
      // 如果提供了具体的模型网格列表
      if (modelMeshes) {
        modelMeshes.forEach(mesh => {
          if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshPhongMaterial) {
            this.applyToMaterial(mesh.material, 'model');
          }
          mesh.traverse(obj => {
            if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshPhongMaterial) {
              this.applyToMaterial(obj.material, 'model');
            }
          });
        });
      } else {
        // 否则根据target配置应用
        const targetStr = typeof config.target === 'string' ? config.target : 'model';
        scene.traverse(obj => {
          if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshPhongMaterial) {
            // 简单的启发式判断：有骨骼的是模型
            const isModel = (obj as any).isSkinnedMesh || (obj as any).skeleton;
            if ((targetStr === 'model' && isModel) || targetStr === 'all') {
              this.applyToMaterial(obj.material, targetStr);
            }
          }
        });
      }
    });
    
    console.log('[MultiFXAdapter] Layered effects applied successfully');
  }

  /**
   * 打印当前配置（调试用）
   */
  printConfig(): void {
    console.log('\n[MultiFXAdapter] Current Configuration:');
    console.log('═'.repeat(60));
    
    const summary = this.getSummary();
    console.log('Total Effects: ' + (summary.totalFX));
    console.log('  - Scene-level (.x): ' + (summary.xFiles));
    console.log('  - Model-level (.fx): ' + (summary.fxFiles));
    console.log('\nLoad Order (by priority):');
    
    summary.configs.forEach((config, index) => {
      const icon = config.type === 'x' ? '🌍' : '🎨';
      console.log((index + 1) + '. ' + (icon) + ' [' + (config.type.toUpperCase()) + '] ' + (config.description || config.path));
      console.log('   Priority: ' + (config.priority) + ', Target: ' + (config.target));
      if (config.features.length > 0) {
        console.log('   Features: ' + (config.features.join(', ')));
      }
    });
    
    console.log('═'.repeat(60) + '\n');
  }
}

