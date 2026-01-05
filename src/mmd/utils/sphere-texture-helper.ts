/**
 * Sphere纹理辅助工具
 * 用于检查、诊断和修复MMD模型的sphere纹理问题
 */

import * as THREE from 'three';

/**
 * Sphere纹理诊断结果
 */
export interface SphereTextureDiagnostic {
  /** 检查的材质总数 */
  totalMaterials: number;
  /** 应该有sphere纹理的材质数（根据命名推测） */
  expectedSphere: number;
  /** 实际有sphere纹理的材质数 */
  actualSphere: number;
  /** 缺少sphere纹理的材质列表 */
  missingSphere: Array<{
    index: number;
    name: string;
    objectName: string;
  }>;
  /** 可能的sphere纹理文件列表 */
  possibleSphereFiles: string[];
}

/**
 * 检查模型是否缺少sphere纹理
 * 
 * @param mesh - MMD模型网格
 * @returns 诊断结果
 */
export function checkSphereTextures(mesh: THREE.SkinnedMesh): SphereTextureDiagnostic {
  const diagnostic: SphereTextureDiagnostic = {
    totalMaterials: 0,
    expectedSphere: 0,
    actualSphere: 0,
    missingSphere: [],
    possibleSphereFiles: [],
  };
  
  let materialIndex = 0;
  
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      
      materials.forEach((mat) => {
        diagnostic.totalMaterials++;
        
        // 检查是否有envMap（sphere纹理）
        if (mat.envMap) {
          diagnostic.actualSphere++;
        }
        
        // 根据材质名称推测是否应该有sphere纹理
        const materialName = mat.name || '';
        const shouldHaveSphere = 
          materialName.includes('hair') ||
          materialName.includes('Hair') ||
          materialName.includes('髪') ||
          materialName.includes('kami') ||
          materialName.includes('eye') ||
          materialName.includes('Eye') ||
          materialName.includes('瞳') ||
          materialName.includes('metal') ||
          materialName.includes('Metal') ||
          materialName.includes('金属');
        
        if (shouldHaveSphere) {
          diagnostic.expectedSphere++;
          
          if (!mat.envMap) {
            diagnostic.missingSphere.push({
              index: materialIndex,
              name: materialName,
              objectName: obj.name || 'unnamed',
            });
          }
        }
        
        materialIndex++;
      });
    }
  });
  
  return diagnostic;
}

/**
 * 打印sphere纹理诊断报告
 * 
 * @param diagnostic - 诊断结果
 */
export function printSphereDiagnostic(diagnostic: SphereTextureDiagnostic): void {
  console.log('\n🔮 Sphere纹理诊断');
  console.log('='.repeat(60));
  
  console.log(`\n📊 统计:`);
  console.log(`  总材质数: ${diagnostic.totalMaterials}`);
  console.log(`  预期有sphere纹理: ${diagnostic.expectedSphere}`);
  console.log(`  实际有sphere纹理: ${diagnostic.actualSphere} ${diagnostic.actualSphere > 0 ? '✅' : '❌'}`);
  
  if (diagnostic.missingSphere.length > 0) {
    console.log(`\n⚠️ 缺少sphere纹理的材质 (${diagnostic.missingSphere.length}个):`);
    diagnostic.missingSphere.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.index}] ${item.name} (对象: ${item.objectName})`);
    });
  } else {
    console.log('\n✅ 所有预期的材质都有sphere纹理');
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * 为材质添加默认的sphere纹理（临时方案）
 * 
 * 注意：这只是临时方案，最好的方法是使用模型自带的sphere纹理文件
 * 
 * @param mesh - MMD模型网格
 * @param sphereTextureUrl - Sphere纹理URL（可选）
 */
export function addDefaultSphereTextures(
  mesh: THREE.SkinnedMesh,
  sphereTextureUrl?: string
): void {
  const loader = new THREE.TextureLoader();
  
  // 如果没有提供URL，创建一个简单的渐变sphere纹理
  const getSphereTexture = (): THREE.Texture => {
    if (sphereTextureUrl) {
      return loader.load(sphereTextureUrl);
    }
    
    // 创建一个简单的径向渐变纹理
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // 创建径向渐变（模拟sphere map）
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, '#ffffff');    // 中心白色（高光）
    gradient.addColorStop(0.5, '#cccccc');  // 中间灰色
    gradient.addColorStop(1, '#888888');    // 边缘暗灰色
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    
    return texture;
  };
  
  const sphereTexture = getSphereTexture();
  let appliedCount = 0;
  
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      
      materials.forEach((mat) => {
        // 只为没有envMap的材质添加
        if (!mat.envMap) {
          const materialName = mat.name || '';
          
          // 只为可能需要sphere的材质添加（头发、眼睛等）
          const needsSphere = 
            materialName.includes('hair') ||
            materialName.includes('Hair') ||
            materialName.includes('髪') ||
            materialName.includes('kami') ||
            materialName.includes('eye') ||
            materialName.includes('Eye') ||
            materialName.includes('瞳');
          
          if (needsSphere) {
            mat.envMap = sphereTexture;
            
            // 设置合适的混合强度
            if ('envMapIntensity' in mat) {
              (mat as any).envMapIntensity = 0.3; // 适度的反射强度
            }
            
            mat.needsUpdate = true;
            appliedCount++;
          }
        }
      });
    }
  });
  
  console.log(`🔮 添加默认Sphere纹理到 ${appliedCount} 个材质`);
}

/**
 * 使用PMXParser检查模型定义的sphere纹理
 * 
 * @param modelUrl - 模型URL
 * @returns Sphere纹理信息
 */
export async function checkModelSphereDefinition(modelUrl: string): Promise<{
  hasSphere: boolean;
  sphereTextures: Array<{
    materialName: string;
    texturePath: string;
    mode: string;
  }>;
}> {
  try {
    // 动态导入PMXParser
    const { PMXParser } = await import('../pmx/parser/PMXParser');
    
    const parser = new PMXParser();
    const result = await parser.parseFromUrl(modelUrl);
    
    const sphereTextures: Array<{
      materialName: string;
      texturePath: string;
      mode: string;
    }> = [];
    
    result.materialTextureMappings.forEach((mapping) => {
      if (mapping.sphereTexture) {
        sphereTextures.push({
          materialName: mapping.materialName,
          texturePath: mapping.sphereTexture.path,
          mode: mapping.sphereTexture.mode,
        });
      }
    });
    
    return {
      hasSphere: sphereTextures.length > 0,
      sphereTextures,
    };
  } catch (error) {
    console.error('检查模型sphere定义失败:', error);
    return {
      hasSphere: false,
      sphereTextures: [],
    };
  }
}

/**
 * 打印模型的sphere纹理定义
 * 
 * @param modelUrl - 模型URL
 */
export async function printModelSphereInfo(modelUrl: string): Promise<void> {
  console.log('\n🔍 检查模型的Sphere纹理定义...');
  console.log(`模型: ${modelUrl}`);
  console.log('='.repeat(60));
  
  const info = await checkModelSphereDefinition(modelUrl);
  
  if (info.hasSphere) {
    console.log(`\n✅ 模型定义了 ${info.sphereTextures.length} 个Sphere纹理:`);
    info.sphereTextures.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.materialName}`);
      console.log(`   纹理: ${item.texturePath}`);
      console.log(`   模式: ${item.mode}`);
    });
    
    console.log('\n💡 建议:');
    console.log('  1. 检查以下文件是否存在于模型目录:');
    info.sphereTextures.forEach((item) => {
      console.log(`     - ${item.texturePath}`);
    });
    console.log('  2. 确保这些文件可以被访问（无CORS错误）');
    console.log('  3. MMDLoader应该会自动加载这些纹理');
  } else {
    console.log('\n❌ 模型没有定义任何Sphere纹理');
    console.log('\n💡 可能的原因:');
    console.log('  1. 这个模型本身不使用sphere纹理');
    console.log('  2. 模型作者没有添加sphere纹理');
    console.log('\n💡 临时解决方案:');
    console.log('  使用 addDefaultSphereTextures(mesh) 添加默认sphere纹理');
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * 全面诊断sphere纹理问题
 * 
 * @param mesh - 已加载的模型网格
 * @param modelUrl - 模型URL
 */
export async function fullSphereDiagnostic(
  mesh: THREE.SkinnedMesh,
  modelUrl: string
): Promise<void> {
  console.log('\n🔮 Sphere纹理完整诊断');
  console.log('='.repeat(60));
  
  // 1. 检查运行时材质状态
  const runtimeDiag = checkSphereTextures(mesh);
  printSphereDiagnostic(runtimeDiag);
  
  // 2. 检查PMX文件定义
  await printModelSphereInfo(modelUrl);
  
  // 3. 综合建议
  console.log('\n📋 综合建议:');
  
  if (runtimeDiag.actualSphere === 0) {
    console.log('\n⚠️ 运行时没有检测到任何sphere纹理！');
    
    // 检查PMX定义
    const pmxInfo = await checkModelSphereDefinition(modelUrl);
    
    if (pmxInfo.hasSphere) {
      console.log('\n❌ 模型定义了sphere纹理，但加载失败！');
      console.log('可能的原因:');
      console.log('  1. 纹理文件不存在');
      console.log('  2. CORS错误（跨域）');
      console.log('  3. 文件路径错误');
      console.log('\n解决方案:');
      console.log('  打开浏览器Network面板，查看哪些.spa/.sph文件加载失败');
    } else {
      console.log('\n⚠️ 模型本身没有定义sphere纹理');
      console.log('解决方案:');
      console.log('  1. 使用 addDefaultSphereTextures(mesh) 添加默认纹理');
      console.log('  2. 或使用调试面板提高"高光强度"和"反射率"来弥补');
    }
  } else {
    console.log('\n✅ 检测到sphere纹理！');
    console.log(`当前有 ${runtimeDiag.actualSphere} 个材质使用sphere纹理`);
  }
  
  console.log('\n' + '='.repeat(60));
}

// 将工具添加到window对象（方便在控制台使用）
if (typeof window !== 'undefined') {
  (window as any).checkSphereTextures = checkSphereTextures;
  (window as any).addDefaultSphereTextures = addDefaultSphereTextures;
  (window as any).printModelSphereInfo = printModelSphereInfo;
  (window as any).fullSphereDiagnostic = fullSphereDiagnostic;
}



