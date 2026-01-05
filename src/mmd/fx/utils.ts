/**
 * FX解析器工具函数
 */

import type { FXEffect, FXDefine, FXParameter, FXTexture } from './types';

/**
 * 将FX效果导出为JSON
 */
export function exportFXToJSON(effect: FXEffect): string {
  return JSON.stringify(effect, null, 2);
}

/**
 * 将FX效果导出为Markdown文档
 */
export function exportFXToMarkdown(effect: FXEffect): string {
  const lines: string[] = [];

  lines.push(`# ${effect.fileName}`);
  lines.push('');

  // 宏定义
  if (effect.defines.length > 0) {
    lines.push('## 宏定义 (Defines)');
    lines.push('');
    lines.push('| 名称 | 值 | 状态 | 说明 |');
    lines.push('|------|-----|------|------|');
    effect.defines.forEach(d => {
      const status = d.isCommented ? '禁用' : '启用';
      lines.push(`| ${d.name} | ${d.value || '-'} | ${status} | ${d.comment || '-'} |`);
    });
    lines.push('');
  }

  // 纹理
  if (effect.textures.length > 0) {
    lines.push('## 纹理 (Textures)');
    lines.push('');
    lines.push('| 名称 | 路径 | 尺寸 | 用途 |');
    lines.push('|------|------|------|------|');
    effect.textures.forEach(t => {
      const size = t.width && t.height ? `${t.width}x${t.height}` : '-';
      lines.push(`| ${t.name} | ${t.path} | ${size} | ${t.purpose || '-'} |`);
    });
    lines.push('');
  }

  // 参数
  if (effect.parameters.length > 0) {
    lines.push('## 参数 (Parameters)');
    lines.push('');
    lines.push('| 名称 | 类型 | 语义 | 默认值 |');
    lines.push('|------|------|------|--------|');
    effect.parameters.forEach(p => {
      lines.push(`| ${p.name} | ${p.type} | ${p.semantic || '-'} | ${p.defaultValue || '-'} |`);
    });
    lines.push('');
  }

  // 控制器
  if (effect.controllers.length > 0) {
    lines.push('## 控制器 (Controllers)');
    lines.push('');
    lines.push('| 参数 | 对象名 | 控制项 |');
    lines.push('|------|--------|--------|');
    effect.controllers.forEach(c => {
      lines.push(`| ${c.name} | ${c.objectName} | ${c.itemName} |`);
    });
    lines.push('');
  }

  // 包含文件
  if (effect.includes.length > 0) {
    lines.push('## 包含文件 (Includes)');
    lines.push('');
    effect.includes.forEach(inc => {
      lines.push(`- ${inc}`);
    });
    lines.push('');
  }

  // Techniques
  if (effect.techniques.length > 0) {
    lines.push('## 技术 (Techniques)');
    lines.push('');
    effect.techniques.forEach(t => {
      lines.push(`### ${t.name}`);
      lines.push('');
      t.passes.forEach((p, idx) => {
        lines.push(`#### Pass ${p.name || idx + 1}`);
        if (p.vertexShader) {
          lines.push(`- **顶点着色器**: ${p.vertexShader.function} (${p.vertexShader.profile})`);
        }
        if (p.pixelShader) {
          lines.push(`- **像素着色器**: ${p.pixelShader.function} (${p.pixelShader.profile})`);
        }
        lines.push('');
      });
    });
  }

  return lines.join('\n');
}

/**
 * 比较两个FX文件的差异
 */
export function compareFXEffects(effect1: FXEffect, effect2: FXEffect) {
  const diff = {
    addedDefines: [] as string[],
    removedDefines: [] as string[],
    changedDefines: [] as { name: string; oldValue?: string; newValue?: string }[],
    addedTextures: [] as string[],
    removedTextures: [] as string[],
    addedParameters: [] as string[],
    removedParameters: [] as string[],
  };

  // 比较宏定义
  const defines1Map = new Map(effect1.defines.map(d => [d.name, d]));
  const defines2Map = new Map(effect2.defines.map(d => [d.name, d]));

  defines2Map.forEach((define, name) => {
    if (!defines1Map.has(name)) {
      diff.addedDefines.push(name);
    } else {
      const oldDefine = defines1Map.get(name)!;
      if (oldDefine.value !== define.value || oldDefine.isCommented !== define.isCommented) {
        diff.changedDefines.push({
          name,
          oldValue: oldDefine.value,
          newValue: define.value,
        });
      }
    }
  });

  defines1Map.forEach((define, name) => {
    if (!defines2Map.has(name)) {
      diff.removedDefines.push(name);
    }
  });

  // 比较纹理
  const textures1Set = new Set(effect1.textures.map(t => t.name));
  const textures2Set = new Set(effect2.textures.map(t => t.name));

  textures2Set.forEach(name => {
    if (!textures1Set.has(name)) {
      diff.addedTextures.push(name);
    }
  });

  textures1Set.forEach(name => {
    if (!textures2Set.has(name)) {
      diff.removedTextures.push(name);
    }
  });

  // 比较参数
  const params1Set = new Set(effect1.parameters.map(p => p.name));
  const params2Set = new Set(effect2.parameters.map(p => p.name));

  params2Set.forEach(name => {
    if (!params1Set.has(name)) {
      diff.addedParameters.push(name);
    }
  });

  params1Set.forEach(name => {
    if (!params2Set.has(name)) {
      diff.removedParameters.push(name);
    }
  });

  return diff;
}

/**
 * 过滤特定类型的宏定义
 */
export function filterDefinesByPrefix(defines: FXDefine[], prefix: string): FXDefine[] {
  return defines.filter(d => d.name.startsWith(prefix));
}

/**
 * 获取所有纹理宏定义
 */
export function getTextureDefines(defines: FXDefine[]): FXDefine[] {
  return filterDefinesByPrefix(defines, 'BLEND');
}

/**
 * 获取所有功能标志
 */
export function getFeatureFlags(defines: FXDefine[]): FXDefine[] {
  return defines.filter(d => 
    d.name.startsWith('USE_') || 
    d.name.includes('FLAG') ||
    d.name === 'HANDLE_EDGE' ||
    d.name === 'MODEL_TOON'
  );
}

/**
 * 获取所有颜色相关的参数
 */
export function getColorParameters(parameters: FXParameter[]): FXParameter[] {
  return parameters.filter(p => 
    p.name.toLowerCase().includes('color') ||
    p.name.toLowerCase().includes('rgb') ||
    p.name.toLowerCase().includes('hsv') ||
    p.type === 'float3' || 
    p.type === 'float4'
  );
}

/**
 * 检查是否包含特定功能
 */
export function hasFeature(effect: FXEffect, featureName: string): boolean {
  return effect.defines.some(d => 
    d.name === featureName && !d.isCommented
  );
}

/**
 * 获取配置摘要文本
 */
export function getConfigSummaryText(effect: FXEffect): string {
  const features: string[] = [];

  if (hasFeature(effect, 'USE_LOCALSHADOW')) {
    features.push('LocalShadow');
  }
  if (hasFeature(effect, 'USE_EXCELLENTSHADOW')) {
    features.push('ExcellentShadow');
  }
  if (hasFeature(effect, 'USE_HGSHADOW')) {
    features.push('HgShadow');
  }
  if (hasFeature(effect, 'HANDLE_EDGE')) {
    features.push('HandleEdge');
  }
  if (hasFeature(effect, 'MODEL_TOON')) {
    features.push('ModelToon');
  }
  if (hasFeature(effect, 'USE_ROUNDNORMAL')) {
    features.push('RoundNormal');
  }

  return features.length > 0 
    ? `启用功能: ${features.join(', ')}` 
    : '无特殊功能启用';
}

/**
 * 提取纹理文件路径列表（用于预加载）
 */
export function extractTexturePaths(effect: FXEffect): string[] {
  return effect.textures.map(t => t.path);
}

/**
 * 验证FX文件的完整性
 */
export function validateFXEffect(effect: FXEffect): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必需的includes
  if (effect.includes.length === 0) {
    warnings.push('没有找到include指令');
  }

  // 检查纹理路径是否存在
  effect.textures.forEach(texture => {
    if (!texture.path || texture.path === '') {
      errors.push(`纹理 ${texture.name} 缺少路径`);
    }
  });

  // 检查参数的默认值
  effect.parameters.forEach(param => {
    if (param.type.includes('float') && param.defaultValue) {
      const floatRegex = /^float[234]?\s*\(/;
      if (!floatRegex.test(param.defaultValue) && isNaN(parseFloat(param.defaultValue))) {
        warnings.push(`参数 ${param.name} 的默认值可能不合法: ${param.defaultValue}`);
      }
    }
  });

  // 检查techniques
  if (effect.techniques.length === 0 && effect.includes.length === 0) {
    warnings.push('没有找到Technique定义，也没有include文件');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}




