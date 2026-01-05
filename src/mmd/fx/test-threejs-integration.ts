/**
 * FX到Three.js集成测试脚本
 * 演示如何将解析的FX参数应用到Three.js渲染中
 */

import * as fs from 'fs';
import * as path from 'path';
import { FXParser } from './FXParser';
import { FXToThreeAdapter } from './FXToThreeAdapter';

const PATOON_DIR = '/Users/qihongrui/Downloads/PAToon';

async function testThreeJSIntegration() {
  console.log('🎨 FX到Three.js集成测试\n');
  console.log('='.repeat(60));

  const parser = new FXParser();
  const fxFiles = [
    'PAToon_シェーダー_標準.fx',
    'PAToon_モデル_標準.fx',
  ];

  for (const fileName of fxFiles) {
    const filePath = path.join(PATOON_DIR, fileName);
    
    console.log(`\n📄 处理文件: ${fileName}`);
    console.log('-'.repeat(60));

    try {
      // 1. 解析FX文件
      const content = fs.readFileSync(filePath, 'utf-8');
      const effect = parser.parse(content, fileName);
      
      // 2. 创建适配器
      const adapter = new FXToThreeAdapter(effect, PATOON_DIR);
      
      // 3. 提取材质配置
      console.log('\n📦 材质配置:');
      const materialConfig = adapter.extractMaterialConfig();
      
      if (materialConfig.color) {
        console.log(`  - 颜色: RGB(${materialConfig.color.r.toFixed(2)}, ${materialConfig.color.g.toFixed(2)}, ${materialConfig.color.b.toFixed(2)})`);
      }
      if (materialConfig.emissive) {
        console.log(`  - 发光: RGB(${materialConfig.emissive.r.toFixed(2)}, ${materialConfig.emissive.g.toFixed(2)}, ${materialConfig.emissive.b.toFixed(2)})`);
      }
      if (materialConfig.specular) {
        console.log(`  - 高光: RGB(${materialConfig.specular.r.toFixed(2)}, ${materialConfig.specular.g.toFixed(2)}, ${materialConfig.specular.b.toFixed(2)})`);
      }
      if (materialConfig.shininess !== undefined) {
        console.log(`  - 光泽度: ${materialConfig.shininess}`);
      }
      
      const uniformsCount = Object.keys(materialConfig.uniforms || {}).length;
      console.log(`  - 自定义Uniforms: ${uniformsCount} 个`);
      
      // 4. 提取渲染配置
      console.log('\n⚙️ 渲染配置:');
      const renderConfig = adapter.extractRenderConfig();
      
      console.log(`  - 启用阴影: ${renderConfig.enableShadow ? '✓' : '✗'}`);
      if (renderConfig.shadowMapSize) {
        console.log(`  - 阴影贴图尺寸: ${renderConfig.shadowMapSize}`);
      }
      if (renderConfig.lightDirection) {
        const dir = renderConfig.lightDirection;
        console.log(`  - 光源方向: (${dir.x.toFixed(2)}, ${dir.y.toFixed(2)}, ${dir.z.toFixed(2)})`);
      }
      console.log(`  - 环境光强度: ${renderConfig.ambientLightIntensity}`);
      console.log(`  - 方向光强度: ${renderConfig.directionalLightIntensity}`);
      console.log(`  - 色调映射: ${renderConfig.toneMapping === 0 ? 'NoToneMapping' : 'ACESFilmicToneMapping'}`);
      
      // 5. 生成配置摘要
      console.log('\n📊 配置摘要:');
      const summary = adapter.getSummary();
      
      console.log(`  - 材质参数: ${summary.materialParams.length} 个`);
      summary.materialParams.slice(0, 5).forEach(param => {
        console.log(`    • ${param}`);
      });
      if (summary.materialParams.length > 5) {
        console.log(`    ... 还有 ${summary.materialParams.length - 5} 个`);
      }
      
      console.log(`  - 纹理文件: ${summary.textures.length} 个`);
      summary.textures.forEach(tex => {
        console.log(`    • ${tex}`);
      });
      
      console.log(`  - 渲染特性: ${summary.renderFeatures.length} 个`);
      summary.renderFeatures.forEach(feature => {
        console.log(`    • ${feature}`);
      });
      
      // 6. 演示如何获取uniforms
      console.log('\n🎯 可用于Three.js的Uniforms:');
      const uniforms = adapter.getUniforms();
      const uniformKeys = Object.keys(uniforms);
      
      console.log(`  总计: ${uniformKeys.length} 个uniforms`);
      uniformKeys.slice(0, 5).forEach(key => {
        const value = uniforms[key].value;
        let valueStr = '';
        
        if (value === null || value === undefined) {
          valueStr = 'null';
        } else if (typeof value === 'number') {
          valueStr = value.toFixed(2);
        } else if (value.isVector2) {
          valueStr = `Vector2(${value.x.toFixed(2)}, ${value.y.toFixed(2)})`;
        } else if (value.isVector3) {
          valueStr = `Vector3(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`;
        } else if (value.isVector4) {
          valueStr = `Vector4(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)}, ${value.w.toFixed(2)})`;
        } else if (value.isTexture) {
          valueStr = 'Texture';
        } else {
          valueStr = String(value);
        }
        
        console.log(`    ${key}: ${valueStr}`);
      });
      if (uniformKeys.length > 5) {
        console.log(`    ... 还有 ${uniformKeys.length - 5} 个`);
      }
      
      // 7. 生成Three.js代码示例
      console.log('\n💻 Three.js代码示例:');
      console.log('```typescript');
      console.log('// 1. 创建适配器');
      console.log(`const adapter = new FXToThreeAdapter(effect, '${PATOON_DIR}');`);
      console.log('');
      console.log('// 2. 创建材质');
      console.log('const material = adapter.createMaterial();');
      console.log('');
      console.log('// 3. 创建网格');
      console.log('const geometry = new THREE.SphereGeometry(1, 32, 32);');
      console.log('const mesh = new THREE.Mesh(geometry, material);');
      console.log('');
      console.log('// 4. 配置场景');
      console.log('adapter.configureScene(scene, renderer);');
      console.log('```');
      
    } catch (error) {
      console.error('❌ 处理失败:', error);
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  console.log('\n✨ 测试完成！');
  console.log('\n📚 使用指南:');
  console.log('  - 查看 THREEJS_INTEGRATION.md 了解完整文档');
  console.log('  - 使用 FXToThreeAdapter 将FX应用到Three.js');
  console.log('  - 使用 FXThreePreview 组件进行可视化预览');
}

// 运行测试
testThreeJSIntegration().catch(console.error);




