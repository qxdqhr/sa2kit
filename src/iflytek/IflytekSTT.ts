/**
 * 讯飞语音转文字 — 客户端核心类
 *
 * 纯逻辑、无 UI 依赖。管理：
 *   本地 PCM 录音 → 通过 transport（Socket.IO）传输到服务端适配层 → 接收转写结果
 *
 * 状态机：idle → connecting → recording → stopping → idle
 */

import type {
  IflytekPhase,
  IflytekClientConfig,
  IflytekClientEvents,
  IflytekTransport,
  AudioRecorder,
  IflytekReadyPayload,
  IflytekResultPayload,
  IflytekErrorPayload,
} from "./types";

interface Session {
  id: string;
  phase: IflytekPhase;
  ready: boolean;
  hasAudio: boolean;
  finalSent: boolean;
  frameStatus: 0 | 1;
  bufferedChunk: string | null;
  dataListener: { remove: () => void } | null;
  readyTimer: ReturnType<typeof setTimeout> | null;
  stopWaitTimer: ReturnType<typeof setTimeout> | null;
}

export class IflytekSTT {
  private transport: IflytekTransport;
  private recorder: AudioRecorder;
  private sampleRate: number;
  private language: string;
  private domain: string;
  private accent: string;
  private readyTimeout: number;
  private stopWaitTimeout: number;
  private debug: boolean;

  private events: IflytekClientEvents = {};
  private session: Session | null = null;
  private bound = false;
  private lastPressTime = 0;

  // 保存绑定后的 handler 引用以便 off
  private handleReady: (data: IflytekReadyPayload) => void;
  private handleResult: (data: IflytekResultPayload) => void;
  private handleError: (data: IflytekErrorPayload) => void;

  constructor(config: IflytekClientConfig) {
    this.transport = config.transport;
    this.recorder = config.recorder;
    this.sampleRate = config.sampleRate ?? 16000;
    this.language = config.language ?? "zh_cn";
    this.domain = config.domain ?? "iat";
    this.accent = config.accent ?? "mandarin";
    this.readyTimeout = config.readyTimeout ?? 5000;
    this.stopWaitTimeout = config.stopWaitTimeout ?? 1500;
    this.debug = config.debug ?? false;

    this.handleReady = this._onReady.bind(this);
    this.handleResult = this._onResult.bind(this);
    this.handleError = this._onError.bind(this);
  }

  // ─── 公共 API ───

  /** 注册事件回调 */
  on(events: IflytekClientEvents): this {
    this.events = { ...this.events, ...events };
    return this;
  }

  /** 当前阶段 */
  get phase(): IflytekPhase {
    return this.session?.phase ?? "idle";
  }

  /** 当前会话 ID */
  get sessionId(): string | null {
    return this.session?.id ?? null;
  }

  /** 是否正在录音（connecting / recording / stopping） */
  get isActive(): boolean {
    return this.session !== null;
  }

  /**
   * 开始录音。
   * 对应 onPressIn / 按钮按下。
   * 返回 true 表示成功启动，false 表示被忽略（去抖 / 已有活跃会话）。
   */
  start(): boolean {
    const now = Date.now();
    if (now - this.lastPressTime < 200) return false;
    this.lastPressTime = now;
    if (this.session) return false;

    this.bindTransport();

    const sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session: Session = {
      id: sid,
      phase: "connecting",
      ready: false,
      hasAudio: false,
      finalSent: false,
      frameStatus: 0,
      bufferedChunk: null,
      dataListener: null,
      readyTimer: null,
      stopWaitTimer: null,
    };
    this.session = session;
    this.setPhase("connecting", sid);

    this.recorder.init({
      sampleRate: this.sampleRate,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 1,
      bufferSize: 4096,
    });

    session.dataListener = this.recorder.on("data", (chunk: string) => {
      this._onAudioData(chunk, sid);
    });

    this.log("start", { sid });
    this.recorder.start();

    this.transport.emit("iflytek:start", { sessionId: sid });

    session.readyTimer = setTimeout(() => {
      if (this.session?.id === sid && this.session.phase === "connecting") {
        this.log("ready timeout");
        this.transport.emit("iflytek:stop", { sessionId: sid });
        this.destroy();
        this.events.onError?.("讯飞服务未就绪，请检查网络后重试", sid);
      }
    }, this.readyTimeout);

    return true;
  }

  /**
   * 停止录音。
   * 对应 onPressOut / 按钮松开。
   */
  stop(): void {
    const s = this.session;
    if (!s) return;

    if (s.hasAudio) {
      this.log("stop");
      this.sendFinal(s);
    } else {
      this.log("wait for first frame");
      s.stopWaitTimer = setTimeout(() => {
        if (this.session?.id === s.id && !this.session.hasAudio) {
          this.log("no audio captured");
          this.transport.emit("iflytek:stop", { sessionId: s.id });
          this.destroy();
          this.events.onError?.("录音太短，请稍微多按住一点再说话", s.id);
        }
      }, this.stopWaitTimeout);
    }
  }

  /** 强制终止当前会话（页面卸载 / 引擎切换时调用） */
  abort(): void {
    const sid = this.session?.id;
    if (sid) {
      this.transport.emit("iflytek:stop", { sessionId: sid });
    }
    this.destroy();
  }

  /** 完全释放资源，解除 transport 监听 */
  dispose(): void {
    this.abort();
    this.unbindTransport();
  }

  // ─── transport 事件处理 ───

  private _onReady(data: IflytekReadyPayload) {
    const s = this.session;
    if (!s || s.phase !== "connecting") return;
    if (data.sessionId && data.sessionId !== s.id) return;

    this.log("ready");
    if (s.readyTimer) {
      clearTimeout(s.readyTimer);
      s.readyTimer = null;
    }
    s.ready = true;
    this.setPhase("recording", s.id);

    const buf = s.bufferedChunk;
    if (buf) {
      this.log("flush buffered frame", { len: buf.length });
      this.transport.emit("iflytek:audio", {
        sessionId: s.id,
        status: 0,
        audio: buf,
        language: this.language,
        domain: this.domain,
        accent: this.accent,
      });
      s.hasAudio = true;
      s.frameStatus = 1;
      s.bufferedChunk = null;
    }

    if (s.stopWaitTimer && s.hasAudio) {
      clearTimeout(s.stopWaitTimer);
      s.stopWaitTimer = null;
      this.sendFinal(s);
    }
  }

  private _onResult(data: IflytekResultPayload) {
    const s = this.session;
    if (s && data.sessionId && data.sessionId !== s.id) return;

    const text = data.text?.trim() ?? "";
    const isFinal = Boolean(data.isFinal);
    this.log("result", { text: text.slice(0, 30), isFinal });

    if (isFinal) {
      const sid = s?.id ?? data.sessionId;
      this.destroy();
      if (text) {
        this.events.onFinalResult?.(text, sid);
      }
    } else if (text) {
      this.events.onInterimResult?.(text, data.sessionId);
    }
  }

  private _onError(data: IflytekErrorPayload) {
    const s = this.session;
    if (s && data.sessionId && data.sessionId !== s.id) return;
    this.log("error", { message: data.message, sessionId: data.sessionId });
    const sid = s?.id ?? data.sessionId;
    this.destroy();
    this.events.onError?.(data.message || "讯飞识别失败", sid);
  }

  // ─── 音频数据 ───

  private _onAudioData(chunk: string, sid: string) {
    const s = this.session;
    if (!s || s.id !== sid) return;

    if (!s.ready) {
      s.bufferedChunk = chunk;
      return;
    }

    this.log("frame", { s: s.frameStatus, len: chunk.length });
    this.transport.emit("iflytek:audio", {
      sessionId: sid,
      status: s.frameStatus,
      audio: chunk,
      language: this.language,
      domain: this.domain,
      accent: this.accent,
    });
    s.hasAudio = true;
    s.frameStatus = 1;

    if (s.stopWaitTimer && s.hasAudio) {
      clearTimeout(s.stopWaitTimer);
      s.stopWaitTimer = null;
      this.sendFinal(s);
    }
  }

  // ─── 内部工具 ───

  private sendFinal(s: Session) {
    if (s.finalSent) return;
    s.finalSent = true;
    this.setPhase("stopping", s.id);
    s.dataListener?.remove();
    s.dataListener = null;
    try {
      this.recorder.stop();
    } catch {}
    this.log("send final frame");
    this.transport.emit("iflytek:audio", { sessionId: s.id, status: 2 });
  }

  private destroy() {
    const s = this.session;
    if (!s) return;
    s.dataListener?.remove();
    if (s.readyTimer) clearTimeout(s.readyTimer);
    if (s.stopWaitTimer) clearTimeout(s.stopWaitTimer);
    try {
      this.recorder.stop();
    } catch {}
    this.session = null;
    this.setPhase("idle", null);
  }

  private setPhase(phase: IflytekPhase, sid: string | null) {
    this.events.onPhaseChange?.(phase, sid);
  }

  private bindTransport() {
    if (this.bound) return;
    this.transport.on("iflytek:ready", this.handleReady);
    this.transport.on("iflytek:result", this.handleResult);
    this.transport.on("iflytek:error", this.handleError);
    this.bound = true;
  }

  private unbindTransport() {
    if (!this.bound) return;
    this.transport.off("iflytek:ready", this.handleReady);
    this.transport.off("iflytek:result", this.handleResult);
    this.transport.off("iflytek:error", this.handleError);
    this.bound = false;
  }

  private log(msg: string, extra?: Record<string, unknown>) {
    if (!this.debug) return;
    if (extra) {
      console.log(`[sa2kit/iflytek] ${msg}`, extra);
    } else {
      console.log(`[sa2kit/iflytek] ${msg}`);
    }
  }
}
