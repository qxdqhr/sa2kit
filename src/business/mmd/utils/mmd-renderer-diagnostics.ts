/**
 * MMD渲染诊断工具
 * 用于检测模型渲染问题
 */

import * as THREE from 'three';

export interface MMDDiagnosticReport {
  /** 材质总数 */
  totalMaterials: number;
  /** 有Toon纹理的材质数 */
  materialsWithToon: number;
  /** 有Sphere纹理的材质数 */
  materialsWithSphere: number;
  /** 有主纹理的材质数 */
  materialsWithMainTexture: number;
  /** MeshToonMaterial数量 */
  toonMaterialCount: number;
  /** MeshPhongMaterial数量 */
  phongMaterialCount: number;
  /** MeshStandardMaterial数量 */
  standardMaterialCount: number;
  /** 问题列表 */
  issues: string[];
  /** 建议列表 */
  suggestions: string[];
}

/**
 * 诊断MMD场景渲染问题
 * 
 * @param scene - Three.js场景
 * @param renderer - 渲染器（可选）
 * @returns 诊断报告
 */
export function diagnoseMaterialsMMD(
  scene: THREE.Scene,
  renderer?: THREE.WebGLRenderer
): MMDDiagnosticReport {
  const report: MMDDiagnosticReport = {
    totalMaterials: 0,
    materialsWithToon: 0,
    materialsWithSphere: 0,
    materialsWithMainTexture: 0,
    toonMaterialCount: 0,
    phongMaterialCount: 0,
    standardMaterialCount: 0,
    issues: [],
    suggestions: [],
  };

  // 遍历场景检查材质
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

      materials.forEach((material) => {
        report.totalMaterials++;

        // 统计材质类型
        if (material instanceof THREE.MeshToonMaterial) {
          report.toonMaterialCount++;
        }
        if (material instanceof THREE.MeshPhongMaterial) {
          report.phongMaterialCount++;
        }
        if (material instanceof THREE.MeshStandardMaterial) {
          report.standardMaterialCount++;
        }

        // 检查纹理
        if ((material as any).gradientMap || (material as any).toonMap) {
          report.materialsWithToon++;
        }

        if (material.envMap) {
          report.materialsWithSphere++;
        }

        if (material.map) {
          report.materialsWithMainTexture++;
        }
      });
    }
  });

  // 分析问题
  if (report.totalMaterials === 0) {
    report.issues.push('场景中没有找到任何材质');
  }

  if (report.materialsWithToon === 0 && report.toonMaterialCount > 0) {
    report.issues.push('检测到Toon材质但没有gradientMap/toonMap纹理');
    report.suggestions.push('调用 configureMaterialsForMMD(mesh, { enableGradientMap: true })');
    report.suggestions.push('或配置 loader.setToonPath("/mmd/toon/")');
  }

  if (report.materialsWithSphere === 0) {
    report.issues.push('❌ 没有检测到Sphere纹理（envMap）- 这是缺少金属光泽的主要原因！');
    report.suggestions.push('🔍 步骤1: 检查模型定义 - 运行 printModelSphereInfo("模型URL")');
    report.suggestions.push('🔍 步骤2: 查看Network面板，检查.spa/.sph文件是否加载失败');
    report.suggestions.push('💡 临时方案: 调用 addDefaultSphereTextures(mesh) 添加默认sphere纹理');
    report.suggestions.push('⚡ 或提高"高光强度"(50-60)和"反射率"(0.6-0.8)来弥补');
  }

  if (report.phongMaterialCount === 0 && report.toonMaterialCount === 0) {
    report.issues.push('没有检测到MMD常用的材质类型（MeshPhongMaterial或MeshToonMaterial）');
  }

  // 检查渲染器配置
  if (renderer) {
    if (renderer.toneMapping === THREE.ACESFilmicToneMapping) {
      report.suggestions.push('当前使用ACESFilmic色调映射，建议尝试Linear映射以获得更接近MMD的效果');
    }

    if (!renderer.shadowMap.enabled) {
      report.issues.push('阴影未启用');
      report.suggestions.push('启用阴影: renderer.shadowMap.enabled = true');
    }
  }

  return report;
}

/**
 * 打印诊断报告到控制台
 * 
 * @param report - 诊断报告
 */
export function printDiagnosticReport(report: MMDDiagnosticReport): void {
  console.log('🔍 MMD渲染诊断报告');
  console.log('='.repeat(60));

  // 材质统计
  console.log('\n📊 材质统计:');
  console.log('  总材质数: ' + (report.totalMaterials));
  console.log('  MeshToonMaterial: ' + (report.toonMaterialCount));
  console.log('  MeshPhongMaterial: ' + (report.phongMaterialCount));
  console.log('  MeshStandardMaterial: ' + (report.standardMaterialCount));

  // 纹理统计
  console.log('\n🎨 纹理统计:');
  console.log('  有Toon纹理: ' + (report.materialsWithToon) + ' / ' + (report.totalMaterials) + ' ' + (report.materialsWithToon > 0 ? '✅' : '❌'));
  console.log('  有Sphere纹理: ' + (report.materialsWithSphere) + ' / ' + (report.totalMaterials) + ' ' + (report.materialsWithSphere > 0 ? '✅' : '❌'));
  console.log('  有主纹理: ' + (report.materialsWithMainTexture) + ' / ' + (report.totalMaterials));

  // 问题列表
  if (report.issues.length > 0) {
    console.log('\n⚠️ 发现的问题:');
    report.issues.forEach((issue, i) => {
      console.log('  ' + (i + 1) + '. ' + (issue));
    });
  } else {
    console.log('\n✅ 未发现明显问题');
  }

  // 建议列表
  if (report.suggestions.length > 0) {
    console.log('\n💡 改进建议:');
    report.suggestions.forEach((suggestion, i) => {
      console.log('  ' + (i + 1) + '. ' + (suggestion));
    });
  }

  console.log('\n' + '='.repeat(60));

  // 返回可复制的修复代码
  if (report.materialsWithToon === 0) {
    console.log('\n📋 修复代码（复制到你的代码中）:');
    console.log(`
// 在加载模型前配置
const loader = new MMDLoader();
loader.setToonPath('/mmd/toon/');
loader.setResourcePath('/path/to/model/');

// 加载模型后应用
import { configureMaterialsForMMD } from 'sa2kit/business/mmd';
configureMaterialsForMMD(mesh, {
  enableGradientMap: true,
  shininess: 50,
});
    `);
  }
}

/**
 * 快速诊断（浏览器控制台友好版本）
 * 
 * 使用方法：
 * 1. 在浏览器控制台运行
 * 2. 将scene对象传入
 * 
 * @param scene - Three.js场景
 * @param renderer - 渲染器（可选）
 */
export function quickDiagnose(scene: THREE.Scene, renderer?: THREE.WebGLRenderer): void {
  const report = diagnoseMaterialsMMD(scene, renderer);
  printDiagnosticReport(report);
}

/**
 * 检查特定材质的详细信息
 * 
 * @param material - Three.js材质
 * @returns 材质信息字符串
 */
export function inspectMaterial(material: THREE.Material): Record<string, any> {
  const info: Record<string, any> = {
    type: material.type,
    name: material.name,
    hasMap: !!(material as any).map,
    hasEnvMap: !!(material as any).envMap,
  };

  // Toon/Phong/Standard 特有属性
  if ('gradientMap' in material) {
    info.hasGradientMap = !!(material as any).gradientMap;
  }
  if ('toonMap' in material) {
    info.hasToonMap = !!(material as any).toonMap;
  }
  if ('specular' in material) {
    info.specular = (material as any).specular;
  }
  if ('shininess' in material) {
    info.shininess = (material as any).shininess;
  }
  if ('metalness' in material) {
    info.metalness = (material as any).metalness;
  }
  if ('roughness' in material) {
    info.roughness = (material as any).roughness;
  }

  return info;
}

/**
 * 列出所有材质的详细信息
 * 
 * @param scene - Three.js场景
 */
export function listAllMaterials(scene: THREE.Scene): void {
  console.log('📋 材质列表');
  console.log('='.repeat(60));

  let index = 0;
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

      materials.forEach((mat) => {
        console.log('\n材质 #' + (index) + ':', obj.name || 'unnamed');
        console.log(inspectMaterial(mat));
        index++;
      });
    }
  });

  console.log('\n' + '='.repeat(60));
}

// 将诊断工具添加到window对象（方便在控制台使用）
if (typeof window !== 'undefined') {
  (window as any).mmdDiagnose = quickDiagnose;
  (window as any).mmdInspect = inspectMaterial;
  (window as any).mmdListMaterials = listAllMaterials;
}

