/** MMD 资源域类型（无 three 依赖） */

export interface MMDModel {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  thumbnailPath?: string;
  fileSize: number;
  uploadTime: Date;
  format: 'pmd' | 'pmx';
  userId?: string;
  tags?: string[];
  isPublic: boolean;
  downloadCount: number;
}

export interface MMDAnimation {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  fileSize: number;
  uploadTime: Date;
  duration: number;
  frameCount: number;
  userId?: string;
  tags?: string[];
  isPublic: boolean;
  compatibleModels?: string[];
}

export interface MMDAudio {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  uploadTime: Date;
  duration: number;
  format: 'wav' | 'mp3' | 'ogg';
  userId?: string;
}

export interface MMDScene {
  id: string;
  name: string;
  description?: string;
  modelId: string;
  animationId?: string;
  audioId?: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  lighting: {
    ambientLight: { color: string; intensity: number };
    directionalLight: {
      color: string;
      intensity: number;
      position: { x: number; y: number; z: number };
    };
  };
  background: {
    type: 'color' | 'image' | 'skybox';
    value: string;
  };
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
