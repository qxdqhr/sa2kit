'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackButton } from 'sa2kit/common/ui/patterns/next';

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

type ConnectionState = 'idle' | 'connecting' | 'recording' | 'stopped' | 'error';

type IatAuthResponse = {
  url: string;
  appId: string;
};

type IatResult = {
  sn: number;
  ws: Array<{ cw: Array<{ w: string }> }>;
  pgs?: 'rpl' | 'apd';
  rg?: [number, number];
};

type IatConfig = {
  language: string;
  domain: string;
  accent: string;
  vadEos: number;
  dwa: string;
};

type SessionRecord = {
  id: string;
  createdAt: string;
  duration: number;
  transcript: string;
  config: IatConfig;
  stats: {
    charCount: number;
    wordCount: number;
  };
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const downsampleBuffer = (buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) => {
  if (inputSampleRate === outputSampleRate) return buffer;
  if (inputSampleRate < outputSampleRate) return buffer;

  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }
    result[offsetResult] = accum / count;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
};

const floatTo16BitPCM = (input: Float32Array) => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output.buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function XunfeiAsrLabPage() {
  const [status, setStatus] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState<IatConfig>({
    language: 'zh_cn',
    domain: 'iat',
    accent: 'mandarin',
    vadEos: 3000,
    dwa: 'wpgs',
  });
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [saving, setSaving] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const firstFrameSentRef = useRef(false);
  const segmentMapRef = useRef<string[]>([]);
  const timerRef = useRef<number | null>(null);
  const sessionConfigRef = useRef<IatConfig>(config);

  const isRecording = status === 'recording' || status === 'connecting';

  const appendLog = useCallback((entry: string) => {
    setLogs((prev) => [entry, ...prev].slice(0, 12));
  }, []);

  useEffect(() => {
    sessionConfigRef.current = config;
  }, [config]);

  const resetSession = useCallback(() => {
    setTranscript('');
    setPartial('');
    setError(null);
    setDuration(0);
    setLogs([]);
    segmentMapRef.current = [];
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/xfyun/iat-sessions');
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: SessionRecord[] };
      setHistory(data.sessions ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const saveSession = useCallback(async () => {
    if (!transcript.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/xfyun/iat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          duration,
          config: sessionConfigRef.current,
        }),
      });

      if (!res.ok) throw new Error(`保存失败: ${res.status}`);
      const data = (await res.json()) as { record: SessionRecord };
      setHistory((prev) => [data.record, ...prev]);
      appendLog('识别记录已存档');
    } catch (err) {
      console.error(err);
      appendLog('保存记录失败，请检查服务端日志');
    } finally {
      setSaving(false);
    }
  }, [appendLog, duration, transcript]);

  const cleanupAudio = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const cleanupSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  const sendFrame = useCallback((payload: { appId: string; audio: string; status: 0 | 1 | 2 }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const frame: Record<string, unknown> = {
      data: {
        status: payload.status,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: payload.audio,
      },
    };

    if (payload.status === 0) {
      const sessionConfig = sessionConfigRef.current;
      const business: Record<string, unknown> = {
        language: sessionConfig.language,
        domain: sessionConfig.domain,
        accent: sessionConfig.accent,
        vad_eos: sessionConfig.vadEos,
      };

      if (sessionConfig.dwa !== 'none') {
        business.dwa = sessionConfig.dwa;
      }

      frame.common = {
        app_id: payload.appId,
      };
      frame.business = business;
    }

    wsRef.current.send(JSON.stringify(frame));
  }, []);

  const handleResult = useCallback((result: IatResult) => {
    const text = result.ws
      .map((item) => item.cw.map((word) => word.w).join(''))
      .join('');

    if (result.pgs === 'rpl' && result.rg) {
      const [start, end] = result.rg;
      segmentMapRef.current.splice(start - 1, end - start + 1);
    }

    segmentMapRef.current[result.sn - 1] = text;
    const merged = segmentMapRef.current.join('');
    setTranscript(merged);
    setPartial(text);
  }, []);

  const stopSession = useCallback(() => {
    if (status !== 'recording' && status !== 'connecting') return;
    setStatus('stopped');
    stopTimer();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          data: {
            status: 2,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: '',
          },
        })
      );
    }

    cleanupAudio();
    appendLog('录音已停止，等待识别结果...');
  }, [appendLog, cleanupAudio, status, stopTimer]);

  const startAudioCapture = useCallback(
    async (appId: string) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputBuffer = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(inputBuffer, audioContext.sampleRate, TARGET_SAMPLE_RATE);
        const pcmBuffer = floatTo16BitPCM(downsampled);
        const audio = arrayBufferToBase64(pcmBuffer);

        if (!firstFrameSentRef.current) {
          sendFrame({ appId, audio, status: 0 });
          firstFrameSentRef.current = true;
          appendLog('开始发送语音帧');
        } else {
          sendFrame({ appId, audio, status: 1 });
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    },
    [appendLog, sendFrame]
  );

  const startSession = useCallback(async () => {
    if (status === 'recording' || status === 'connecting') return;

    resetSession();
    setStatus('connecting');
    firstFrameSentRef.current = false;
    sessionConfigRef.current = config;

    try {
      const res = await fetch('/api/xfyun/iat-url');
      if (!res.ok) throw new Error(`获取鉴权失败 (${res.status})`);
      const data = (await res.json()) as IatAuthResponse;

      const ws = new WebSocket(data.url);
      wsRef.current = ws;

      ws.onopen = async () => {
        appendLog('WebSocket 已连接');
        setStatus('recording');
        startTimer();
        await startAudioCapture(data.appId);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.code !== 0) {
            setError(payload.message || '识别失败');
            setStatus('error');
            stopTimer();
            appendLog(`服务返回错误: ${payload.code}`);
            return;
          }

          if (payload.data?.result?.ws) {
            handleResult(payload.data.result as IatResult);
          }

          if (payload.data?.status === 2) {
            appendLog('识别完成');
            setStatus('stopped');
            stopTimer();
          }
        } catch (err) {
          console.error(err);
          appendLog('解析返回数据失败');
        }
      };

      ws.onerror = () => {
        setError('WebSocket 连接异常');
        setStatus('error');
        stopTimer();
        appendLog('WebSocket 连接异常');
      };

      ws.onclose = () => {
        cleanupAudio();
      };
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err instanceof Error ? err.message : '启动失败');
      stopTimer();
    }
  }, [appendLog, cleanupAudio, config, handleResult, resetSession, startAudioCapture, startTimer, status, stopTimer]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupAudio();
      cleanupSocket();
    };
  }, [cleanupAudio, cleanupSocket, stopTimer]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'connecting':
        return '连接中';
      case 'recording':
        return '识别中';
      case 'stopped':
        return '已停止';
      case 'error':
        return '异常';
      default:
        return '空闲';
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <BackButton href="/testField" />
          <span className="rounded-full border border-slate-700/60 px-4 py-1 text-xs tracking-[0.3em] text-slate-400">
            SA2KIT LAB
          </span>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">讯飞语音识别测试台</h1>
          <p className="text-sm text-slate-300">
            使用 iFlytek WebSocket 听写能力进行实时中文语音识别，适合验证 sa2kit 集成链路。
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg shadow-black/30 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startSession}
                disabled={isRecording}
                className="rounded-full bg-emerald-400/90 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-800/40 disabled:text-emerald-200"
              >
                开始识别
              </button>
              <button
                type="button"
                onClick={stopSession}
                disabled={!isRecording}
                className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
              >
                停止
              </button>
              <button
                type="button"
                onClick={saveSession}
                disabled={isRecording || !transcript.trim() || saving}
                className="rounded-full border border-emerald-500/60 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
              >
                {saving ? '保存中...' : '保存记录'}
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{statusLabel}</span>
              </div>
              <div className="text-sm text-slate-400">录音时长 {formatDuration(duration)}</div>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">识别结果</div>
              <div className="mt-3 min-h-[120px] whitespace-pre-wrap text-base leading-relaxed text-slate-100">
                {transcript || '等待语音输入...'}
              </div>
              {partial && (
                <div className="mt-3 text-xs text-emerald-300">最新分段：{partial}</div>
              )}
              {error && <div className="mt-3 text-sm text-rose-300">{error}</div>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">识别参数</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <label className="flex items-center justify-between gap-3">
                  <span>语言</span>
                  <select
                    className="w-44 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100"
                    value={config.language}
                    onChange={(event) => setConfig((prev) => ({ ...prev, language: event.target.value }))}
                  >
                    <option value="zh_cn">zh_cn (中文)</option>
                    <option value="en_us">en_us (英文)</option>
                  </select>
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>领域</span>
                  <select
                    className="w-44 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100"
                    value={config.domain}
                    onChange={(event) => setConfig((prev) => ({ ...prev, domain: event.target.value }))}
                  >
                    <option value="iat">iat (日常)</option>
                  </select>
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>口音</span>
                  <select
                    className="w-44 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100"
                    value={config.accent}
                    onChange={(event) => setConfig((prev) => ({ ...prev, accent: event.target.value }))}
                  >
                    <option value="mandarin">普通话</option>
                    <option value="cantonese">粤语</option>
                    <option value="lmz">四川话</option>
                  </select>
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>VAD 结束</span>
                  <input
                    type="number"
                    min={500}
                    step={100}
                    className="w-44 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100"
                    value={config.vadEos}
                    onChange={(event) => setConfig((prev) => ({ ...prev, vadEos: Number(event.target.value) }))}
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>动态结果</span>
                  <select
                    className="w-44 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100"
                    value={config.dwa}
                    onChange={(event) => setConfig((prev) => ({ ...prev, dwa: event.target.value }))}
                  >
                    <option value="wpgs">wpgs</option>
                    <option value="none">关闭</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">运行日志</div>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                {logs.length === 0 && <div>尚无日志</div>}
                {logs.map((entry, index) => (
                  <div key={`${entry}-${index}`}>{entry}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 text-sm text-slate-300">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-200">识别记录回放/分析</div>
            <button
              type="button"
              onClick={refreshHistory}
              className="text-xs text-emerald-300 transition hover:text-emerald-200"
            >
              刷新列表
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {history.length === 0 && <div className="text-slate-500">暂无存档记录</div>}
            {history.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>{new Date(record.createdAt).toLocaleString()}</span>
                  <span>时长 {formatDuration(record.duration)}</span>
                </div>
                <div className="mt-2 text-sm text-slate-200">{record.transcript}</div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>字数 {record.stats.charCount}</span>
                  <span>分词 {record.stats.wordCount}</span>
                  <span>语言 {record.config.language}</span>
                  <span>口音 {record.config.accent}</span>
                  <span>VAD {record.config.vadEos}ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 text-sm text-slate-300">
          <div className="font-semibold text-slate-200">使用提示</div>
          <ul className="mt-3 space-y-2">
            <li>首次运行需要浏览器授权麦克风权限。</li>
            <li>请在服务端配置 XFYUN_APP_ID / XFYUN_API_KEY / XFYUN_API_SECRET。</li>
            <li>若识别结果为空，检查控制台是否有 WebSocket 认证错误。</li>
            <li>点击“保存记录”会将识别文本与参数写入服务端存档。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
