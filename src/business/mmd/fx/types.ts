/**
 * FX文件解析器类型定义
 * 用于解析MME (MikuMikuEffect) 的.fx效果文件
 */

/**
 * FX文件解析结果
 */
export interface FXEffect {
  /** 文件名 */
  fileName: string;
  /** 原始内容 */
  rawContent: string;
  /** 宏定义 */
  defines: FXDefine[];
  /** 参数声明 */
  parameters: FXParameter[];
  /** 静态变量 */
  staticVariables: FXStaticVariable[];
  /** 纹理引用 */
  textures: FXTexture[];
  /** 控制器引用 */
  controllers: FXController[];
  /** 包含文件 */
  includes: string[];
  /** Technique定义 */
  techniques: FXTechnique[];
  /** 着色器函数 */
  shaderFunctions: FXShaderFunction[];
  /** 注释块 */
  comments: FXComment[];
  /** 转换后的GLSL shaders（可选） */
  glslShaders?: GLSLShaders;
}

/**
 * 宏定义
 */
export interface FXDefine {
  /** 宏名称 */
  name: string;
  /** 宏值 */
  value?: string;
  /** 是否被注释掉 */
  isCommented: boolean;
  /** 行号 */
  lineNumber: number;
  /** 注释说明 */
  comment?: string;
}

/**
 * 参数声明
 */
export interface FXParameter {
  /** 参数类型 (float, float2, float3, float4, texture, etc.) */
  type: string;
  /** 参数名称 */
  name: string;
  /** 语义 (POSITION, TEXCOORD, DIFFUSE, etc.) */
  semantic?: string;
  /** 默认值 */
  defaultValue?: string;
  /** 注解 (annotations) */
  annotations?: Record<string, any>;
  /** 行号 */
  lineNumber: number;
  /** 注释说明 */
  comment?: string;
}

/**
 * 静态变量
 */
export interface FXStaticVariable {
  /** 变量类型 */
  type: string;
  /** 变量名称 */
  name: string;
  /** 初始化表达式 */
  expression: string;
  /** 行号 */
  lineNumber: number;
}

/**
 * 纹理引用
 */
export interface FXTexture {
  /** 纹理名称 */
  name: string;
  /** 纹理路径 */
  path: string;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 纹理用途 (diffuse, normal, shadow, etc.) */
  purpose?: string;
}

/**
 * 控制器引用
 */
export interface FXController {
  /** 控制器名称 */
  name: string;
  /** 控制器对象 */
  objectName: string;
  /** 控制项 */
  itemName: string;
  /** 绑定到的参数 */
  boundParameter: string;
}

/**
 * Technique定义
 */
export interface FXTechnique {
  /** Technique名称 */
  name: string;
  /** Pass列表 */
  passes: FXPass[];
  /** 行号 */
  lineNumber: number;
}

/**
 * Pass定义
 */
export interface FXPass {
  /** Pass名称 */
  name?: string;
  /** 顶点着色器 */
  vertexShader?: {
    profile: string;
    function: string;
  };
  /** 像素着色器 */
  pixelShader?: {
    profile: string;
    function: string;
  };
  /** 渲染状态 */
  renderStates: Record<string, any>;
}

/**
 * 着色器函数
 */
export interface FXShaderFunction {
  /** 函数名 */
  name: string;
  /** 返回类型 */
  returnType: string;
  /** 参数列表 */
  parameters: string;
  /** 函数体 */
  body: string;
  /** 输出语义 */
  outputSemantic?: string;
  /** 行号 */
  lineNumber: number;
}

/**
 * 注释块
 */
export interface FXComment {
  /** 注释内容 */
  content: string;
  /** 注释类型 (line: 单行注释 //, block: 块注释) */
  type: 'line' | 'block';
  /** 行号 */
  lineNumber: number;
}

/**
 * 转换后的GLSL shaders
 */
export interface GLSLShaders {
  /** 顶点着色器 */
  vertexShader?: GLSLShader;
  /** 片段着色器 */
  fragmentShader?: GLSLShader;
  /** 转换警告 */
  warnings: string[];
}

/**
 * GLSL shader信息
 */
export interface GLSLShader {
  /** 转换后的GLSL代码 */
  code: string;
  /** Uniforms */
  uniforms: Map<string, { type: string; glslType: string; semantic?: string }>;
  /** Attributes（仅顶点着色器） */
  attributes: Map<string, { type: string; glslType: string; semantic: string }>;
  /** Varyings */
  varyings: Map<string, { type: string; glslType: string }>;
}

/**
 * FX解析配置
 */
export interface FXParserOptions {
  /** 是否保留注释 */
  keepComments?: boolean;
  /** 是否解析Technique */
  parseTechniques?: boolean;
  /** 是否解析着色器函数 */
  parseShaderFunctions?: boolean;
  /** 是否解析纹理引用 */
  parseTextures?: boolean;
  /** 是否解析控制器引用 */
  parseControllers?: boolean;
  /** 是否转换HLSL到GLSL */
  convertToGLSL?: boolean;
  /** 顶点着色器函数名（用于GLSL转换） */
  vertexShaderFunction?: string;
  /** 片段着色器函数名（用于GLSL转换） */
  fragmentShaderFunction?: string;
}

/**
 * FX文件摘要信息（用于快速预览）
 */
export interface FXSummary {
  fileName: string;
  defineCount: number;
  parameterCount: number;
  textureCount: number;
  techniqueCount: number;
  hasLocalShadow: boolean;
  hasExcellentShadow: boolean;
  hasHgShadow: boolean;
  enabledDefines: string[];
  disabledDefines: string[];
}

