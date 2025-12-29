/**
 * PAToon FX文件解析测试脚本
 * 用于测试解析 /Users/qihongrui/Downloads/PAToon 目录中的FX文件
 */

import * as fs from 'fs';
import * as path from 'path';
import { FXParser } from './FXParser';
import { 
  exportFXToMarkdown, 
  exportFXToJSON, 
  getConfigSummaryText,
  validateFXEffect 
} from './utils';

const PATOON_DIR = '/Users/qihongrui/Downloads/PAToon';

async function testPAToonParser() {
  console.log('🎨 PAToon FX文件解析测试\n');
  console.log('=' .repeat(60));

  const parser = new FXParser({
    keepComments: true,
    parseTechniques: true,
    parseShaderFunctions: true,
    parseTextures: true,
    parseControllers: true,
  });

  // 要解析的两个主要FX文件
  const fxFiles = [
    'PAToon_シェーダー_標準.fx',
    'PAToon_モデル_標準.fx',
  ];

  for (const fileName of fxFiles) {
    const filePath = path.join(PATOON_DIR, fileName);
    
    console.log(`\n📄 解析文件: ${fileName}`);
    console.log('-'.repeat(60));

    try {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 解析
      const effect = parser.parse(content, fileName);
      
      // 生成摘要
      const summary = parser.generateSummary(effect);
      
      console.log('\n📊 文件摘要:');
      console.log(`  - 宏定义数量: ${summary.defineCount}`);
      console.log(`  - 参数数量: ${summary.parameterCount}`);
      console.log(`  - 纹理数量: ${summary.textureCount}`);
      console.log(`  - Technique数量: ${summary.techniqueCount}`);
      
      console.log('\n✨ 功能特性:');
      console.log(`  - LocalShadow: ${summary.hasLocalShadow ? '✓' : '✗'}`);
      console.log(`  - ExcellentShadow: ${summary.hasExcellentShadow ? '✓' : '✗'}`);
      console.log(`  - HgShadow: ${summary.hasHgShadow ? '✓' : '✗'}`);
      
      console.log('\n⚙️ 配置摘要:');
      console.log(`  ${getConfigSummaryText(effect)}`);
      
      // 显示启用的宏定义
      console.log('\n📌 启用的宏定义 (前10个):');
      summary.enabledDefines.slice(0, 10).forEach(name => {
        const define = effect.defines.find(d => d.name === name);
        console.log(`  - ${name}${define?.value ? ` = ${define.value}` : ''}`);
      });
      if (summary.enabledDefines.length > 10) {
        console.log(`  ... 还有 ${summary.enabledDefines.length - 10} 个`);
      }
      
      // 显示纹理
      if (effect.textures.length > 0) {
        console.log('\n🖼️ 纹理引用:');
        effect.textures.forEach(tex => {
          const size = tex.width && tex.height ? ` (${tex.width}×${tex.height})` : '';
          console.log(`  - ${tex.name}: ${tex.path}${size}`);
        });
      }
      
      // 显示控制器
      if (effect.controllers.length > 0) {
        console.log('\n🎮 控制器绑定:');
        effect.controllers.forEach(ctrl => {
          console.log(`  - ${ctrl.name}: ${ctrl.objectName} / ${ctrl.itemName}`);
        });
      }
      
      // 显示包含文件
      if (effect.includes.length > 0) {
        console.log('\n📦 包含文件:');
        effect.includes.forEach(inc => {
          console.log(`  - ${inc}`);
        });
      }
      
      // 显示参数 (前5个)
      if (effect.parameters.length > 0) {
        console.log('\n📝 参数声明 (前5个):');
        effect.parameters.slice(0, 5).forEach(param => {
          const semantic = param.semantic ? `: ${param.semantic}` : '';
          const defaultVal = param.defaultValue ? ` = ${param.defaultValue}` : '';
          console.log(`  - ${param.type} ${param.name}${semantic}${defaultVal}`);
        });
        if (effect.parameters.length > 5) {
          console.log(`  ... 还有 ${effect.parameters.length - 5} 个参数`);
        }
      }
      
      // 验证
      console.log('\n✅ 验证结果:');
      const validation = validateFXEffect(effect);
      console.log(`  - 有效性: ${validation.isValid ? '✓ 通过' : '✗ 失败'}`);
      if (validation.errors.length > 0) {
        console.log(`  - 错误: ${validation.errors.length} 个`);
        validation.errors.forEach(err => console.log(`    ✗ ${err}`));
      }
      if (validation.warnings.length > 0) {
        console.log(`  - 警告: ${validation.warnings.length} 个`);
        validation.warnings.forEach(warn => console.log(`    ⚠ ${warn}`));
      }
      if (validation.isValid && validation.warnings.length === 0) {
        console.log('  ✓ 没有发现问题');
      }
      
      // 导出文件
      const outputDir = path.join(PATOON_DIR, 'parsed');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 导出JSON
      const jsonPath = path.join(outputDir, `${fileName}.json`);
      fs.writeFileSync(jsonPath, exportFXToJSON(effect));
      console.log(`\n💾 已导出JSON: ${jsonPath}`);
      
      // 导出Markdown
      const mdPath = path.join(outputDir, `${fileName}.md`);
      fs.writeFileSync(mdPath, exportFXToMarkdown(effect));
      console.log(`💾 已导出Markdown: ${mdPath}`);
      
    } catch (error) {
      console.error('❌ 解析失败:', error);
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  console.log('\n✨ 测试完成！');
}

// 运行测试
testPAToonParser().catch(console.error);

