export type FireworkKind = 'normal' | 'miku' | 'avatar';

export interface DanmakuMessage {
  id: string;
  userId?: string;
  text: string;
  color?: string;
  timestamp: number;
}

export interface FireworkPosition {
  x: number;
  y: number;
  z: number;
}

export interface FireworkLaunchPayload {
  kind: FireworkKind;
  position?: FireworkPosition;
  color?: string;
  avatarUrl?: string;
  message?: DanmakuMessage;
}

export interface FireworkEngineOptions {
  maxParticles?: number;
  maxActiveFireworks?: number;
  onError?: (error: Error) => void;
  onFpsReport?: (fps: number) => void;
}

export interface MikuFireworks3DProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  defaultKind?: FireworkKind;
  autoLaunchOnDanmaku?: boolean;
  maxParticles?: number;
  maxActiveFireworks?: number;
  defaultAvatarUrl?: string;
  onLaunch?: (payload: FireworkLaunchPayload) => void;
  onDanmakuSend?: (message: DanmakuMessage) => void;
  onError?: (error: Error) => void;
  onFpsReport?: (fps: number) => void;
}

export interface DanmakuSendResult {
  message: DanmakuMessage;
  launchKind?: FireworkKind;
}

export interface DanmakuControllerOptions {
  onSend?: (message: DanmakuMessage) => void;
}
