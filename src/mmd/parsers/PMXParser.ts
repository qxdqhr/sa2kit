/**
 * PMX模型文件解析器
 * 用于解析PMX格式的MMD模型文件，提取纹理映射关系
 */

import {
  PMXHeader,
  PMXModelInfo,
  PMXMaterial,
  PMXTexture,
  PMXParseResult,
  MaterialTextureMapping,
} from './types';

export class PMXParser {
  private view!: DataView;
  private offset: number = 0;
  private textEncoding: 'utf16le' | 'utf8' = 'utf16le';
  private textureIndexSize: number = 1;
  private additionalVec4Count: number = 0;
  private vertexIndexSize: number = 1;
  private boneIndexSize: number = 1;
  
  /**
   * 从URL加载并解析PMX文件
   */
  async loadAndParse(url: string): Promise<PMXParseResult> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load PMX file: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    return this.parse(buffer);
  }
  
  /**
   * 解析PMX文件
   */
  parse(buffer: ArrayBuffer): PMXParseResult {
    this.view = new DataView(buffer);
    this.offset = 0;
    
    console.log('[PMXParser] Starting parse, file size:', buffer.byteLength);
    
    // 1. 解析头部
    const header = this.parseHeader();
    console.log('[PMXParser] Header parsed, offset:', this.offset);
    console.log('[PMXParser] Globals:', header.globals);
    
    // 2. 解析模型信息
    const modelInfo = this.parseModelInfo();
    console.log('[PMXParser] Model info parsed, offset:', this.offset);
    console.log('[PMXParser] Model name:', modelInfo.modelName);
    
    // 3. 解析顶点（只统计数量，不解析详细数据以提高性能）
    const vertexCount = this.skipVertices();
    console.log('[PMXParser] Vertices skipped, count:', vertexCount, 'offset:', this.offset);
    
    // 4. 解析面（只统计数量）
    const faceCount = this.skipFaces();
    console.log('[PMXParser] Faces skipped, count:', faceCount, 'offset:', this.offset);
    
    // 5. 解析纹理列表
    const textures = this.parseTextures();
    console.log('[PMXParser] Textures parsed, count:', textures.length, 'offset:', this.offset);
    
    // 6. 解析材质
    const materials = this.parseMaterials();
    console.log('[PMXParser] Materials parsed, count:', materials.length, 'offset:', this.offset);
    
    // 7. 生成材质纹理映射
    const materialTextureMappings = this.generateMaterialTextureMappings(
      materials,
      textures
    );
    
    return {
      header,
      modelInfo,
      textures,
      materials,
      materialTextureMappings,
      vertexCount,
      faceCount,
    };
  }
  
  /**
   * 解析文件头
   */
  private parseHeader(): PMXHeader {
    // 签名 "PMX " (4 bytes)
    const signature = this.readString(4);
    if (signature !== 'PMX ') {
      throw new Error(`Invalid PMX signature: ${signature}`);
    }
    
    // 版本号 (4 bytes float)
    const version = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    
    // 全局设置数量 (1 byte)
    const globalsCount = this.view.getUint8(this.offset);
    this.offset += 1;
    
    if (globalsCount !== 8) {
      throw new Error(`Unexpected globals count: ${globalsCount}`);
    }
    
    // 读取全局设置
    const encoding = this.view.getUint8(this.offset);
    this.offset += 1;
    this.textEncoding = encoding === 0 ? 'utf16le' : 'utf8';
    
    const additionalVec4Count = this.view.getUint8(this.offset);
    this.offset += 1;
    this.additionalVec4Count = additionalVec4Count;
    
    const vertexIndexSize = this.view.getUint8(this.offset);
    this.offset += 1;
    this.vertexIndexSize = vertexIndexSize;
    
    const textureIndexSize = this.view.getUint8(this.offset);
    this.offset += 1;
    this.textureIndexSize = textureIndexSize;
    
    const materialIndexSize = this.view.getUint8(this.offset);
    this.offset += 1;
    
    const boneIndexSize = this.view.getUint8(this.offset);
    this.offset += 1;
    this.boneIndexSize = boneIndexSize;
    
    const morphIndexSize = this.view.getUint8(this.offset);
    this.offset += 1;
    
    const rigidBodyIndexSize = this.view.getUint8(this.offset);
    this.offset += 1;
    
    return {
      signature,
      version,
      globals: {
        encoding,
        additionalVec4Count,
        vertexIndexSize,
        textureIndexSize,
        materialIndexSize,
        boneIndexSize,
        morphIndexSize,
        rigidBodyIndexSize,
      },
    };
  }
  
  /**
   * 解析模型信息
   */
  private parseModelInfo(): PMXModelInfo {
    const modelName = this.readTextBuffer();
    const modelNameEnglish = this.readTextBuffer();
    const comment = this.readTextBuffer();
    const commentEnglish = this.readTextBuffer();
    
    return {
      modelName,
      modelNameEnglish,
      comment,
      commentEnglish,
    };
  }
  
  /**
   * 跳过顶点数据（只返回数量）
   */
  private skipVertices(): number {
    const count = this.view.getInt32(this.offset, true);
    this.offset += 4;
    
    // 跳过所有顶点数据
    // 每个顶点的大小是可变的，需要根据权重类型计算
    for (let i = 0; i < count; i++) {
      // Position (12 bytes)
      this.offset += 12;
      // Normal (12 bytes)
      this.offset += 12;
      // UV (8 bytes)
      this.offset += 8;
      
      // Additional UV (使用保存的additionalVec4Count)
      this.offset += this.additionalVec4Count * 16;
      
      // Weight type
      const weightType = this.view.getUint8(this.offset);
      this.offset += 1;
      
      // 根据权重类型跳过不同大小的数据
      this.skipVertexWeight(weightType);
      
      // Edge scale (4 bytes)
      this.offset += 4;
    }
    
    return count;
  }
  
  /**
   * 跳过顶点权重数据
   */
  private skipVertexWeight(weightType: number): void {
    switch (weightType) {
      case 0: // BDEF1
        this.offset += this.boneIndexSize;
        break;
      case 1: // BDEF2
        this.offset += this.boneIndexSize * 2 + 4;
        break;
      case 2: // BDEF4
        this.offset += this.boneIndexSize * 4 + 16;
        break;
      case 3: // SDEF
        this.offset += this.boneIndexSize * 2 + 4 + 36;
        break;
      case 4: // QDEF
        this.offset += this.boneIndexSize * 4 + 16;
        break;
    }
  }
  
  /**
   * 跳过面数据（只返回数量）
   */
  private skipFaces(): number {
    const count = this.view.getInt32(this.offset, true);
    this.offset += 4;
    
    this.offset += count * this.vertexIndexSize;
    
    return count / 3; // 返回面数（每个面3个顶点）
  }
  
  /**
   * 解析纹理列表
   */
  private parseTextures(): PMXTexture[] {
    const count = this.view.getInt32(this.offset, true);
    this.offset += 4;
    
    console.log('[PMXParser] Parsing textures, count:', count);
    
    if (count < 0 || count > 10000) {
      throw new Error(`Invalid texture count: ${count} at offset ${this.offset - 4}`);
    }
    
    const textures: PMXTexture[] = [];
    
    for (let i = 0; i < count; i++) {
      const path = this.readTextBuffer();
      textures.push({
        index: i,
        path,
      });
      console.log(`[PMXParser]   Texture ${i}: ${path}`);
    }
    
    return textures;
  }
  
  /**
   * 解析材质列表
   */
  private parseMaterials(): PMXMaterial[] {
    const count = this.view.getInt32(this.offset, true);
    this.offset += 4;
    
    const materials: PMXMaterial[] = [];
    
    for (let i = 0; i < count; i++) {
      // 材质名称
      const name = this.readTextBuffer();
      const nameEnglish = this.readTextBuffer();
      
      // 颜色信息
      const diffuse: [number, number, number, number] = [
        this.view.getFloat32(this.offset, true),
        this.view.getFloat32(this.offset + 4, true),
        this.view.getFloat32(this.offset + 8, true),
        this.view.getFloat32(this.offset + 12, true),
      ];
      this.offset += 16;
      
      const specular: [number, number, number] = [
        this.view.getFloat32(this.offset, true),
        this.view.getFloat32(this.offset + 4, true),
        this.view.getFloat32(this.offset + 8, true),
      ];
      this.offset += 12;
      
      const specularStrength = this.view.getFloat32(this.offset, true);
      this.offset += 4;
      
      const ambient: [number, number, number] = [
        this.view.getFloat32(this.offset, true),
        this.view.getFloat32(this.offset + 4, true),
        this.view.getFloat32(this.offset + 8, true),
      ];
      this.offset += 12;
      
      // 绘制标志
      const drawingFlags = this.view.getUint8(this.offset);
      this.offset += 1;
      
      // 边缘信息
      const edgeColor: [number, number, number, number] = [
        this.view.getFloat32(this.offset, true),
        this.view.getFloat32(this.offset + 4, true),
        this.view.getFloat32(this.offset + 8, true),
        this.view.getFloat32(this.offset + 12, true),
      ];
      this.offset += 16;
      
      const edgeSize = this.view.getFloat32(this.offset, true);
      this.offset += 4;
      
      // 纹理信息
      const textureIndex = this.readIndex(this.textureIndexSize);
      const sphereTextureIndex = this.readIndex(this.textureIndexSize);
      const sphereMode = this.view.getUint8(this.offset);
      this.offset += 1;
      
      // Toon信息
      const isSharedToon = this.view.getUint8(this.offset) === 1;
      this.offset += 1;
      
      const toonTextureIndex = isSharedToon
        ? this.view.getUint8(this.offset++)
        : this.readIndex(this.textureIndexSize);
      
      // 备注
      const memo = this.readTextBuffer();
      
      // 面数
      const surfaceCount = this.view.getInt32(this.offset, true);
      this.offset += 4;
      
      materials.push({
        name,
        nameEnglish,
        diffuse,
        specular,
        specularStrength,
        ambient,
        drawingFlags,
        edgeColor,
        edgeSize,
        textureIndex,
        sphereTextureIndex,
        sphereMode,
        isSharedToon,
        toonTextureIndex,
        memo,
        surfaceCount,
      });
    }
    
    return materials;
  }
  
  /**
   * 生成材质纹理映射
   */
  private generateMaterialTextureMappings(
    materials: PMXMaterial[],
    textures: PMXTexture[]
  ): MaterialTextureMapping[] {
    const sphereModeMap = ['none', 'multiply', 'add', 'subTexture'] as const;
    
    return materials.map((material, index) => {
      const mapping: MaterialTextureMapping = {
        materialIndex: index,
        materialName: material.name,
        materialNameEnglish: material.nameEnglish,
        surfaceCount: material.surfaceCount,
      };
      
      // 主纹理
      if (material.textureIndex >= 0 && material.textureIndex < textures.length) {
        mapping.mainTexture = {
          index: material.textureIndex,
          path: textures[material.textureIndex].path,
        };
      }
      
      // Sphere纹理
      if (
        material.sphereTextureIndex >= 0 &&
        material.sphereTextureIndex < textures.length &&
        material.sphereMode > 0
      ) {
        mapping.sphereTexture = {
          index: material.sphereTextureIndex,
          path: textures[material.sphereTextureIndex].path,
          mode: sphereModeMap[material.sphereMode] as 'multiply' | 'add' | 'subTexture',
        };
      }
      
      // Toon纹理
      if (material.isSharedToon) {
        mapping.toonTexture = {
          index: material.toonTextureIndex,
          path: `toon${String(material.toonTextureIndex).padStart(2, '0')}.bmp`,
          isShared: true,
        };
      } else if (
        material.toonTextureIndex >= 0 &&
        material.toonTextureIndex < textures.length
      ) {
        mapping.toonTexture = {
          index: material.toonTextureIndex,
          path: textures[material.toonTextureIndex].path,
          isShared: false,
        };
      }
      
      return mapping;
    });
  }
  
  /**
   * 读取文本缓冲区
   */
  private readTextBuffer(): string {
    const length = this.view.getInt32(this.offset, true);
    this.offset += 4;
    
    if (length === 0) return '';
    
    // 添加边界检查
    if (length < 0 || length > 10000000) { // 10MB 限制
      throw new Error(`Invalid text buffer length: ${length} at offset ${this.offset - 4}`);
    }
    
    if (this.offset + length > this.view.buffer.byteLength) {
      throw new Error(`Text buffer extends beyond file boundary: offset=${this.offset}, length=${length}, fileSize=${this.view.buffer.byteLength}`);
    }
    
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    this.offset += length;
    
    if (this.textEncoding === 'utf8') {
      return new TextDecoder('utf-8').decode(bytes);
    } else {
      return new TextDecoder('utf-16le').decode(bytes);
    }
  }
  
  /**
   * 读取固定长度字符串
   */
  private readString(length: number): string {
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    this.offset += length;
    return new TextDecoder('ascii').decode(bytes);
  }
  
  /**
   * 读取索引
   */
  private readIndex(size: number): number {
    let value: number;
    
    switch (size) {
      case 1:
        value = this.view.getInt8(this.offset);
        break;
      case 2:
        value = this.view.getInt16(this.offset, true);
        break;
      case 4:
        value = this.view.getInt32(this.offset, true);
        break;
      default:
        throw new Error(`Invalid index size: ${size}`);
    }
    
    this.offset += size;
    return value;
  }
}

