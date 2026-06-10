/**
 * PMX模型解析器类型定义
 */

/**
 * PMX文件头信息
 */
export interface PMXHeader {
  /** 文件签名 "PMX " */
  signature: string;
  /** PMX版本号 */
  version: number;
  /** 全局设置 */
  globals: {
    /** 文本编码 (0=UTF16LE, 1=UTF8) */
    encoding: number;
    /** 追加UV数 */
    additionalVec4Count: number;
    /** 顶点索引大小 */
    vertexIndexSize: number;
    /** 纹理索引大小 */
    textureIndexSize: number;
    /** 材质索引大小 */
    materialIndexSize: number;
    /** 骨骼索引大小 */
    boneIndexSize: number;
    /** Morph索引大小 */
    morphIndexSize: number;
    /** 刚体索引大小 */
    rigidBodyIndexSize: number;
  };
}

/**
 * PMX模型信息
 */
export interface PMXModelInfo {
  /** 模型名称 (本地) */
  modelName: string;
  /** 模型名称 (英文) */
  modelNameEnglish: string;
  /** 注释 (本地) */
  comment: string;
  /** 注释 (英文) */
  commentEnglish: string;
}

/**
 * PMX顶点信息
 */
export interface PMXVertex {
  /** 位置 */
  position: [number, number, number];
  /** 法线 */
  normal: [number, number, number];
  /** UV坐标 */
  uv: [number, number];
  /** 追加UV */
  additionalVec4?: number[][];
  /** 权重类型 */
  weightType: number;
  /** 骨骼索引 */
  boneIndices: number[];
  /** 骨骼权重 */
  boneWeights: number[];
  /** 边缘倍率 */
  edgeScale: number;
}

/**
 * PMX材质信息
 */
export interface PMXMaterial {
  /** 材质名称 (本地) */
  name: string;
  /** 材质名称 (英文) */
  nameEnglish: string;
  
  /** 漫反射颜色 (RGBA) */
  diffuse: [number, number, number, number];
  /** 镜面反射颜色 (RGB) */
  specular: [number, number, number];
  /** 镜面反射强度 */
  specularStrength: number;
  /** 环境光颜色 (RGB) */
  ambient: [number, number, number];
  
  /** 绘制标志 */
  drawingFlags: number;
  /** 边缘颜色 (RGBA) */
  edgeColor: [number, number, number, number];
  /** 边缘大小 */
  edgeSize: number;
  
  /** 纹理索引 */
  textureIndex: number;
  /** Sphere纹理索引 */
  sphereTextureIndex: number;
  /** Sphere模式 (0=无, 1=乘, 2=加, 3=副纹理) */
  sphereMode: number;
  
  /** 是否使用共享Toon */
  isSharedToon: boolean;
  /** Toon纹理索引/共享Toon索引 */
  toonTextureIndex: number;
  
  /** 备注 */
  memo: string;
  /** 面数 */
  surfaceCount: number;
}

/**
 * PMX纹理信息
 */
export interface PMXTexture {
  /** 纹理路径 */
  path: string;
  /** 纹理索引 */
  index: number;
}

/**
 * 材质与纹理的映射关系
 */
export interface MaterialTextureMapping {
  /** 材质索引 */
  materialIndex: number;
  /** 材质名称 */
  materialName: string;
  /** 材质名称(英文) */
  materialNameEnglish: string;
  
  /** 主纹理 */
  mainTexture?: {
    index: number;
    path: string;
  };
  
  /** Sphere纹理 */
  sphereTexture?: {
    index: number;
    path: string;
    mode: 'multiply' | 'add' | 'subTexture';
  };
  
  /** Toon纹理 */
  toonTexture?: {
    index: number;
    path: string;
    isShared: boolean;
  };
  
  /** 面数 */
  surfaceCount: number;
}

/**
 * PMX解析结果
 */
export interface PMXParseResult {
  /** 头信息 */
  header: PMXHeader;
  /** 模型信息 */
  modelInfo: PMXModelInfo;
  /** 纹理列表 */
  textures: PMXTexture[];
  /** 材质列表 */
  materials: PMXMaterial[];
  /** 材质纹理映射 */
  materialTextureMappings: MaterialTextureMapping[];
  /** 顶点数量 */
  vertexCount: number;
  /** 面数量 */
  faceCount: number;
}





