/**
 * HLSL到GLSL转换器
 * 将MME的HLSL shader代码转换为Three.js可用的GLSL代码
 */

export interface ConversionResult {
  /** 转换后的GLSL代码 */
  glslCode: string;
  /** 检测到的uniforms */
  uniforms: Map<string, UniformInfo>;
  /** 检测到的attributes */
  attributes: Map<string, AttributeInfo>;
  /** 检测到的varyings */
  varyings: Map<string, VaryingInfo>;
  /** 转换警告 */
  warnings: string[];
}

export interface UniformInfo {
  type: string;
  glslType: string;
  semantic?: string;
}

export interface AttributeInfo {
  type: string;
  glslType: string;
  semantic: string;
}

export interface VaryingInfo {
  type: string;
  glslType: string;
}

export class HLSLToGLSLConverter {
  private warnings: string[] = [];
  private uniforms: Map<string, UniformInfo> = new Map();
  private attributes: Map<string, AttributeInfo> = new Map();
  private varyings: Map<string, VaryingInfo> = new Map();

  /**
   * HLSL类型到GLSL类型的映射
   */
  private typeMap: Record<string, string> = {
    // 标量类型
    'float': 'float',
    'int': 'int',
    'bool': 'bool',
    'half': 'float', // GLSL没有half，使用float
    
    // 向量类型
    'float2': 'vec2',
    'float3': 'vec3',
    'float4': 'vec4',
    'int2': 'ivec2',
    'int3': 'ivec3',
    'int4': 'ivec4',
    'bool2': 'bvec2',
    'bool3': 'bvec3',
    'bool4': 'bvec4',
    'half2': 'vec2',
    'half3': 'vec3',
    'half4': 'vec4',
    
    // 矩阵类型
    'float2x2': 'mat2',
    'float3x3': 'mat3',
    'float4x4': 'mat4',
    'matrix': 'mat4',
    
    // 纹理类型
    'texture': 'sampler2D',
    'texture2D': 'sampler2D',
    'sampler': 'sampler2D',
    'sampler2D': 'sampler2D',
    'samplerCUBE': 'samplerCube',
  };

  /**
   * HLSL函数到GLSL函数的映射
   */
  private functionMap: Record<string, string> = {
    // 纹理采样
    'tex2D': 'texture2D',
    'tex2Dlod': 'texture2DLod',
    'texCUBE': 'textureCube',
    
    // 数学函数
    'mul': 'matrixCompMult', // 注意：mul可能需要特殊处理
    'lerp': 'mix',
    'frac': 'fract',
    'saturate': 'clamp01', // 需要自定义函数
    'ddx': 'dFdx',
    'ddy': 'dFdy',
    
    // 向量函数
    'length': 'length',
    'normalize': 'normalize',
    'dot': 'dot',
    'cross': 'cross',
    'reflect': 'reflect',
    'refract': 'refract',
    
    // 数学运算
    'pow': 'pow',
    'exp': 'exp',
    'log': 'log',
    'sqrt': 'sqrt',
    'abs': 'abs',
    'sin': 'sin',
    'cos': 'cos',
    'tan': 'tan',
    'asin': 'asin',
    'acos': 'acos',
    'atan': 'atan',
    'atan2': 'atan',
    'floor': 'floor',
    'ceil': 'ceil',
    'min': 'min',
    'max': 'max',
    'clamp': 'clamp',
    'step': 'step',
    'smoothstep': 'smoothstep',
  };

  /**
   * HLSL语义到GLSL的映射
   */
  private semanticMap: Record<string, string> = {
    // 顶点着色器输入
    'POSITION': 'position',
    'POSITION0': 'position',
    'NORMAL': 'normal',
    'NORMAL0': 'normal',
    'TEXCOORD': 'uv',
    'TEXCOORD0': 'uv',
    'TEXCOORD1': 'uv2',
    'COLOR': 'color',
    'COLOR0': 'color',
    'TANGENT': 'tangent',
    'BINORMAL': 'binormal',
    
    // 顶点着色器输出 / 像素着色器输入
    'SV_POSITION': 'gl_Position',
    
    // 像素着色器输出
    'SV_TARGET': 'gl_FragColor',
    'SV_TARGET0': 'gl_FragColor',
  };

  /**
   * 转换HLSL shader代码为GLSL
   */
  convert(hlslCode: string, shaderType: 'vertex' | 'fragment'): ConversionResult {
    this.warnings = [];
    this.uniforms.clear();
    this.attributes.clear();
    this.varyings.clear();

    let glslCode = hlslCode;

    // 1. 预处理：移除HLSL特有的预处理指令
    glslCode = this.preprocessCode(glslCode);

    // 2. 转换类型声明
    glslCode = this.convertTypes(glslCode);

    // 3. 转换函数调用
    glslCode = this.convertFunctions(glslCode);

    // 4. 转换语义
    glslCode = this.convertSemantics(glslCode, shaderType);

    // 5. 处理输入/输出结构
    glslCode = this.convertIOStructs(glslCode, shaderType);

    // 6. 添加GLSL版本声明和必要的辅助函数
    glslCode = this.addGLSLHeader(glslCode);

    // 7. 修复语法差异
    glslCode = this.fixSyntaxDifferences(glslCode);

    return {
      glslCode,
      uniforms: this.uniforms,
      attributes: this.attributes,
      varyings: this.varyings,
      warnings: this.warnings,
    };
  }

  /**
   * 预处理代码
   */
  private preprocessCode(code: string): string {
    // 移除register()声明（HLSL特有）
    code = code.replace(/:\s*register\([^)]+\)/g, '');
    
    // 移除packoffset()声明
    code = code.replace(/:\s*packoffset\([^)]+\)/g, '');
    
    return code;
  }

  /**
   * 转换类型声明
   */
  private convertTypes(code: string): string {
    // 替换类型声明
    for (const [hlslType, glslType] of Object.entries(this.typeMap)) {
      // 使用单词边界确保完整匹配
      const regex = new RegExp(`\\b${hlslType}\\b`, 'g');
      code = code.replace(regex, glslType);
    }

    return code;
  }

  /**
   * 转换函数调用
   */
  private convertFunctions(code: string): string {
    for (const [hlslFunc, glslFunc] of Object.entries(this.functionMap)) {
      const regex = new RegExp(`\\b${hlslFunc}\\b`, 'g');
      code = code.replace(regex, glslFunc);
    }

    // 特殊处理mul()函数 - 矩阵乘法
    code = this.convertMulFunction(code);

    // 特殊处理saturate()函数
    code = code.replace(/\bclamp01\s*\(/g, 'clamp(');
    code = code.replace(/saturate\s*\(([^)]+)\)/g, 'clamp($1, 0.0, 1.0)');

    return code;
  }

  /**
   * 转换mul()函数
   * HLSL: mul(matrix, vector) 或 mul(vector, matrix)
   * GLSL: matrix * vector 或 vector * matrix
   */
  private convertMulFunction(code: string): string {
    // 简化版：将mul(a, b)替换为(a * b)
    // 注意：实际使用中可能需要根据参数类型调整顺序
    code = code.replace(/mul\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, '($1 * $2)');
    
    this.warnings.push('mul() function converted to (*) operator - may need manual adjustment for matrix multiplication order');
    
    return code;
  }

  /**
   * 转换语义
   */
  private convertSemantics(code: string, shaderType: 'vertex' | 'fragment'): string {
    // 转换输入/输出语义
    for (const [hlslSemantic, glslSemantic] of Object.entries(this.semanticMap)) {
      const regex = new RegExp(`\\b${hlslSemantic}\\b`, 'g');
      code = code.replace(regex, glslSemantic);
    }

    return code;
  }

  /**
   * 转换输入/输出结构
   */
  private convertIOStructs(code: string, shaderType: 'vertex' | 'fragment'): string {
    // 检测输入结构
    const inputStructRegex = /struct\s+(\w+)\s*{([^}]+)}/g;
    let match;

    while ((match = inputStructRegex.exec(code)) !== null) {
      if (!match[1] || !match[2]) continue;
      
      const structName = match[1];
      const structBody = match[2];

      // 解析结构体成员
      const members = this.parseStructMembers(structBody);

      if (shaderType === 'vertex') {
        // 顶点着色器：将输入结构转换为attributes
        members.forEach(member => {
          this.attributes.set(member.name, {
            type: member.type,
            glslType: this.typeMap[member.type] || member.type,
            semantic: member.semantic || '',
          });
        });
      }
    }

    return code;
  }

  /**
   * 解析结构体成员
   */
  private parseStructMembers(structBody: string): Array<{ type: string; name: string; semantic?: string }> {
    const members: Array<{ type: string; name: string; semantic?: string }> = [];
    const lines = structBody.split(';');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 匹配: type name : semantic
      const match = trimmed.match(/(\w+)\s+(\w+)\s*(?::\s*(\w+))?/);
      if (match && match[1] && match[2]) {
        members.push({
          type: match[1],
          name: match[2],
          semantic: match[3],
        });
      }
    });

    return members;
  }

  /**
   * 添加GLSL头部和辅助函数
   */
  private addGLSLHeader(code: string): string {
    const header = `
// Auto-converted from HLSL to GLSL
#ifdef GL_ES
precision highp float;
#endif

// Helper functions for HLSL compatibility
vec3 mul(mat3 m, vec3 v) { return m * v; }
vec4 mul(mat4 m, vec4 v) { return m * v; }
float saturate(float x) { return clamp(x, 0.0, 1.0); }
vec2 saturate(vec2 x) { return clamp(x, 0.0, 1.0); }
vec3 saturate(vec3 x) { return clamp(x, 0.0, 1.0); }
vec4 saturate(vec4 x) { return clamp(x, 0.0, 1.0); }

`;

    return header + code;
  }

  /**
   * 修复语法差异
   */
  private fixSyntaxDifferences(code: string): string {
    // HLSL使用float4构造函数，GLSL使用vec4
    // 这个已经在类型转换中处理了

    // 修复分号问题（HLSL在某些地方允许省略分号，GLSL不允许）
    // 这里只做基本检查
    
    return code;
  }

  /**
   * 从FX效果中提取并转换shader
   */
  convertFromFXEffect(
    effect: any,
    vertexShaderName: string,
    fragmentShaderName: string
  ): { vertexShader: ConversionResult; fragmentShader: ConversionResult } | null {
    const vsFunc = effect.shaderFunctions?.find((f: any) => f.name === vertexShaderName);
    const fsFunc = effect.shaderFunctions?.find((f: any) => f.name === fragmentShaderName);

    if (!vsFunc || !fsFunc) {
      this.warnings.push(`Shader functions not found: ${vertexShaderName} or ${fragmentShaderName}`);
      return null;
    }

    const vertexShader = this.convert(vsFunc.body, 'vertex');
    const fragmentShader = this.convert(fsFunc.body, 'fragment');

    return {
      vertexShader,
      fragmentShader,
    };
  }
}

