/**
 * 讯飞语音转文字 — 公共类型定义
 *
 * 客户端与服务端共享，不依赖任何 UI 框架或运行时库。
 */

// ─── 状态机 ───

export type IflytekPhase =
  | "idle"
  | "connecting"
  | "recording"
  | "stopping";

// ─── 音频帧 ───

export interface IflytekAudioFrame {
  sessionId: string;
  /** 0 = 首帧（携带 common/business），1 = 中间帧，2 = 终帧 */
  status: 0 | 1 | 2;
  audio?: string;
  language?: string;
  domain?: string;
  accent?: string;
}

// ─── Socket 事件负载 ───

export interface IflytekStartPayload {
  sessionId: string;
}

export interface IflytekReadyPayload {
  sessionId: string;
}

export interface IflytekResultPayload {
  sessionId: string;
  text: string;
  isFinal: boolean;
}

export interface IflytekErrorPayload {
  sessionId: string;
  message: string;
}

export interface IflytekStopPayload {
  sessionId: string;
}

// ─── 客户端配置 ───

/**
 * 音频录制器的抽象接口。
 * 使用者需要根据平台提供实现（如 @fugood/react-native-audio-pcm-stream）。
 */
export interface AudioRecorder {
  init(options: {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource: number;
    bufferSize: number;
  }): void;
  start(): void;
  stop(): void;
  on(
    event: "data",
    callback: (base64Chunk: string) => void,
  ): { remove: () => void };
}

/**
 * Socket 传输层抽象。
 * 与 socket.io-client 的 Socket 兼容，但只声明必需方法。
 */
export interface IflytekTransport {
  emit(event: string, payload?: unknown): void;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

export interface IflytekClientConfig {
  /** 传输层（Socket.IO 客户端实例） */
  transport: IflytekTransport;
  /** 音频录制器实例 */
  recorder: AudioRecorder;
  /** 采样率，默认 16000 */
  sampleRate?: number;
  /** 语言，默认 zh_cn */
  language?: string;
  /** 领域，默认 iat */
  domain?: string;
  /** 方言，默认 mandarin */
  accent?: string;
  /** ready 超时（ms），默认 5000 */
  readyTimeout?: number;
  /** 松手后等待首帧超时（ms），默认 1500 */
  stopWaitTimeout?: number;
  /** 是否输出调试日志，默认 false */
  debug?: boolean;
}

// ─── 客户端事件回调 ───

export interface IflytekClientEvents {
  /** 识别到中间结果 */
  onInterimResult?: (text: string, sessionId: string) => void;
  /** 识别到最终结果 */
  onFinalResult?: (text: string, sessionId: string) => void;
  /** 状态变化 */
  onPhaseChange?: (phase: IflytekPhase, sessionId: string | null) => void;
  /** 出错 */
  onError?: (message: string, sessionId: string | null) => void;
}

// ─── 服务端配置 ───

export interface IflytekServerConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
  host?: string;
  path?: string;
  debug?: boolean;
}
