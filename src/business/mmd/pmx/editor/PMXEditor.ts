/**
 * PMX模型编辑器
 * 支持修改材质、纹理绑定等
 */

import type {
  PMXParseResult,
  PMXMaterial,
  PMXTexture,
  MaterialTextureMapping,
} from '../types';

export interface PMXEditOperation {
  type: 'material' | 'texture' | 'binding';
  action: 'add' | 'update' | 'delete';
  target: number; // 材质或纹理索引
  data?: any;
}

export interface PMXEditHistory {
  operation: PMXEditOperation;
  timestamp: number;
  description: string;
}

export class PMXEditor {
  private data: PMXParseResult;
  private history: PMXEditHistory[] = [];
  private historyIndex: number = -1;
  private maxHistory: number = 50;

  constructor(parseResult: PMXParseResult) {
    this.data = JSON.parse(JSON.stringify(parseResult)); // 深拷贝
  }

  /**
   * 获取当前数据
   */
  getData(): PMXParseResult {
    return this.data;
  }

  /**
   * 获取编辑历史
   */
  getHistory(): PMXEditHistory[] {
    return this.history.slice(0, this.historyIndex + 1);
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * 撤销
   */
  undo(): boolean {
    if (!this.canUndo()) return false;
    // TODO: 实现撤销逻辑
    this.historyIndex--;
    return true;
  }

  /**
   * 重做
   */
  redo(): boolean {
    if (!this.canRedo()) return false;
    // TODO: 实现重做逻辑
    this.historyIndex++;
    return true;
  }

  /**
   * 添加纹理
   */
  addTexture(path: string): number {
    const newTexture: PMXTexture = {
      index: this.data.textures.length,
      path,
    };

    this.data.textures.push(newTexture);

    this.recordHistory({
      type: 'texture',
      action: 'add',
      target: newTexture.index,
      data: { path },
    }, '添加纹理: ' + (path));

    return newTexture.index;
  }

  /**
   * 更新纹理路径
   */
  updateTexture(index: number, newPath: string): boolean {
    if (index < 0 || index >= this.data.textures.length) {
      throw new Error('Invalid texture index: ' + (index));
    }

    const oldPath = this.data.textures[index]!.path;
    this.data.textures[index]!.path = newPath;

    this.recordHistory({
      type: 'texture',
      action: 'update',
      target: index,
      data: { oldPath, newPath },
    }, '更新纹理 #' + (index) + ': ' + (oldPath) + ' → ' + (newPath));

    return true;
  }

  /**
   * 删除纹理
   */
  deleteTexture(index: number): boolean {
    if (index < 0 || index >= this.data.textures.length) {
      throw new Error('Invalid texture index: ' + (index));
    }

    // 检查是否有材质使用此纹理
    const usedByMaterials = this.data.materials.filter(
      m => m.textureIndex === index ||
        m.sphereTextureIndex === index ||
        (!m.isSharedToon && m.toonTextureIndex === index)
    );

    if (usedByMaterials.length > 0) {
      throw new Error('纹理 #' + (index) + ' 正在被 ' + (usedByMaterials.length) + ' 个材质使用，无法删除');
    }

    const deletedTexture = this.data.textures.splice(index, 1)[0];
    if (!deletedTexture) return false;

    // 更新后续纹理的索引
    this.data.textures.forEach((tex, i) => {
      tex.index = i;
    });

    // 更新材质中大于此索引的纹理引用
    this.data.materials.forEach(material => {
      if (material.textureIndex > index) material.textureIndex--;
      if (material.sphereTextureIndex > index) material.sphereTextureIndex--;
      if (!material.isSharedToon && material.toonTextureIndex > index) {
        material.toonTextureIndex--;
      }
    });

    // 重新生成映射
    this.regenerateMappings();

    this.recordHistory({
      type: 'texture',
      action: 'delete',
      target: index,
      data: { path: deletedTexture.path },
    }, '删除纹理 #' + (index) + ': ' + (deletedTexture.path));

    return true;
  }

  /**
   * 更新材质的主纹理绑定
   */
  setMaterialMainTexture(materialIndex: number, textureIndex: number): boolean {
    if (materialIndex < 0 || materialIndex >= this.data.materials.length) {
      throw new Error('Invalid material index: ' + (materialIndex));
    }

    if (textureIndex !== -1 && (textureIndex < 0 || textureIndex >= this.data.textures.length)) {
      throw new Error('Invalid texture index: ' + (textureIndex));
    }

    const material = this.data.materials[materialIndex]!;
    const oldIndex = material.textureIndex;
    material.textureIndex = textureIndex;

    // 重新生成映射
    this.regenerateMappings();

    this.recordHistory({
      type: 'binding',
      action: 'update',
      target: materialIndex,
      data: {
        bindingType: 'main',
        oldIndex,
        newIndex: textureIndex
      },
    }, '材质 #' + (materialIndex) + ' 主纹理: #' + (oldIndex) + ' → #' + (textureIndex));

    return true;
  }

  /**
   * 更新材质的Sphere纹理绑定
   */
  setMaterialSphereTexture(
    materialIndex: number,
    textureIndex: number,
    mode: number = 1
  ): boolean {
    if (materialIndex < 0 || materialIndex >= this.data.materials.length) {
      throw new Error('Invalid material index: ' + (materialIndex));
    }

    if (textureIndex !== -1 && (textureIndex < 0 || textureIndex >= this.data.textures.length)) {
      throw new Error('Invalid texture index: ' + (textureIndex));
    }

    const material = this.data.materials[materialIndex]!;
    const oldIndex = material.sphereTextureIndex;
    const oldMode = material.sphereMode;

    material.sphereTextureIndex = textureIndex;
    material.sphereMode = textureIndex === -1 ? 0 : mode;

    // 重新生成映射
    this.regenerateMappings();

    this.recordHistory({
      type: 'binding',
      action: 'update',
      target: materialIndex,
      data: {
        bindingType: 'sphere',
        oldIndex,
        newIndex: textureIndex,
        oldMode,
        newMode: mode
      },
    }, '材质 #' + (materialIndex) + ' Sphere纹理: #' + (oldIndex) + ' → #' + (textureIndex) + ' (模式: ' + (mode) + ')');

    return true;
  }

  /**
   * 更新材质的Toon纹理绑定
   */
  setMaterialToonTexture(
    materialIndex: number,
    textureIndex: number,
    isShared: boolean = false
  ): boolean {
    if (materialIndex < 0 || materialIndex >= this.data.materials.length) {
      throw new Error('Invalid material index: ' + (materialIndex));
    }

    if (!isShared && textureIndex !== -1 &&
      (textureIndex < 0 || textureIndex >= this.data.textures.length)) {
      throw new Error('Invalid texture index: ' + (textureIndex));
    }

    const material = this.data.materials[materialIndex]!;
    const oldIndex = material.toonTextureIndex;
    const oldShared = material.isSharedToon;

    material.toonTextureIndex = textureIndex;
    material.isSharedToon = isShared;

    // 重新生成映射
    this.regenerateMappings();

    this.recordHistory({
      type: 'binding',
      action: 'update',
      target: materialIndex,
      data: {
        bindingType: 'toon',
        oldIndex,
        newIndex: textureIndex,
        oldShared,
        isShared
      },
    }, '材质 #' + (materialIndex) + ' Toon纹理: #' + (oldIndex) + ' → #' + (textureIndex) + ' (共享: ' + (isShared) + ')');

    return true;
  }

  /**
   * 更新材质属性
   */
  updateMaterial(materialIndex: number, updates: Partial<PMXMaterial>): boolean {
    if (materialIndex < 0 || materialIndex >= this.data.materials.length) {
      throw new Error('Invalid material index: ' + (materialIndex));
    }

    const material = this.data.materials[materialIndex]!;
    const oldData = { ...material };

    // 手动合并属性，避免 TS 类型问题
    if (updates.name !== undefined) material.name = updates.name;
    if (updates.nameEnglish !== undefined) material.nameEnglish = updates.nameEnglish;
    if (updates.diffuse !== undefined) material.diffuse = updates.diffuse;
    if (updates.specular !== undefined) material.specular = updates.specular;
    if (updates.specularStrength !== undefined) material.specularStrength = updates.specularStrength;
    if (updates.ambient !== undefined) material.ambient = updates.ambient;
    if (updates.drawingFlags !== undefined) material.drawingFlags = updates.drawingFlags;
    if (updates.edgeColor !== undefined) material.edgeColor = updates.edgeColor;
    if (updates.edgeSize !== undefined) material.edgeSize = updates.edgeSize;
    if (updates.textureIndex !== undefined) material.textureIndex = updates.textureIndex;
    if (updates.sphereTextureIndex !== undefined) material.sphereTextureIndex = updates.sphereTextureIndex;
    if (updates.sphereMode !== undefined) material.sphereMode = updates.sphereMode;
    if (updates.isSharedToon !== undefined) material.isSharedToon = updates.isSharedToon;
    if (updates.toonTextureIndex !== undefined) material.toonTextureIndex = updates.toonTextureIndex;
    if (updates.memo !== undefined) material.memo = updates.memo;
    if (updates.surfaceCount !== undefined) material.surfaceCount = updates.surfaceCount;

    // 重新生成映射
    this.regenerateMappings();

    this.recordHistory({
      type: 'material',
      action: 'update',
      target: materialIndex,
      data: { oldData, updates },
    }, '更新材质 #' + (materialIndex) + ': ' + (material.name));

    return true;
  }

  /**
   * 重新生成材质纹理映射
   */
  private regenerateMappings(): void {
    const sphereModeMap = ['none', 'multiply', 'add', 'subTexture'] as const;

    this.data.materialTextureMappings = this.data.materials.map((material, index) => {
      const mapping: MaterialTextureMapping = {
        materialIndex: index,
        materialName: material.name,
        materialNameEnglish: material.nameEnglish,
        surfaceCount: material.surfaceCount,
      };

      // 主纹理
      if (material.textureIndex >= 0 && material.textureIndex < this.data.textures.length) {
        mapping.mainTexture = {
          index: material.textureIndex,
          path: this.data.textures[material.textureIndex]!.path,
        };
      }

      // Sphere纹理
      if (
        material.sphereTextureIndex >= 0 &&
        material.sphereTextureIndex < this.data.textures.length &&
        material.sphereMode > 0
      ) {
        mapping.sphereTexture = {
          index: material.sphereTextureIndex,
          path: this.data.textures[material.sphereTextureIndex]!.path,
          mode: sphereModeMap[material.sphereMode] as 'multiply' | 'add' | 'subTexture',
        };
      }

      // Toon纹理
      if (material.isSharedToon) {
        mapping.toonTexture = {
          index: material.toonTextureIndex,
          path: 'toon' + (String(material.toonTextureIndex).padStart(2, '0')) + '.bmp',
          isShared: true,
        };
      } else if (
        material.toonTextureIndex >= 0 &&
        material.toonTextureIndex < this.data.textures.length
      ) {
        mapping.toonTexture = {
          index: material.toonTextureIndex,
          path: this.data.textures[material.toonTextureIndex]!.path,
          isShared: false,
        };
      }

      return mapping;
    });
  }

  /**
   * 记录历史
   */
  private recordHistory(operation: PMXEditOperation, description: string): void {
    // 如果当前不在历史末尾，删除后面的历史
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 添加新历史
    this.history.push({
      operation,
      timestamp: Date.now(),
      description,
    });

    // 限制历史长度
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      textures: this.data.textures.length,
      materials: this.data.materials.length,
      vertices: this.data.vertexCount,
      faces: this.data.faceCount,
      unusedTextures: this.getUnusedTextures().length,
      editHistory: this.history.length,
    };
  }

  /**
   * 获取未使用的纹理
   */
  getUnusedTextures(): PMXTexture[] {
    const usedIndices = new Set<number>();

    this.data.materials.forEach(material => {
      if (material.textureIndex >= 0) usedIndices.add(material.textureIndex);
      if (material.sphereTextureIndex >= 0) usedIndices.add(material.sphereTextureIndex);
      if (!material.isSharedToon && material.toonTextureIndex >= 0) {
        usedIndices.add(material.toonTextureIndex);
      }
    });

    return this.data.textures.filter(tex => !usedIndices.has(tex.index));
  }
}

