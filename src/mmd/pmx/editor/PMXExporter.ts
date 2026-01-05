/**
 * PMX模型导出器
 * 将编辑后的PMX数据导出为二进制文件
 */

import type { PMXParseResult } from '../types';

export class PMXExporter {
  private data: PMXParseResult;
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset: number = 0;

  constructor(data: PMXParseResult) {
    this.data = data;
    // 预分配缓冲区（估算大小）
    const estimatedSize = this.estimateSize();
    this.buffer = new ArrayBuffer(estimatedSize);
    this.view = new DataView(this.buffer);
  }

  /**
   * 导出为ArrayBuffer
   */
  export(): ArrayBuffer {
    this.offset = 0;
    
    // 1. 写入头部
    this.writeHeader();
    
    // 2. 写入模型信息
    this.writeModelInfo();
    
    // 3. 写入顶点（注：我们没有完整的顶点数据，这里写入占位符）
    this.writeVertexPlaceholder();
    
    // 4. 写入面（注：我们没有完整的面数据，这里写入占位符）
    this.writeFacePlaceholder();
    
    // 5. 写入纹理列表
    this.writeTextures();
    
    // 6. 写入材质
    this.writeMaterials();
    
    // 返回实际使用的缓冲区
    return this.buffer.slice(0, this.offset);
  }

  /**
   * 导出为Blob
   */
  exportAsBlob(): Blob {
    const arrayBuffer = this.export();
    return new Blob([arrayBuffer], { type: 'application/octet-stream' });
  }

  /**
   * 导出并下载
   */
  exportAndDownload(filename: string = 'model.pmx'): void {
    const blob = this.exportAsBlob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 估算文件大小
   */
  private estimateSize(): number {
    let size = 0;
    
    // Header
    size += 100;
    
    // Model Info
    size += 1000;
    
    // Vertices (placeholder)
    size += 100;
    
    // Faces (placeholder)
    size += 100;
    
    // Textures
    this.data.textures.forEach(tex => {
      size += 4 + tex.path.length * 2; // UTF-16
    });
    
    // Materials
    size += this.data.materials.length * 200;
    
    // 额外空间
    size += 10000;
    
    return size;
  }

  /**
   * 写入头部
   */
  private writeHeader(): void {
    const { header } = this.data;
    
    // 签名 "PMX "
    this.writeString('PMX ', 4);
    
    // 版本号
    this.view.setFloat32(this.offset, header.version, true);
    this.offset += 4;
    
    // 全局设置数量
    this.view.setUint8(this.offset, 8);
    this.offset += 1;
    
    // 全局设置
    this.view.setUint8(this.offset, header.globals.encoding);
    this.offset += 1;
    
    this.view.setUint8(this.offset, header.globals.additionalVec4Count);
    this.offset += 1;
    
    this.view.setUint8(this.offset, header.globals.vertexIndexSize);
    this.offset += 1;
    
    this.view.setUint8(this.offset, header.globals.textureIndexSize);
    this.offset += 1;
    
    this.view.setUint8(this.offset, header.globals.materialIndexSize);
    this.offset += 1;
    
    this.view.setUint8(this.offset, header.globals.boneIndexSize);
    this.offset += 1;
    
    this.view.setUint8(this.offset, header.globals.morphIndexSize);
    this.offset += 1;
    
    this.view.setUint8(this.offset, header.globals.rigidBodyIndexSize);
    this.offset += 1;
  }

  /**
   * 写入模型信息
   */
  private writeModelInfo(): void {
    const { modelInfo } = this.data;
    const encoding = this.data.header.globals.encoding === 0 ? 'utf16le' : 'utf8';
    
    this.writeTextBuffer(modelInfo.modelName, encoding);
    this.writeTextBuffer(modelInfo.modelNameEnglish, encoding);
    this.writeTextBuffer(modelInfo.comment, encoding);
    this.writeTextBuffer(modelInfo.commentEnglish, encoding);
  }

  /**
   * 写入顶点占位符
   */
  private writeVertexPlaceholder(): void {
    // 警告：这里只写入数量，实际顶点数据被忽略
    // 完整实现需要保存原始顶点数据
    this.view.setInt32(this.offset, 0, true); // 0个顶点
    this.offset += 4;
    
    console.warn('[PMXExporter] 顶点数据未导出（解析器未保存完整顶点数据）');
  }

  /**
   * 写入面占位符
   */
  private writeFacePlaceholder(): void {
    // 警告：这里只写入数量，实际面数据被忽略
    this.view.setInt32(this.offset, 0, true); // 0个面索引
    this.offset += 4;
    
    console.warn('[PMXExporter] 面数据未导出（解析器未保存完整面数据）');
  }

  /**
   * 写入纹理列表
   */
  private writeTextures(): void {
    const encoding = this.data.header.globals.encoding === 0 ? 'utf16le' : 'utf8';
    
    this.view.setInt32(this.offset, this.data.textures.length, true);
    this.offset += 4;
    
    this.data.textures.forEach(texture => {
      this.writeTextBuffer(texture.path, encoding);
    });
  }

  /**
   * 写入材质
   */
  private writeMaterials(): void {
    const encoding = this.data.header.globals.encoding === 0 ? 'utf16le' : 'utf8';
    const textureIndexSize = this.data.header.globals.textureIndexSize;
    
    this.view.setInt32(this.offset, this.data.materials.length, true);
    this.offset += 4;
    
    this.data.materials.forEach(material => {
      // 材质名称
      this.writeTextBuffer(material.name, encoding);
      this.writeTextBuffer(material.nameEnglish, encoding);
      
      // 颜色信息
      this.view.setFloat32(this.offset, material.diffuse[0], true);
      this.view.setFloat32(this.offset + 4, material.diffuse[1], true);
      this.view.setFloat32(this.offset + 8, material.diffuse[2], true);
      this.view.setFloat32(this.offset + 12, material.diffuse[3], true);
      this.offset += 16;
      
      this.view.setFloat32(this.offset, material.specular[0], true);
      this.view.setFloat32(this.offset + 4, material.specular[1], true);
      this.view.setFloat32(this.offset + 8, material.specular[2], true);
      this.offset += 12;
      
      this.view.setFloat32(this.offset, material.specularStrength, true);
      this.offset += 4;
      
      this.view.setFloat32(this.offset, material.ambient[0], true);
      this.view.setFloat32(this.offset + 4, material.ambient[1], true);
      this.view.setFloat32(this.offset + 8, material.ambient[2], true);
      this.offset += 12;
      
      // 绘制标志
      this.view.setUint8(this.offset, material.drawingFlags);
      this.offset += 1;
      
      // 边缘信息
      this.view.setFloat32(this.offset, material.edgeColor[0], true);
      this.view.setFloat32(this.offset + 4, material.edgeColor[1], true);
      this.view.setFloat32(this.offset + 8, material.edgeColor[2], true);
      this.view.setFloat32(this.offset + 12, material.edgeColor[3], true);
      this.offset += 16;
      
      this.view.setFloat32(this.offset, material.edgeSize, true);
      this.offset += 4;
      
      // 纹理信息
      this.writeIndex(material.textureIndex, textureIndexSize);
      this.writeIndex(material.sphereTextureIndex, textureIndexSize);
      
      this.view.setUint8(this.offset, material.sphereMode);
      this.offset += 1;
      
      // Toon信息
      this.view.setUint8(this.offset, material.isSharedToon ? 1 : 0);
      this.offset += 1;
      
      if (material.isSharedToon) {
        this.view.setUint8(this.offset, material.toonTextureIndex);
        this.offset += 1;
      } else {
        this.writeIndex(material.toonTextureIndex, textureIndexSize);
      }
      
      // 备注
      this.writeTextBuffer(material.memo, encoding);
      
      // 面数
      this.view.setInt32(this.offset, material.surfaceCount, true);
      this.offset += 4;
    });
  }

  /**
   * 写入文本缓冲区
   */
  private writeTextBuffer(text: string, encoding: 'utf16le' | 'utf8'): void {
    if (!text) {
      this.view.setInt32(this.offset, 0, true);
      this.offset += 4;
      return;
    }
    
    const encoder = new TextEncoder();
    let bytes: Uint8Array;
    
    if (encoding === 'utf8') {
      bytes = encoder.encode(text);
    } else {
      // UTF-16LE encoding
      bytes = new Uint8Array(text.length * 2);
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        bytes[i * 2] = code & 0xFF;
        bytes[i * 2 + 1] = (code >> 8) & 0xFF;
      }
    }
    
    this.view.setInt32(this.offset, bytes.length, true);
    this.offset += 4;
    
    new Uint8Array(this.buffer, this.offset, bytes.length).set(bytes);
    this.offset += bytes.length;
  }

  /**
   * 写入固定长度字符串
   */
  private writeString(str: string, length: number): void {
    const bytes = new TextEncoder().encode(str);
    new Uint8Array(this.buffer, this.offset, Math.min(bytes.length, length)).set(bytes);
    this.offset += length;
  }

  /**
   * 写入索引
   */
  private writeIndex(value: number, size: number): void {
    switch (size) {
      case 1:
        this.view.setInt8(this.offset, value);
        break;
      case 2:
        this.view.setInt16(this.offset, value, true);
        break;
      case 4:
        this.view.setInt32(this.offset, value, true);
        break;
      default:
        throw new Error(`Invalid index size: ${size}`);
    }
    this.offset += size;
  }
}



