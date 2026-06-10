/**
 * 讯飞语音转文字模块 — 客户端入口
 *
 * 纯 JS，无 Node.js 依赖。适用于：
 *   - React Native（搭配 @fugood/react-native-audio-pcm-stream 作为 AudioRecorder）
 *   - Next.js 浏览器端（搭配内置 WebAudioRecorder）
 *   - Electron 渲染进程（搭配内置 WebAudioRecorder）
 *
 * @example React Native
 * ```ts
 * import { IflytekSTT } from "sa2kit/iflytek";
 * import AudioRecord from "@fugood/react-native-audio-pcm-stream";
 *
 * const stt = new IflytekSTT({
 *   transport: socket,
 *   recorder: AudioRecord,
 *   debug: true,
 * });
 * stt.on({
 *   onInterimResult: (text) => setInterimText(text),
 *   onFinalResult: (text) => setFinalText(text),
 *   onError: (msg) => setError(msg),
 * });
 * stt.start(); // onPressIn
 * stt.stop();  // onPressOut
 * ```
 *
 * @example Next.js / Electron 渲染进程
 * ```ts
 * import { IflytekSTT, WebAudioRecorder } from "sa2kit/iflytek";
 *
 * const recorder = new WebAudioRecorder();
 * const stt = new IflytekSTT({ transport: socket, recorder });
 * ```
 *
 * 服务端适配层请从 "sa2kit/iflytek/server" 导入。
 */

export { IflytekSTT } from "./IflytekSTT";
export { WebAudioRecorder } from "./WebAudioRecorder";

export type {
  IflytekPhase,
  IflytekClientConfig,
  IflytekClientEvents,
  IflytekTransport,
  AudioRecorder,
  IflytekAudioFrame,
  IflytekStartPayload,
  IflytekReadyPayload,
  IflytekResultPayload,
  IflytekErrorPayload,
  IflytekStopPayload,
  IflytekServerConfig,
} from "./types";
