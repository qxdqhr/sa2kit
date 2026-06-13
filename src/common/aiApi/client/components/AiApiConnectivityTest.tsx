'use client';

import React, { useCallback, useState } from 'react';
import { CheckCircle2, Loader2, Wifi, XCircle } from 'lucide-react';
import { CORE_CONNECTIVITY_TEST_TASK_ID } from '../../types';
import type { ConnectivityTestOutput } from '../../types';
import { useAiApiSettings } from '../context/AiApiSettingsContext';
import { runAiTask } from '../aiApiClient';
import { toServerClientSettings } from '../settingsCore';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AiApiConnectivityTestProps {
  runEndpoint?: string;
}

export function AiApiConnectivityTest({ runEndpoint }: AiApiConnectivityTestProps) {
  const { settings } = useAiApiSettings();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [message, setMessage] = useState('');
  const [meta, setMeta] = useState<{ model?: string; latencyMs?: number } | null>(null);

  const handleTest = useCallback(async () => {
    setStatus('loading');
    setMessage('');
    setMeta(null);

    const started = Date.now();
    const clientSettings = toServerClientSettings(settings);

    try {
      const result = await runAiTask<Record<string, never>, ConnectivityTestOutput>(
        CORE_CONNECTIVITY_TEST_TASK_ID,
        {},
        { clientSettings, runEndpoint }
      );

      const latencyMs = result.meta?.latencyMs ?? Date.now() - started;

      if (!result.success) {
        setStatus('error');
        setMessage(result.error?.message ?? '连通性测试失败');
        setMeta({ latencyMs });
        return;
      }

      setStatus('success');
      setMessage(result.data?.reply ? `响应：${result.data.reply}` : '连接正常');
      setMeta({ model: result.meta?.model, latencyMs });
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : '网络请求失败');
      setMeta({ latencyMs: Date.now() - started });
    }
  }, [settings, runEndpoint]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-slate-900">连通性测试</h3>
          <p className="mt-1 text-xs text-slate-500">
            使用当前填写的 Key、Base URL 与模型发起一次轻量请求（需已登录）。未填写 Key 时将使用服务端配置。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={status === 'loading'}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-transform hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          {status === 'loading' ? '测试中…' : '测试连接'}
        </button>
      </div>

      {status !== 'idle' && (
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
            status === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : status === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-white text-slate-600'
          }`}
        >
          {status === 'loading' && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {status === 'error' && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <div className="min-w-0">
            <p className="text-pretty">{status === 'loading' ? '正在连接 AI 服务…' : message}</p>
            {meta && (meta.model || meta.latencyMs !== undefined) && status !== 'loading' && (
              <p className="mt-1 tabular-nums text-xs opacity-80">
                {meta.model && <span>模型 {meta.model}</span>}
                {meta.model && meta.latencyMs !== undefined && <span> · </span>}
                {meta.latencyMs !== undefined && <span>{meta.latencyMs} ms</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
