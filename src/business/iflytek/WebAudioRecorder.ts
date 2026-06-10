/**
 * 基于 Web Audio API 的 AudioRecorder 实现
 *
 * 适用于浏览器环境（Next.js 客户端 / Electron 渲染进程）。
 * 输出与 React Native PCM 库一致的 base64 编码 16-bit PCM 数据。
 *
 * @example
 * ```ts
 * import { IflytekSTT, WebAudioRecorder } from "sa2kit/iflytek";
 *
 * const recorder = new WebAudioRecorder();
 * const stt = new IflytekSTT({ transport: socket, recorder });
 * ```
 */

import type { AudioRecorder } from "./types";

export class WebAudioRecorder implements AudioRecorder {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private callback: ((base64Chunk: string) => void) | null = null;
  private sampleRate = 16000;
  private bufferSize = 4096;
  private running = false;

  init(options: {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource: number;
    bufferSize: number;
  }): void {
    this.sampleRate = options.sampleRate;
    this.bufferSize = options.bufferSize;
    this.cleanup();
  }

  on(
    event: "data",
    callback: (base64Chunk: string) => void,
  ): { remove: () => void } {
    this.callback = callback;
    return {
      remove: () => {
        if (this.callback === callback) {
          this.callback = null;
        }
      },
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startAsync().catch((err) => {
      console.error("[WebAudioRecorder] start failed:", err);
      this.running = false;
    });
  }

  stop(): void {
    this.running = false;
    this.cleanup();
  }

  private async startAsync(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: { ideal: this.sampleRate },
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.audioCtx = new AudioContext({ sampleRate: this.sampleRate });
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);

    // 优先尝试 ScriptProcessorNode（兼容性最广，简单可靠）
    const bufSize = this.closestPow2(this.bufferSize);
    this.processorNode = this.audioCtx.createScriptProcessor(bufSize, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.running || !this.callback) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const base64 = this.float32ToBase64PCM16(float32);
      this.callback(base64);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);
  }

  private cleanup(): void {
    this.processorNode?.disconnect();
    this.processorNode = null;
    this.workletNode?.disconnect();
    this.workletNode = null;
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private float32ToBase64PCM16(float32: Float32Array): string {
    const buf = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buf);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]!));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(buf).toString("base64");
  }

  private closestPow2(n: number): number {
    let v = 256;
    while (v < n && v < 16384) v *= 2;
    return v;
  }
}
