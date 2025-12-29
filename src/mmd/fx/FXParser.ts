/**
 * FX文件解析器
 * 用于解析MME (MikuMikuEffect) 的.fx效果文件
 */

import type {
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
  GLSLShaders,
} from './types';
import { HLSLToGLSLConverter } from './HLSLToGLSLConverter';

export class FXParser {
  private options: Required<Omit<FXParserOptions, 'vertexShaderFunction' | 'fragmentShaderFunction'>> & {
    vertexShaderFunction?: string;
    fragmentShaderFunction?: string;
  };
  private hlslConverter: HLSLToGLSLConverter;

  constructor(options: FXParserOptions = {}) {
    this.options = {
      keepComments: options.keepComments ?? true,
      parseTechniques: options.parseTechniques ?? true,
      parseShaderFunctions: options.parseShaderFunctions ?? true,
      parseTextures: options.parseTextures ?? true,
      parseControllers: options.parseControllers ?? true,
      convertToGLSL: options.convertToGLSL ?? false,
      vertexShaderFunction: options.vertexShaderFunction,
      fragmentShaderFunction: options.fragmentShaderFunction,
    };
    this.hlslConverter = new HLSLToGLSLConverter();
  }

  /**
   * 从URL加载并解析FX文件
   */
  async loadAndParse(url: string): Promise<FXEffect> {
    const response = await fetch(url);
    const content = await response.text();
    const fileName = url.split('/').pop() || 'unknown.fx';
    return this.parse(content, fileName);
  }

  /**
   * 解析FX文件内容
   */
  parse(content: string, fileName: string = 'unknown.fx'): FXEffect {
    const lines = content.split('\n');

    const effect: FXEffect = {
      fileName,
      rawContent: content,
      defines: [],
      parameters: [],
      staticVariables: [],
      textures: [],
      controllers: [],
      includes: [],
      techniques: [],
      shaderFunctions: [],
      comments: [],
    };

    // 解析各个部分
    effect.defines = this.parseDefines(lines);
    effect.parameters = this.parseParameters(lines);
    effect.staticVariables = this.parseStaticVariables(lines);
    effect.includes = this.parseIncludes(lines);

    if (this.options.parseTextures) {
      effect.textures = this.parseTextures(effect.defines);
    }

    if (this.options.parseControllers) {
      effect.controllers = this.parseControllers(lines);
    }

    if (this.options.parseTechniques) {
      effect.techniques = this.parseTechniques(content);
    }

    if (this.options.parseShaderFunctions) {
      effect.shaderFunctions = this.parseShaderFunctions(content);
    }

    if (this.options.keepComments) {
      effect.comments = this.parseComments(lines);
    }

    // 🎨 转换HLSL到GLSL（如果启用）
    if (this.options.convertToGLSL) {
      effect.glslShaders = this.convertShadersToGLSL(effect);
    }

    return effect;
  }

  /**
   * 转换shader到GLSL
   */
  private convertShadersToGLSL(effect: FXEffect): GLSLShaders | undefined {
    const warnings: string[] = [];

    // 尝试从第一个technique的第一个pass中获取shader函数名
    let vertexShaderName = this.options.vertexShaderFunction;
    let fragmentShaderName = this.options.fragmentShaderFunction;

    if (!vertexShaderName || !fragmentShaderName) {
      // 尝试从technique中自动检测
      if (effect.techniques.length > 0 && effect.techniques[0]?.passes.length > 0) {
        const firstPass = effect.techniques[0].passes[0];
        if (firstPass) {
          vertexShaderName = vertexShaderName || firstPass.vertexShader?.function;
          fragmentShaderName = fragmentShaderName || firstPass.pixelShader?.function;
        }
      }
    }

    if (!vertexShaderName || !fragmentShaderName) {
      warnings.push('Could not determine shader function names. Skipping GLSL conversion.');
      return {
        warnings,
      };
    }

    // 查找shader函数
    const vsFunc = effect.shaderFunctions.find(f => f.name === vertexShaderName);
    const fsFunc = effect.shaderFunctions.find(f => f.name === fragmentShaderName);

    if (!vsFunc || !fsFunc) {
      warnings.push(`Shader functions not found: ${vertexShaderName} or ${fragmentShaderName}`);
      return {
        warnings,
      };
    }

    // 转换顶点着色器
    const vertexResult = this.hlslConverter.convert(vsFunc.body, 'vertex');
    warnings.push(...vertexResult.warnings);

    // 转换片段着色器
    const fragmentResult = this.hlslConverter.convert(fsFunc.body, 'fragment');
    warnings.push(...fragmentResult.warnings);

    return {
      vertexShader: {
        code: vertexResult.glslCode,
        uniforms: vertexResult.uniforms,
        attributes: vertexResult.attributes,
        varyings: vertexResult.varyings,
      },
      fragmentShader: {
        code: fragmentResult.glslCode,
        uniforms: fragmentResult.uniforms,
        attributes: new Map(),
        varyings: fragmentResult.varyings,
      },
      warnings,
    };
  }

  /**
   * 解析宏定义 (#define)
   */
  private parseDefines(lines: string[]): FXDefine[] {
    const defines: FXDefine[] = [];
    const defineRegex = /^\s*(\/\/)?\s*#define\s+(\w+)(?:\s+(.+))?\s*$/;

    lines.forEach((line, index) => {
      const match = line.match(defineRegex);
      if (match) {
        const isCommented = !!match[1];
        const name = match[2];
        const value = match[3]?.trim();

        // 提取行尾注释
        let comment: string | undefined;
        if (value) {
          const commentMatch = value.match(/\/\/(.+)$/);
          if (commentMatch && commentMatch[1]) {
            comment = commentMatch[1].trim();
          }
        }

        defines.push({
          name,
          value: value?.replace(/\/\/.*$/, '').trim() || undefined,
          isCommented,
          lineNumber: index + 1,
          comment,
        });
      }
    });

    return defines;
  }

  /**
   * 解析参数声明
   */
  private parseParameters(lines: string[]): FXParameter[] {
    const parameters: FXParameter[] = [];
    
    // 匹配类型、名称、语义和默认值
    const paramRegex = /^\s*(float|float2|float3|float4|float4x4|texture|sampler|sampler2D|bool|int)\s+(\w+)\s*(?::\s*(\w+))?\s*(?:<([^>]+)>)?\s*(?:=\s*([^;]+))?\s*;/;

    lines.forEach((line, index) => {
      const match = line.match(paramRegex);
      if (match && match[1] && match[2]) {
        const type = match[1];
        const name = match[2];
        const semantic = match[3];
        const annotationsStr = match[4];
        const defaultValue = match[5]?.trim();

        // 解析注解 (annotations)
        let annotations: Record<string, any> | undefined;
        if (annotationsStr) {
          annotations = this.parseAnnotations(annotationsStr);
        }

        parameters.push({
          type,
          name,
          semantic,
          defaultValue,
          annotations,
          lineNumber: index + 1,
        });
      }
    });

    return parameters;
  }

  /**
   * 解析注解 (annotations)
   */
  private parseAnnotations(annotationsStr: string): Record<string, any> {
    const annotations: Record<string, any> = {};
    const annotationRegex = /(string|float|int|bool)\s+(\w+)\s*=\s*"?([^;"]+)"?/g;
    
    let match;
    while ((match = annotationRegex.exec(annotationsStr)) !== null) {
      if (!match[1] || !match[2] || !match[3]) continue;
      
      const type = match[1];
      const name = match[2];
      const value = match[3].trim();

      // 类型转换
      if (type === 'float') {
        annotations[name] = parseFloat(value);
      } else if (type === 'int') {
        annotations[name] = parseInt(value, 10);
      } else if (type === 'bool') {
        annotations[name] = value === 'true';
      } else {
        annotations[name] = value;
      }
    }

    return annotations;
  }

  /**
   * 解析静态变量
   */
  private parseStaticVariables(lines: string[]): FXStaticVariable[] {
    const variables: FXStaticVariable[] = [];
    const staticRegex = /^\s*static\s+(float|float2|float3|float4|bool|int)\s+(\w+)\s*=\s*(.+?);/;

    lines.forEach((line, index) => {
      const match = line.match(staticRegex);
      if (match) {
        variables.push({
          type: match[1],
          name: match[2],
          expression: match[3].trim(),
          lineNumber: index + 1,
        });
      }
    });

    return variables;
  }

  /**
   * 解析纹理引用
   */
  private parseTextures(defines: FXDefine[]): FXTexture[] {
    const textures: FXTexture[] = [];
    const textureDefineRegex = /^BLEND(\w+)TEXTURE$/;

    defines.forEach((define) => {
      const match = define.name.match(textureDefineRegex);
      if (match && define.value && !define.isCommented) {
        const purpose = match[1].toLowerCase();
        const path = define.value.replace(/"/g, '');

        // 查找对应的宽度和高度定义
        const widthDefine = defines.find(d => d.name === `${define.name}_X`);
        const heightDefine = defines.find(d => d.name === `${define.name}_Y`);

        textures.push({
          name: define.name,
          path,
          width: widthDefine?.value ? parseInt(widthDefine.value, 10) : undefined,
          height: heightDefine?.value ? parseInt(heightDefine.value, 10) : undefined,
          purpose,
        });
      }
    });

    return textures;
  }

  /**
   * 解析控制器引用 (CONTROLOBJECT)
   */
  private parseControllers(lines: string[]): FXController[] {
    const controllers: FXController[] = [];
    const controllerRegex = /(\w+)\s*:\s*CONTROLOBJECT\s*<\s*string\s+name\s*=\s*"([^"]+)"\s*;\s*string\s+item\s*=\s*"([^"]+)"\s*>/;

    lines.forEach((line) => {
      const match = line.match(controllerRegex);
      if (match) {
        controllers.push({
          name: match[1],
          objectName: match[2],
          itemName: match[3],
          boundParameter: match[1],
        });
      }
    });

    return controllers;
  }

  /**
   * 解析include指令
   */
  private parseIncludes(lines: string[]): string[] {
    const includes: string[] = [];
    const includeRegex = /^\s*#include\s+"([^"]+)"/;

    lines.forEach((line) => {
      const match = line.match(includeRegex);
      if (match) {
        includes.push(match[1]);
      }
    });

    return includes;
  }

  /**
   * 解析Technique定义
   */
  private parseTechniques(content: string): FXTechnique[] {
    const techniques: FXTechnique[] = [];
    const techniqueRegex = /technique\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;

    let match;
    while ((match = techniqueRegex.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      techniques.push({
        name,
        passes: this.parsePasses(body),
        lineNumber,
      });
    }

    return techniques;
  }

  /**
   * 解析Pass定义
   */
  private parsePasses(techniqueBody: string): FXPass[] {
    const passes: FXPass[] = [];
    const passRegex = /pass\s+(\w+)?\s*\{([^}]+)\}/g;

    let match;
    while ((match = passRegex.exec(techniqueBody)) !== null) {
      const name = match[1];
      const body = match[2];

      const pass: FXPass = {
        name,
        renderStates: {},
      };

      // 解析VertexShader
      const vsMatch = /VertexShader\s*=\s*compile\s+(\w+)\s+(\w+)/i.exec(body);
      if (vsMatch) {
        pass.vertexShader = {
          profile: vsMatch[1],
          function: vsMatch[2],
        };
      }

      // 解析PixelShader
      const psMatch = /PixelShader\s*=\s*compile\s+(\w+)\s+(\w+)/i.exec(body);
      if (psMatch) {
        pass.pixelShader = {
          profile: psMatch[1],
          function: psMatch[2],
        };
      }

      // 解析渲染状态
      const stateRegex = /(\w+)\s*=\s*([^;]+);/g;
      let stateMatch;
      while ((stateMatch = stateRegex.exec(body)) !== null) {
        const stateName = stateMatch[1];
        const stateValue = stateMatch[2].trim();
        
        if (stateName !== 'VertexShader' && stateName !== 'PixelShader') {
          pass.renderStates[stateName] = stateValue;
        }
      }

      passes.push(pass);
    }

    return passes;
  }

  /**
   * 解析着色器函数
   */
  private parseShaderFunctions(content: string): FXShaderFunction[] {
    const functions: FXShaderFunction[] = [];
    
    // 匹配函数定义: returnType functionName(params) : semantic { body }
    const functionRegex = /(struct|void|float|float2|float3|float4)\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*(\w+))?\s*\{/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const returnType = match[1];
      const name = match[2];
      const parameters = match[3];
      const outputSemantic = match[4];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      // 提取函数体（简化版，不处理嵌套花括号）
      const bodyStart = match.index + match[0].length;
      let braceCount = 1;
      let bodyEnd = bodyStart;
      
      for (let i = bodyStart; i < content.length && braceCount > 0; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        bodyEnd = i;
      }

      const body = content.substring(bodyStart, bodyEnd);

      functions.push({
        name,
        returnType,
        parameters,
        body,
        outputSemantic,
        lineNumber,
      });
    }

    return functions;
  }

  /**
   * 解析注释
   */
  private parseComments(lines: string[]): FXComment[] {
    const comments: FXComment[] = [];

    lines.forEach((line, index) => {
      // 单行注释
      const lineCommentMatch = line.match(/^\s*\/\/(.*)$/);
      if (lineCommentMatch) {
        comments.push({
          content: lineCommentMatch[1].trim(),
          type: 'line',
          lineNumber: index + 1,
        });
      }

      // 块注释（简化版，仅处理单行的块注释）
      const blockCommentMatch = line.match(/\/\*(.+?)\*\//);
      if (blockCommentMatch) {
        comments.push({
          content: blockCommentMatch[1].trim(),
          type: 'block',
          lineNumber: index + 1,
        });
      }
    });

    return comments;
  }

  /**
   * 生成FX文件摘要
   */
  generateSummary(effect: FXEffect): FXSummary {
    const enabledDefines = effect.defines
      .filter(d => !d.isCommented)
      .map(d => d.name);

    const disabledDefines = effect.defines
      .filter(d => d.isCommented)
      .map(d => d.name);

    return {
      fileName: effect.fileName,
      defineCount: effect.defines.length,
      parameterCount: effect.parameters.length,
      textureCount: effect.textures.length,
      techniqueCount: effect.techniques.length,
      hasLocalShadow: enabledDefines.includes('USE_LOCALSHADOW'),
      hasExcellentShadow: enabledDefines.includes('USE_EXCELLENTSHADOW'),
      hasHgShadow: enabledDefines.includes('USE_HGSHADOW'),
      enabledDefines,
      disabledDefines,
    };
  }

  /**
   * 提取特定着色器函数的代码
   */
  extractShaderFunction(effect: FXEffect, functionName: string): string | null {
    const func = effect.shaderFunctions.find(f => f.name === functionName);
    if (!func) return null;

    return `${func.returnType} ${func.name}(${func.parameters})${func.outputSemantic ? ' : ' + func.outputSemantic : ''}\n{\n${func.body}\n}`;
  }

  /**
   * 获取所有启用的功能标志
   */
  getEnabledFeatures(effect: FXEffect): string[] {
    return effect.defines
      .filter(d => !d.isCommented && !d.value) // 只有标志，没有值的define
      .map(d => d.name);
  }

  /**
   * 获取配置参数
   */
  getConfigParameters(effect: FXEffect): FXParameter[] {
    return effect.parameters.filter(p => 
      p.annotations?.UIName || p.annotations?.UIWidget
    );
  }
}

