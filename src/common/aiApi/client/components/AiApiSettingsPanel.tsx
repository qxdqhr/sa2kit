'use client';

import React, { useCallback, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, Server } from 'lucide-react';
import { useAiApiSettings } from '../context/AiApiSettingsContext';
import { useAiModels } from '../hooks/useAiModels';
import { useAiServerConfig } from '../hooks/useAiServerConfig';
import { AiApiConnectivityTest } from './AiApiConnectivityTest';

export interface AiApiSettingsPanelProps {
  /** 宿主实现的配置状态端点 */
  serverConfigEndpoint?: string;
  modelsEndpoint?: string;
  runEndpoint?: string;
  /** 未配置服务端时的提示文案 */
  serverMissingHint?: React.ReactNode;
  apiKeyPlaceholder?: string;
  baseUrlPlaceholder?: string;
  visionModelPlaceholder?: string;
}

export function AiApiSettingsPanel({
  serverConfigEndpoint,
  modelsEndpoint,
  runEndpoint,
  serverMissingHint,
  apiKeyPlaceholder = 'sk-…',
  baseUrlPlaceholder = 'https://api.openai.com/v1',
  visionModelPlaceholder = 'gpt-4o-mini',
}: AiApiSettingsPanelProps) {
  const { settings, updateSettings } = useAiApiSettings();
  const { config: serverConfig, loading: serverLoading } = useAiServerConfig({
    configEndpoint: serverConfigEndpoint,
  });
  const [showOverride, setShowOverride] = useState(false);

  const hasBrowserKey = Boolean(settings.apiKey.trim());
  const serverReady = Boolean(serverConfig?.serverConfigured);
  const useServerOnly = serverReady && !hasBrowserKey && !showOverride;

  const handleSuggestedModel = useCallback(
    (model: string) => {
      updateSettings({ visionModel: model });
    },
    [updateSettings]
  );

  const { visionModels, allModels, loading, error, refresh } = useAiModels(
    settings,
    handleSuggestedModel,
    { modelsEndpoint }
  );

  const selectableModels = visionModels;
  const showDropdown = selectableModels.length > 0;
  const showAllModelsFallback = visionModels.length === 0 && allModels.length > 0;

  const defaultServerMissingHint = (
    <>
      请在宿主配置文件中填写 AI API Key（如 YAML 的 <code className="rounded bg-amber-100 px-1">ai.apiKey</code>
      ），或在下方的浏览器设置中填写。
    </>
  );

  return (
    <div className="space-y-6">
      {serverLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在检查服务端 AI 配置…
        </div>
      ) : serverReady && !hasBrowserKey ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-emerald-900">已由服务端配置</h3>
              <p className="mt-1 text-xs text-emerald-800/90">
                AI 功能将使用服务端配置的 API Key，无需在此重复填写。
              </p>
              <dl className="mt-3 grid gap-1 text-xs text-emerald-900/80">
                {serverConfig?.baseUrl && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium">Base URL</dt>
                    <dd className="truncate font-mono">{serverConfig.baseUrl}</dd>
                  </div>
                )}
                {serverConfig?.visionModel && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium">视觉模型</dt>
                    <dd className="font-mono">{serverConfig.visionModel}</dd>
                  </div>
                )}
              </dl>
              <button
                type="button"
                onClick={() => setShowOverride((v) => !v)}
                className="mt-3 text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
              >
                {showOverride ? '收起自定义配置' : '高级：使用浏览器自定义 Key 覆盖服务端'}
              </button>
            </div>
          </div>
        </div>
      ) : !serverReady && !hasBrowserKey ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <Server className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="text-sm font-medium text-amber-900">服务端未配置 AI</h3>
              <p className="mt-1 text-xs text-amber-800/90">
                {serverMissingHint ?? defaultServerMissingHint}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!useServerOnly && (
        <>
          <div>
            <label htmlFor="ai-api-key" className="mb-2 block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              id="ai-api-key"
              type="password"
              autoComplete="off"
              value={settings.apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              placeholder={apiKeyPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              保存在本机浏览器。填写后将覆盖服务端配置；留空则使用服务端密钥。
            </p>
          </div>

          <div>
            <label htmlFor="ai-base-url" className="mb-2 block text-sm font-medium text-gray-700">
              API Base URL
            </label>
            <input
              id="ai-base-url"
              type="url"
              value={settings.baseUrl}
              onChange={(e) => updateSettings({ baseUrl: e.target.value })}
              placeholder={baseUrlPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              填写 Key 与地址后将自动拉取可用模型并选择合适的视觉模型。
            </p>
          </div>
        </>
      )}

      {!useServerOnly && (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="ai-vision-model" className="text-sm font-medium text-gray-700">
                视觉模型
              </label>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                刷新模型
              </button>
            </div>

            {showDropdown ? (
              <select
                id="ai-vision-model"
                value={settings.visionModel}
                onChange={(e) => updateSettings({ visionModel: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
                {settings.visionModel && !selectableModels.includes(settings.visionModel) && (
                  <option value={settings.visionModel}>{settings.visionModel}（当前）</option>
                )}
              </select>
            ) : (
              <input
                id="ai-vision-model"
                type="text"
                value={settings.visionModel}
                onChange={(e) => updateSettings({ visionModel: e.target.value })}
                placeholder={visionModelPlaceholder}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {loading && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在读取可用模型…
              </p>
            )}
            {!loading && error && (
              <p className="mt-1.5 text-xs text-amber-600">
                无法自动获取模型列表：{error}。可手动填写模型名称。
              </p>
            )}
            {!loading && !error && showDropdown && (
              <p className="mt-1.5 text-xs text-gray-500">
                已加载 {selectableModels.length} 个
                {visionModels.length > 0 ? '视觉' : '对话'}模型，可手动切换。
              </p>
            )}
            {!loading && !error && showAllModelsFallback && (
              <p className="mt-1.5 text-xs text-amber-600">
                未识别到视觉模型，请手动填写支持识图的模型名。
              </p>
            )}
            {!loading && !error && !showDropdown && !showAllModelsFallback && (
              <p className="mt-1.5 text-xs text-gray-500">需支持图片输入的多模态模型。</p>
            )}
          </div>

          <div>
            <label htmlFor="ai-text-model" className="mb-2 block text-sm font-medium text-gray-700">
              文本模型
            </label>
            <input
              id="ai-text-model"
              type="text"
              value={settings.textModel ?? settings.visionModel}
              onChange={(e) => updateSettings({ textModel: e.target.value })}
              placeholder={visionModelPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-500">纯文本与 STT 转写后的对话；默认同视觉模型。</p>
          </div>

          <div>
            <label htmlFor="ai-audio-model" className="mb-2 block text-sm font-medium text-gray-700">
              语音转写模型（STT）
            </label>
            <input
              id="ai-audio-model"
              type="text"
              value={settings.audioModel ?? 'whisper-1'}
              onChange={(e) => updateSettings({ audioModel: e.target.value })}
              placeholder="whisper-1"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              多模态 auto 模式下，不支持内嵌音频时将用此模型转写（Whisper 等）。
            </p>
          </div>
        </>
      )}

      <AiApiConnectivityTest runEndpoint={runEndpoint} />
    </div>
  );
}
