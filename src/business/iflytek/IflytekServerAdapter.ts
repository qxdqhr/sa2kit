/**
 * 讯飞语音转文字 — 服务端适配层
 *
 * 运行在 Node.js 上，为每个 Socket.IO 客户端管理一条到讯飞 WebSocket 的上游连接。
 * 纯逻辑，不依赖任何 HTTP 框架。
 *
 * 使用方式：
 * ```ts
 * import { Server } from "socket.io";
 * import { IflytekServerAdapter } from "sa2kit/iflytek/server";
 *
 * const io = new Server(httpServer, { cors: { origin: "*" } });
 * const adapter = new IflytekServerAdapter({
 *   appId: process.env.IFLYTEK_APP_ID!,
 *   apiKey: process.env.IFLYTEK_API_KEY!,
 *   apiSecret: process.env.IFLYTEK_API_SECRET!,
 * });
 *
 * io.on("connection", (socket) => {
 *   adapter.attach(socket);
 * });
 * ```
 */

import crypto from "crypto";
import WebSocket from "ws";
import type {
  IflytekServerConfig,
  IflytekAudioFrame,
  IflytekStartPayload,
  IflytekStopPayload,
} from "./types";

interface SessionState {
  ws: WebSocket;
  sessionId: string;
  frameCount: number;
  firstFrameSent: boolean;
  ended: boolean;
  resultText: string;
  resultSegments: string[];
}

interface SocketLike {
  id: string;
  emit(event: string, data: unknown): void;
  on(event: string, handler: (...args: any[]) => void): void;
}

export class IflytekServerAdapter {
  private appId: string;
  private apiKey: string;
  private apiSecret: string;
  private host: string;
  private path: string;
  private debug: boolean;

  private sessions = new Map<string, SessionState>();

  constructor(config: IflytekServerConfig) {
    this.appId = config.appId;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.host = config.host ?? "iat-api.xfyun.cn";
    this.path = config.path ?? "/v2/iat";
    this.debug = config.debug ?? false;
  }

  /**
   * 将适配器绑定到一个 Socket.IO socket 连接上。
   * 自动监听 iflytek:start / iflytek:audio / iflytek:stop / disconnect 事件。
   */
  attach(socket: SocketLike): void {
    socket.on("iflytek:start", (payload?: IflytekStartPayload) => {
      this.handleStart(socket, payload);
    });

    socket.on("iflytek:audio", (frame: IflytekAudioFrame) => {
      this.handleAudio(socket, frame);
    });

    socket.on("iflytek:stop", (payload?: IflytekStopPayload) => {
      this.handleStop(socket, payload);
    });

    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  // ─── 事件处理 ───

  private handleStart(socket: SocketLike, payload?: IflytekStartPayload) {
    const sessionId =
      payload?.sessionId ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!this.appId || !this.apiKey || !this.apiSecret) {
      socket.emit("iflytek:error", {
        sessionId,
        message:
          "服务端未配置 IFLYTEK_APP_ID / IFLYTEK_API_KEY / IFLYTEK_API_SECRET",
      });
      return;
    }

    const existing = this.sessions.get(socket.id);
    if (existing) {
      if (existing.ended) {
        this.log(socket.id, "replace ended session");
        this.closeUpstream(existing);
        this.sessions.delete(socket.id);
      } else if (existing.ws.readyState === WebSocket.OPEN) {
        this.log(socket.id, "duplicate start ignored (session open)");
        socket.emit("iflytek:ready", { sessionId: existing.sessionId });
        return;
      } else if (existing.ws.readyState === WebSocket.CONNECTING) {
        this.log(socket.id, "duplicate start ignored (session connecting)");
        return;
      } else {
        this.sessions.delete(socket.id);
      }
    }

    const wsUrl = this.buildWsUrl();
    const ws = new WebSocket(wsUrl);
    const state: SessionState = {
      ws,
      sessionId,
      frameCount: 0,
      firstFrameSent: false,
      ended: false,
      resultText: "",
      resultSegments: [],
    };
    this.sessions.set(socket.id, state);
    this.log(socket.id, "start session", { sessionId });

    ws.on("open", () => {
      this.log(socket.id, "upstream open");
      socket.emit("iflytek:ready", { sessionId });
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        this.log(socket.id, "upstream message", {
          code: msg.code,
          status: msg?.data?.status,
        });
        if (msg.code !== 0) {
          socket.emit("iflytek:error", {
            sessionId,
            message: msg.message || `讯飞返回错误 code=${msg.code}`,
          });
          return;
        }

        const current = this.sessions.get(socket.id);
        if (!current || current.ws !== ws) return;

        const result = this.extractResult(msg.data?.result);
        const mergedText = this.mergeResult(current, result);
        const isFinal = msg.data?.status === 2;
        if (mergedText || isFinal) {
          socket.emit("iflytek:result", {
            sessionId,
            text: mergedText,
            isFinal,
          });
        }

        if (isFinal) {
          const current = this.sessions.get(socket.id);
          if (current?.ws === ws) {
            this.closeUpstream(current);
          }
        }
      } catch (e: any) {
        socket.emit("iflytek:error", { sessionId, message: e.message });
      }
    });

    ws.on("error", (e: any) => {
      if (e?.message?.includes("before the connection was established")) {
        this.log(socket.id, "ignore early-close error");
        return;
      }
      socket.emit("iflytek:error", {
        sessionId,
        message: e?.message || "讯飞 WebSocket 连接失败",
      });
    });

    ws.on("close", () => {
      this.log(socket.id, "upstream close");
      const current = this.sessions.get(socket.id);
      if (current?.ws === ws) {
        this.sessions.delete(socket.id);
      }
    });
  }

  private handleAudio(socket: SocketLike, frame: IflytekAudioFrame) {
    const state = this.sessions.get(socket.id);
    if (!state || state.ws.readyState !== WebSocket.OPEN) return;

    if (frame.sessionId && frame.sessionId !== state.sessionId) {
      this.log(socket.id, "ignore stale audio frame");
      return;
    }
    if (state.ended && frame.status === 2) {
      this.log(socket.id, "ignore duplicate final frame");
      return;
    }
    if (!state.firstFrameSent && frame.status === 2) {
      this.log(socket.id, "ignore lonely final frame");
      return;
    }

    const isFirst = !state.firstFrameSent && frame.status !== 2;
    const status: 0 | 1 | 2 = isFirst ? 0 : frame.status;

    state.frameCount += 1;
    if (status === 0) state.firstFrameSent = true;
    if (status === 2) state.ended = true;

    this.log(socket.id, "audio frame", {
      status,
      hasAudio: Boolean(frame.audio),
      len: frame.audio?.length ?? 0,
      count: state.frameCount,
    });

    const payload: Record<string, unknown> = {
      data: { status },
    };

    if (status === 0) {
      payload.common = { app_id: this.appId };
      payload.business = {
        language: frame.language || "zh_cn",
        domain: frame.domain || "iat",
        accent: frame.accent || "mandarin",
        vad_eos: 2000,
      };
      payload.data = {
        status: 0,
        format: "audio/L16;rate=16000",
        encoding: "raw",
        audio: frame.audio || "",
      };
    } else if (status === 1) {
      payload.data = {
        status: 1,
        format: "audio/L16;rate=16000",
        encoding: "raw",
        audio: frame.audio || "",
      };
    } else {
      payload.data = { status: 2 };
    }

    state.ws.send(JSON.stringify(payload));
  }

  private handleStop(socket: SocketLike, payload?: IflytekStopPayload) {
    const state = this.sessions.get(socket.id);
    if (
      payload?.sessionId &&
      state?.sessionId &&
      payload.sessionId !== state.sessionId
    ) {
      this.log(socket.id, "ignore stale stop signal");
      return;
    }
    this.log(socket.id, "stop signal");
    if (state) {
      this.closeUpstream(state);
      this.sessions.delete(socket.id);
    }
  }

  private handleDisconnect(socket: SocketLike) {
    const state = this.sessions.get(socket.id);
    if (state) {
      this.closeUpstream(state);
      this.sessions.delete(socket.id);
    }
  }

  // ─── 工具方法 ───

  private buildWsUrl(): string {
    const date = new Date().toUTCString();
    const requestLine = `GET ${this.path} HTTP/1.1`;
    const signatureOrigin = `host: ${this.host}\ndate: ${date}\n${requestLine}`;
    const signatureSha = crypto
      .createHmac("sha256", this.apiSecret)
      .update(signatureOrigin)
      .digest("base64");
    const authOrigin = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
    const authorization = Buffer.from(authOrigin).toString("base64");
    const params = new URLSearchParams({ authorization, date, host: this.host });
    return `wss://${this.host}${this.path}?${params.toString()}`;
  }

  private extractText(result: any): string {
    const ws = result?.ws;
    if (!Array.isArray(ws)) return "";
    return ws
      .map((item: any) => item?.cw?.[0]?.w ?? "")
      .join("")
      .trim();
  }

  private extractResult(result: any): {
    text: string;
    pgs?: string;
    rg?: [number, number];
    sn?: number;
  } {
    const text = this.extractText(result);
    const pgs =
      typeof result?.pgs === "string" ? result.pgs : undefined;
    const rgRaw = Array.isArray(result?.rg) ? result.rg : undefined;
    const rg =
      rgRaw && rgRaw.length === 2
        ? ([Number(rgRaw[0]), Number(rgRaw[1])] as [number, number])
        : undefined;
    const sn =
      typeof result?.sn === "number"
        ? result.sn
        : Number.isFinite(Number(result?.sn))
          ? Number(result?.sn)
          : undefined;
    return { text, pgs, rg, sn };
  }

  private mergeResult(
    state: SessionState,
    result: { text: string; pgs?: string; rg?: [number, number]; sn?: number },
  ): string {
    const text = result.text?.trim() ?? "";
    const segments = state.resultSegments;

    if (typeof result.sn === "number") {
      if (result.pgs === "rpl" && result.rg) {
        const [start, end] = result.rg;
        const before = segments.slice(0, start);
        const after = segments.slice(end + 1);
        state.resultSegments = [...before, text, ...after];
      } else {
        segments[result.sn] = text;
        state.resultSegments = segments;
      }
    } else if (result.pgs === "rpl" && result.rg) {
      const [start, end] = result.rg;
      const before = segments.slice(0, start);
      const after = segments.slice(end + 1);
      state.resultSegments = [...before, text, ...after];
    } else if (text) {
      segments.push(text);
      state.resultSegments = segments;
    }

    state.resultText = state.resultSegments.filter(Boolean).join("");
    return state.resultText;
  }

  private closeUpstream(state: SessionState) {
    try {
      state.ws.close();
    } catch {}
  }

  private log(socketId: string, msg: string, extra?: Record<string, unknown>) {
    if (!this.debug) return;
    if (extra) {
      console.log(`[sa2kit/iflytek][${socketId}] ${msg}`, extra);
    } else {
      console.log(`[sa2kit/iflytek][${socketId}] ${msg}`);
    }
  }
}
