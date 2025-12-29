/**
 * FX到Three.js适配器
 * 将解析的FX文件参数应用到Three.js渲染中
 */

import * as THREE from 'three';
import type { FXEffect, FXParameter, FXTexture } from './types';

/**
 * Three.js材质配置
 */
export interface ThreeMaterialConfig {
  /** 基础颜色 */
  color?: THREE.Color;
  /** 发光颜色 */
  emissive?: THREE.Color;
  /** 高光颜色 */
  specular?: THREE.Color;
  /** 光泽度 */
  shininess?: number;
  /** 透明度 */
  opacity?: number;
  /** 是否透明 */
  transparent?: boolean;
  /** 纹理贴图 */
  map?: THREE.Texture | null;
  /** 法线贴图 */
  normalMap?: THREE.Texture | null;
  /** 环境贴图 */
  envMap?: THREE.Texture | null;
  /** 自定义uniforms */
  uniforms?: Record<string, { value: any }>;
}

/**
 * Three.js渲染配置
 */
export interface ThreeRenderConfig {
  /** 是否启用阴影 */
  enableShadow?: boolean;
  /** 阴影贴图尺寸 */
  shadowMapSize?: number;
  /** 环境光强度 */
  ambientLightIntensity?: number;
  /** 方向光强度 */
  directionalLightIntensity?: number;
  /** 方向光方向 */
  lightDirection?: THREE.Vector3;
  /** 色调映射 */
  toneMapping?: THREE.ToneMapping;
  /** 曝光度 */
  toneMappingExposure?: number;
}

/**
 * FX到Three.js适配器
 */
export class FXToThreeAdapter {
  private effect: FXEffect;
  private textureLoader: THREE.TextureLoader;
  private loadedTextures: Map<string, THREE.Texture>;
  private basePath: string;

  constructor(effect: FXEffect, basePath: string = '') {
    this.effect = effect;
    this.basePath = basePath;
    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = new Map();
  }

  /**
   * 创建ShaderMaterial（如果有GLSL shader）
   */
  createShaderMaterial(): THREE.ShaderMaterial | null {
    if (!this.effect.glslShaders?.vertexShader || !this.effect.glslShaders?.fragmentShader) {
      console.warn('[FXToThreeAdapter] No GLSL shaders available. Use convertToGLSL option in FXParser.');
      return null;
    }

    const vs = this.effect.glslShaders.vertexShader;
    const fs = this.effect.glslShaders.fragmentShader;

    // 收集所有uniforms
    const uniforms: Record<string, THREE.IUniform> = {};

    // 从顶点着色器添加uniforms
    vs.uniforms.forEach((info, name) => {
      uniforms[name] = { value: this.getDefaultUniformValue(info.glslType) };
    });

    // 从片段着色器添加uniforms
    fs.uniforms.forEach((info, name) => {
      if (!uniforms[name]) {
        uniforms[name] = { value: this.getDefaultUniformValue(info.glslType) };
      }
    });

    // 添加常用的Three.js uniforms
    uniforms.modelMatrix = { value: new THREE.Matrix4() };
    uniforms.viewMatrix = { value: new THREE.Matrix4() };
    uniforms.projectionMatrix = { value: new THREE.Matrix4() };
    uniforms.normalMatrix = { value: new THREE.Matrix3() };
    uniforms.cameraPosition = { value: new THREE.Vector3() };

    const material = new THREE.ShaderMaterial({
      vertexShader: vs.code,
      fragmentShader: fs.code,
      uniforms,
    });

    console.log('[FXToThreeAdapter] Created ShaderMaterial with', Object.keys(uniforms).length, 'uniforms');
    console.log('[FXToThreeAdapter] Conversion warnings:', this.effect.glslShaders.warnings);

    return material;
  }

  /**
   * 获取uniform的默认值
   */
  private getDefaultUniformValue(glslType: string): any {
    switch (glslType) {
      case 'float':
        return 0.0;
      case 'vec2':
        return new THREE.Vector2(0, 0);
      case 'vec3':
        return new THREE.Vector3(0, 0, 0);
      case 'vec4':
        return new THREE.Vector4(0, 0, 0, 0);
      case 'mat3':
        return new THREE.Matrix3();
      case 'mat4':
        return new THREE.Matrix4();
      case 'sampler2D':
        return null;
      case 'samplerCube':
        return null;
      default:
        return null;
    }
  }

  /**
   * 提取材质配置
   */
  extractMaterialConfig(): ThreeMaterialConfig {
    const config: ThreeMaterialConfig = {
      uniforms: {},
    };

    console.log('[FXToThreeAdapter] Extracting material config from FX:', this.effect.fileName);
    console.log('[FXToThreeAdapter] Total parameters:', this.effect.parameters.length);

    // 提取颜色参数
    this.effect.parameters.forEach(param => {
      const name = param.name.toLowerCase();
      
      // 🎯 跳过增量参数（Add开头的参数是增量值，不是绝对值）
      if (name.startsWith('add')) {
        console.log(`[FXToThreeAdapter]   Skipping additive param "${param.name}" (not an absolute value)`);
        return;
      }
      
      // 材质颜色
      if (name.includes('materialrgb') || name.includes('material')) {
        const colorValue = this.parseFloat3(param.defaultValue);
        if (colorValue) {
          config.color = new THREE.Color(
            colorValue[0],
            colorValue[1],
            colorValue[2]
          );
          console.log(`[FXToThreeAdapter]   Found color param "${param.name}":`, colorValue);
        }
      }

      // 发光颜色
      if (name.includes('emissive')) {
        const emissiveValue = this.parseFloat3(param.defaultValue);
        if (emissiveValue) {
          config.emissive = new THREE.Color(
            emissiveValue[0],
            emissiveValue[1],
            emissiveValue[2]
          );
          console.log(`[FXToThreeAdapter]   Found emissive param "${param.name}":`, emissiveValue);
        }
      }

      // 高光颜色
      if (name.includes('specular')) {
        const specularValue = this.parseFloat3(param.defaultValue);
        if (specularValue) {
          config.specular = new THREE.Color(
            specularValue[0],
            specularValue[1],
            specularValue[2]
          );
          console.log(`[FXToThreeAdapter]   Found specular param "${param.name}":`, specularValue);
        }
      }

      // 光泽度
      if (name.includes('shininess') || name.includes('specularpower')) {
        const shininessValue = this.parseFloat(param.defaultValue);
        if (shininessValue !== null) {
          config.shininess = shininessValue;
          console.log(`[FXToThreeAdapter]   Found shininess param "${param.name}":`, shininessValue);
        }
      }

      // 添加到uniforms
      if (config.uniforms && param.defaultValue) {
        config.uniforms[param.name] = {
          value: this.parseParameterValue(param),
        };
      }
    });

    console.log('[FXToThreeAdapter] Final material config:', {
      color: config.color,
      emissive: config.emissive,
      specular: config.specular,
      shininess: config.shininess,
    });

    return config;
  }

  /**
   * 提取渲染配置
   */
  extractRenderConfig(): ThreeRenderConfig {
    const config: ThreeRenderConfig = {};

    // 检查阴影功能
    const hasLocalShadow = this.effect.defines.some(
      d => d.name === 'USE_LOCALSHADOW' && !d.isCommented
    );
    const hasExcellentShadow = this.effect.defines.some(
      d => d.name === 'USE_EXCELLENTSHADOW' && !d.isCommented
    );
    const hasHgShadow = this.effect.defines.some(
      d => d.name === 'USE_HGSHADOW' && !d.isCommented
    );

    config.enableShadow = hasLocalShadow || hasExcellentShadow || hasHgShadow;

    // 阴影贴图尺寸
    const shadowMapSizeDefine = this.effect.defines.find(
      d => d.name === 'LS_ShadowMapBuffSize'
    );
    if (shadowMapSizeDefine?.value) {
      config.shadowMapSize = parseInt(shadowMapSizeDefine.value, 10);
    }

    // 光源方向
    const lightDirDefine = this.effect.defines.find(
      d => d.name === 'LS_InitDirection'
    );
    if (lightDirDefine?.value) {
      const dir = this.parseFloat3(lightDirDefine.value);
      if (dir) {
        config.lightDirection = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
      }
    }

    // 🎯 不设置默认光照强度，让stage配置生效
    // 只有FX文件明确定义了光照参数时才设置
    // config.ambientLightIntensity = 0.5;
    // config.directionalLightIntensity = 0.8;

    // 色调映射（卡通渲染通常不使用）
    const hasToon = this.effect.defines.some(
      d => d.name === 'MODEL_TOON' && !d.isCommented
    );
    config.toneMapping = hasToon ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    config.toneMappingExposure = 1.0;

    console.log('[FXToThreeAdapter] Extracted render config:', config);

    return config;
  }

  /**
   * 加载纹理
   */
  async loadTextures(): Promise<Map<string, THREE.Texture>> {
    const promises = this.effect.textures.map(async (fxTexture) => {
      const path = this.basePath ? `${this.basePath}/${fxTexture.path}` : fxTexture.path;
      
      try {
        const texture = await this.loadTexture(path);
        this.loadedTextures.set(fxTexture.name, texture);
        return { name: fxTexture.name, texture };
      } catch (error) {
        console.warn(`Failed to load texture ${fxTexture.name}:`, error);
        return null;
      }
    });

    await Promise.all(promises);
    return this.loadedTextures;
  }

  /**
   * 加载单个纹理
   */
  private loadTexture(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          // 设置纹理参数
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * 创建Three.js材质
   */
  createMaterial(): THREE.MeshPhongMaterial {
    const config = this.extractMaterialConfig();

    const material = new THREE.MeshPhongMaterial({
      color: config.color || 0xffffff,
      emissive: config.emissive || 0x000000,
      specular: config.specular || 0x111111,
      shininess: config.shininess ?? 30,
      transparent: config.transparent ?? false,
      opacity: config.opacity ?? 1.0,
    });

    // 应用纹理
    const diffuseTexture = this.getTextureByPurpose('diffuse');
    if (diffuseTexture) {
      material.map = diffuseTexture;
    }

    const normalTexture = this.getTextureByPurpose('normal');
    if (normalTexture) {
      material.normalMap = normalTexture;
    }

    return material;
  }

  /**
   * 获取指定用途的纹理
   */
  private getTextureByPurpose(purpose: string): THREE.Texture | null {
    const fxTexture = this.effect.textures.find(t => 
      t.purpose?.toLowerCase().includes(purpose.toLowerCase())
    );
    
    if (!fxTexture) return null;
    return this.loadedTextures.get(fxTexture.name) || null;
  }

  /**
   * 解析float3值
   */
  private parseFloat3(value?: string): [number, number, number] | null {
    if (!value) return null;
    
    const match = value.match(/float3\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (!match || !match[1] || !match[2] || !match[3]) return null;
    
    return [
      parseFloat(match[1]),
      parseFloat(match[2]),
      parseFloat(match[3]),
    ];
  }

  /**
   * 解析float值
   */
  private parseFloat(value?: string): number | null {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * 解析参数值
   */
  private parseParameterValue(param: FXParameter): any {
    if (!param.defaultValue) return null;

    switch (param.type) {
      case 'float':
        return this.parseFloat(param.defaultValue);
      
      case 'float2': {
        const match = param.defaultValue.match(/float2\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
        return (match && match[1] && match[2]) ? new THREE.Vector2(parseFloat(match[1]), parseFloat(match[2])) : null;
      }
      
      case 'float3': {
        const values = this.parseFloat3(param.defaultValue);
        return values ? new THREE.Vector3(values[0], values[1], values[2]) : null;
      }
      
      case 'float4': {
        const match = param.defaultValue.match(/float4\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
        if (match && match[1] && match[2] && match[3] && match[4]) {
          return new THREE.Vector4(
            parseFloat(match[1]),
            parseFloat(match[2]),
            parseFloat(match[3]),
            parseFloat(match[4])
          );
        }
        return null;
      }
      
      default:
        return param.defaultValue;
    }
  }

  /**
   * 获取所有自定义uniforms
   */
  getUniforms(): Record<string, { value: any }> {
    const uniforms: Record<string, { value: any }> = {};

    this.effect.parameters.forEach(param => {
      const value = this.parseParameterValue(param);
      if (value !== null) {
        uniforms[param.name] = { value };
      }
    });

    // 添加纹理uniforms
    this.loadedTextures.forEach((texture, name) => {
      uniforms[name] = { value: texture };
    });

    return uniforms;
  }

  /**
   * 生成配置摘要
   */
  getSummary(): {
    materialParams: string[];
    textures: string[];
    renderFeatures: string[];
  } {
    return {
      materialParams: this.effect.parameters.map(p => `${p.type} ${p.name}`),
      textures: this.effect.textures.map(t => t.path),
      renderFeatures: this.effect.defines
        .filter(d => !d.isCommented && (d.name.startsWith('USE_') || d.name.includes('SHADOW')))
        .map(d => d.name),
    };
  }
}

