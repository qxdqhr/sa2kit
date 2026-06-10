/**
 * MMD加载器优化配置
 * 用于获得接近MMD软件的渲染效果
 */

import * as THREE from 'three';

export interface MMDLoaderConfig {
  /** Toon纹理路径 */
  toonPath?: string;
  /** 资源基础路径 */
  resourcePath?: string;
  /** 启用渐变贴图（用于Toon材质） */
  enableGradientMap?: boolean;
  /** 高光强度 */
  shininess?: number;
  /** 高光颜色 */
  specularColor?: THREE.ColorRepresentation;
}

/**
 * 配置MMD材质以获得最佳渲染效果
 * 
 * 主要优化点：
 * 1. 为MeshToonMaterial添加渐变贴图（实现阶梯式明暗过渡）
 * 2. 调整高光参数（shininess, specular）
 * 3. 确保纹理使用正确的颜色空间
 * 4. 优化环境贴图（sphere texture）设置
 * 
 * @param mesh - MMD模型网格
 * @param config - 配置选项
 */
export function configureMaterialsForMMD(
  mesh: THREE.SkinnedMesh,
  config: MMDLoaderConfig = {}
) {
  const {
    enableGradientMap = true,
    shininess = 30,
    specularColor = 0x888888,
  } = config;

  let materialCount = 0;
  let toonMaterialCount = 0;
  let phongMaterialCount = 0;

  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

      materials.forEach((material) => {
        materialCount++;

        // 1. MeshToonMaterial 配置（MMD常用）
        if (material instanceof THREE.MeshToonMaterial) {
          toonMaterialCount++;

          // 设置高光强度
          (material as any).shininess = shininess;

          // 添加渐变贴图（5级阶梯）实现卡通风格的明暗过渡
          if (enableGradientMap && !material.gradientMap) {
            material.gradientMap = createGradientMap();
            material.needsUpdate = true;
          }
        }

        // 2. MeshPhongMaterial 配置
        if (material instanceof THREE.MeshPhongMaterial) {
          phongMaterialCount++;

          // 设置高光参数
          material.shininess = shininess;
          material.specular = new THREE.Color(specularColor);
        }

        // 3. 通用材质配置

        // 主纹理：确保使用sRGB颜色空间
        if (material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
        }

        // 环境贴图（Sphere texture）：设置正确的映射方式
        if (material.envMap) {
          // MMD的sphere map使用球形映射
          material.envMap.mapping = THREE.EquirectangularReflectionMapping;
        }

        // Toon贴图（如果存在）
        if ((material as any).gradientMap) {
          const toonMap = (material as any).gradientMap;
          toonMap.minFilter = THREE.NearestFilter;
          toonMap.magFilter = THREE.NearestFilter;
        }
      });
    }
  });

  console.log('[MMD Material Config] Processed ' + (materialCount) + ' materials (Toon: ' + (toonMaterialCount) + ', Phong: ' + (phongMaterialCount) + ')');
}

/**
 * 创建5级渐变贴图（用于Toon渲染）
 * 
 * MMD使用阶梯式的明暗过渡（cel shading），而不是平滑的渐变。
 * 这个函数创建一个5级的灰度渐变纹理，用于MeshToonMaterial的gradientMap。
 * 
 * @returns 渐变纹理
 */
function createGradientMap(): THREE.DataTexture {
  // 创建5个灰度级别（0-255）
  const colors = new Uint8Array(5);
  for (let c = 0; c < colors.length; c++) {
    colors[c] = (c / (colors.length - 1)) * 255;
  }

  // 创建1D纹理
  const gradientMap = new THREE.DataTexture(
    colors,
    colors.length,
    1,
    THREE.RedFormat
  );

  // 使用最近邻过滤，确保阶梯效果清晰
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;

  return gradientMap;
}

/**
 * 创建MMD风格的光照设置
 * 
 * MMD默认使用3点光照：
 * 1. 主光源（Key Light）：从左前上方照射，强度最高
 * 2. 补光（Fill Light）：从右侧照射，减少阴影过暗
 * 3. 环境光（Ambient Light）：提供基础亮度
 * 
 * @param scene - Three.js场景
 * @param options - 光照选项
 * @returns 光源对象
 */
export function createMMDLights(
  scene: THREE.Scene,
  options: {
    ambientIntensity?: number;
    mainIntensity?: number;
    fillIntensity?: number;
    enableShadow?: boolean;
  } = {}
) {
  const {
    ambientIntensity = 0.6,
    mainIntensity = 1.0,
    fillIntensity = 0.3,
    enableShadow = true,
  } = options;

  // 1. 环境光：提供基础亮度，避免完全黑暗
  const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
  scene.add(ambientLight);

  // 2. 主光源：从左前上方照射（MMD默认方向）
  const mainLight = new THREE.DirectionalLight(0xffffff, mainIntensity);
  mainLight.position.set(-1, 1, 1);
  mainLight.position.normalize().multiplyScalar(10);

  // 配置阴影
  if (enableShadow) {
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;

    // 配置阴影相机（正交投影）
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
  }

  scene.add(mainLight);

  // 3. 补光：从右侧照射，柔化阴影
  const fillLight = new THREE.DirectionalLight(0xffffff, fillIntensity);
  fillLight.position.set(1, 0.5, 0.5);
  fillLight.position.normalize().multiplyScalar(10);
  scene.add(fillLight);

  console.log('[MMD Lights] Created 3-point lighting setup (ambient, main, fill)');

  return {
    ambientLight,
    mainLight,
    fillLight,
  };
}

/**
 * 配置渲染器以获得MMD风格的渲染效果
 * 
 * 主要配置：
 * 1. 色调映射：使用线性或无色调映射（避免过度曝光）
 * 2. 颜色空间：sRGB（与MMD一致）
 * 3. 阴影：PCF软阴影
 * 
 * @param renderer - Three.js渲染器
 * @param options - 渲染器选项
 * @returns 配置后的渲染器
 */
export function configureRendererForMMD(
  renderer: THREE.WebGLRenderer,
  options: {
    toneMapping?: THREE.ToneMapping;
    toneMappingExposure?: number;
    enableShadow?: boolean;
  } = {}
) {
  const {
    toneMapping = THREE.LinearToneMapping,
    toneMappingExposure = 1.0,
    enableShadow = true,
  } = options;

  // 色调映射：使用线性映射，避免颜色过饱和
  renderer.toneMapping = toneMapping;
  renderer.toneMappingExposure = toneMappingExposure;

  // 颜色空间：sRGB（标准）
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // 阴影配置
  if (enableShadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影
  }

  console.log('[MMD Renderer] Configured for MMD-style rendering');
  console.log('  - Tone Mapping: ' + (toneMapping === THREE.LinearToneMapping ? 'Linear' : 'Custom'));
  console.log(`  - Color Space: sRGB`);
  console.log('  - Shadow: ' + (enableShadow ? 'Enabled (PCF Soft)' : 'Disabled'));

  return renderer;
}

/**
 * 生成Toon纹理（用于测试，如果没有原版toon01-10.bmp）
 * 
 * @param index - Toon纹理索引 (1-10)
 * @returns Canvas元素
 */
export function generateToonTexture(index: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;

  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);

  // index=1最亮, index=10最暗
  const brightness = 1 - (index - 1) / 9;

  gradient.addColorStop(0, 'rgb(' + (255 * brightness) + ', ' + (255 * brightness) + ', ' + (255 * brightness) + ')');
  gradient.addColorStop(1, 'rgb(' + (128 * brightness) + ', ' + (128 * brightness) + ', ' + (128 * brightness) + ')');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  return canvas;
}

/**
 * 批量生成所有Toon纹理（1-10）
 * 
 * @returns Toon纹理数组
 */
export function generateAllToonTextures(): THREE.CanvasTexture[] {
  const textures: THREE.CanvasTexture[] = [];

  for (let i = 1; i <= 10; i++) {
    const canvas = generateToonTexture(i);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textures.push(texture);
  }

  console.log('[MMD Toon] Generated 10 toon textures');

  return textures;
}







