/**
 * 讯飞语音转文字模块 — 服务端入口
 *
 * 依赖 Node.js（crypto + ws）。适用于：
 *   - Next.js API Routes / Server Actions
 *   - 独立 Node.js 服务（Express / Socket.IO）
 *   - Electron 主进程
 *
 * @example
 * ```ts
 * import { Server } from "socket.io";
 * import { IflytekServerAdapter } from "sa2kit/iflytek/server";
 *
 * const adapter = new IflytekServerAdapter({
 *   appId: process.env.IFLYTEK_APP_ID!,
 *   apiKey: process.env.IFLYTEK_API_KEY!,
 *   apiSecret: process.env.IFLYTEK_API_SECRET!,
 *   debug: true,
 * });
 *
 * io.on("connection", (socket) => {
 *   adapter.attach(socket);
 * });
 * ```
 */

export { IflytekServerAdapter } from "./IflytekServerAdapter";

export type {
  IflytekServerConfig,
  IflytekAudioFrame,
  IflytekStartPayload,
  IflytekStopPayload,
} from "./types";
