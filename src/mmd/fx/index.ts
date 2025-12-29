/**
 * FX文件解析器模块
 * 用于解析和分析MME (MikuMikuEffect) 的.fx效果文件
 * 
 * @example
 * ```typescript
 * import { FXParser } from 'sa2kit/mmd/fx';
 * 
 * const parser = new FXParser({ convertToGLSL: true });
 * const effect = await parser.loadAndParse('/effects/PAToon.fx');
 * console.log(effect.defines, effect.textures, effect.parameters);
 * 
 * // 使用转换后的GLSL shader
 * if (effect.glslShaders) {
 *   const adapter = new FXToThreeAdapter(effect);
 *   const material = adapter.createShaderMaterial();
 * }
 * ```
 */

// 核心解析器
export { FXParser } from './FXParser';

// Three.js适配器
export { FXToThreeAdapter } from './FXToThreeAdapter';

// HLSL到GLSL转换器
export { HLSLToGLSLConverter } from './HLSLToGLSLConverter';

// 多FX适配器
export { MultiFXAdapter } from './MultiFXAdapter';
export type { 
  FXFileConfig, 
  EffectFileType, 
  FXMergeStrategy, 
  MultiFXAdapterOptions 
} from './MultiFXAdapter';

// 导出类型
export type * from './types';
export type { ThreeMaterialConfig, ThreeRenderConfig } from './FXToThreeAdapter';

// 类型定义
export type {
  FXEffect,
  FXDefine,
  FXParameter,
  FXStaticVariable,
  FXTexture,
  FXController,
  FXTechnique,
  FXPass,
  FXShaderFunction,
  FXComment,
  FXParserOptions,
  FXSummary,
} from './types';

// 工具函数
export {
  exportFXToJSON,
  exportFXToMarkdown,
  compareFXEffects,
  filterDefinesByPrefix,
  getTextureDefines,
  getFeatureFlags,
  getColorParameters,
  hasFeature,
  getConfigSummaryText,
  extractTexturePaths,
  validateFXEffect,
} from './utils';

// React组件
export { FXViewer } from './components/FXViewer';
export type { FXViewerProps } from './components/FXViewer';
export { FXThreePreview } from './components/FXThreePreview';
export type { FXThreePreviewProps } from './components/FXThreePreview';

