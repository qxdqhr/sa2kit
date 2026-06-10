'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../../components/Button';
import { Input } from '../../../../../components/Input';
import { cn } from '../../../../../utils/cn';
import type { AiConfigPageProps, AiUiConfig } from '../../types';

const DEFAULT_AI_CONFIG: AiUiConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  systemPrompt: '',
  template: '{{input}}',
  temperature: 0.7,
  topP: 1,
  maxTokens: 1024,
};

const mergeConfig = (
  base: AiUiConfig,
  overrides?: Partial<AiUiConfig>,
  stored?: Partial<AiUiConfig>
): AiUiConfig => {
  return {
    ...base,
    ...(overrides ?? {}),
    ...(stored ?? {}),
  };
};

export const AiConfigPage: React.FC<AiConfigPageProps> = ({
  storageKey = 'sa2kit-ai-config',
  initialConfig,
  title = 'AI 配置',
  description = '配置 API Key、模型与提示词模板，用于 AI 对话能力。',
  onSave,
  onChange,
}) => {
  const baseConfig = useMemo(
    () => mergeConfig(DEFAULT_AI_CONFIG, initialConfig),
    [initialConfig]
  );
  const [config, setConfig] = useState<AiUiConfig>(baseConfig);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!storageKey) {
      return;
    }
    const storedRaw = localStorage.getItem(storageKey);
    if (!storedRaw) {
      return;
    }
    try {
      const stored = JSON.parse(storedRaw) as Partial<AiUiConfig>;
      setConfig(mergeConfig(DEFAULT_AI_CONFIG, initialConfig, stored));
    } catch (error) {
      console.warn('[AiConfigPage] Failed to parse stored config:', error);
    }
  }, [storageKey, initialConfig]);

  const updateConfig = (updates: Partial<AiUiConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      onChange?.(next);
      return next;
    });
  };

  const updateNumber = (key: keyof AiUiConfig, value: string) => {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) {
      return;
    }
    updateConfig({ [key]: nextValue } as Partial<AiUiConfig>);
  };

  const saveConfig = () => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(config));
      } catch (error) {
        setStatus({ type: 'error', text: '保存失败，请检查浏览器存储权限。' });
        return;
      }
    }
    setStatus({ type: 'success', text: '已保存配置。' });
    onSave?.(config);
  };

  const resetConfig = () => {
    const next = mergeConfig(DEFAULT_AI_CONFIG, initialConfig);
    setConfig(next);
    onChange?.(next);
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.removeItem(storageKey);
    }
    setStatus({ type: 'success', text: '已恢复默认配置。' });
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-6 grid gap-6">
        <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold text-slate-700">API 信息</h3>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Base URL</label>
              <Input
                value={config.baseUrl}
                onChange={(event) => updateConfig({ baseUrl: event.target.value })}
                placeholder="https://api.openai.com/v1"
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">API Key</label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={config.apiKey}
                  onChange={(event) => updateConfig({ apiKey: event.target.value })}
                  placeholder="sk-..."
                  type={showApiKey ? 'text' : 'password'}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApiKey((prev) => !prev)}
                >
                  {showApiKey ? '隐藏' : '显示'}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">模型</label>
              <Input
                value={config.model}
                onChange={(event) => updateConfig({ model: event.target.value })}
                placeholder="gpt-3.5-turbo"
                className="mt-2"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">提示词与上下文</h3>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500">系统提示词</label>
              <textarea
                value={config.systemPrompt}
                onChange={(event) => updateConfig({ systemPrompt: event.target.value })}
                placeholder="你是一个专业的 AI 助手..."
                className="mt-2 min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">提示词模板</label>
              <textarea
                value={config.template}
                onChange={(event) => updateConfig({ template: event.target.value })}
                placeholder="请回答：{{input}}"
                className="mt-2 min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              />
              <p className="mt-2 text-xs text-slate-400">
                支持变量插入：<code className="rounded bg-slate-100 px-1">{"{{input}}"}</code>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold text-slate-700">模型参数</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Temperature</label>
              <Input
                type="number"
                value={config.temperature}
                onChange={(event) => updateNumber('temperature', event.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Top P</label>
              <Input
                type="number"
                value={config.topP}
                onChange={(event) => updateNumber('topP', event.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Max Tokens</label>
              <Input
                type="number"
                value={config.maxTokens}
                onChange={(event) => updateNumber('maxTokens', event.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveConfig}>保存配置</Button>
          <Button variant="outline" onClick={resetConfig}>
            恢复默认
          </Button>
          {status && (
            <span
              className={cn(
                'text-xs',
                status.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {status.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
