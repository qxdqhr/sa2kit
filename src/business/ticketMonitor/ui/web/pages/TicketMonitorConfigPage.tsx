'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketMonitorApiPath } from '../../../domain/ticketMonitorApiPath';
import type { SyncStatusSummary, TicketMonitorConfigDto, TicketSource } from '../../../domain/types';
import {
  DEFAULT_ENDING_SOON_DAYS_LIST,
  SOURCE_LABEL_MAP,
  TICKET_SOURCES,
} from '../../../domain/types';
import {
  fetchSyncStatus,
  fetchTicketConfig,
  getAdminToken,
  saveAdminToken,
  saveTicketConfig,
  testFeishuNotification,
} from '../services/ticketMonitorApi';

interface ConfigFormState {
  notificationsEnabled: boolean;
  feishuWebhookUrl: string;
  feishuSignSecret: string;
  newEventEnabled: boolean;
  newEventPlatforms: TicketSource[];
  endingSoonEnabled: boolean;
  endingSoonDaysList: number[];
  webhookConfigured: boolean;
  secretConfigured: boolean;
}

function createInitialForm(): ConfigFormState {
  return {
    notificationsEnabled: false,
    feishuWebhookUrl: '',
    feishuSignSecret: '',
    newEventEnabled: true,
    newEventPlatforms: ['asobistore'],
    endingSoonEnabled: true,
    endingSoonDaysList: [],
    webhookConfigured: false,
    secretConfigured: false,
  };
}

export default function TicketMonitorConfigPage() {
  const [form, setForm] = useState<ConfigFormState>(createInitialForm);
  const [effectiveDays, setEffectiveDays] = useState<number[]>([...DEFAULT_ENDING_SOON_DAYS_LIST]);
  const [newDayInput, setNewDayInput] = useState('3');
  const [adminToken, setAdminToken] = useState('');
  const [showWebhook, setShowWebhook] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncStatusSummary | null>(null);

  const applyConfig = useCallback((config: TicketMonitorConfigDto) => {
    const webhookConfigured = Boolean(config.feishuWebhookUrl);
    const secretConfigured = Boolean(config.feishuSignSecret);
    const webhookMasked = config.feishuWebhookUrl?.includes('****') ?? false;
    const secretMasked = config.feishuSignSecret?.includes('****') ?? false;

    setForm({
      notificationsEnabled: config.notificationsEnabled,
      feishuWebhookUrl: webhookMasked ? '' : (config.feishuWebhookUrl || ''),
      feishuSignSecret: secretMasked ? '' : (config.feishuSignSecret || ''),
      newEventEnabled: config.newEventEnabled,
      newEventPlatforms: config.newEventPlatforms,
      endingSoonEnabled: config.endingSoonEnabled,
      endingSoonDaysList: config.endingSoonDaysList,
      webhookConfigured,
      secretConfigured,
    });
    setEffectiveDays(config.effectiveEndingSoonDaysList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [config, sync] = await Promise.all([
        fetchTicketConfig(),
        fetchSyncStatus(),
      ]);
      applyConfig(config);
      setSyncSummary(sync);
      setAdminToken(getAdminToken());
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '加载失败' });
    } finally {
      setLoading(false);
    }
  }, [applyConfig]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePlatform = (source: TicketSource) => {
    setForm((prev) => {
      const exists = prev.newEventPlatforms.includes(source);
      const nextPlatforms = exists
        ? prev.newEventPlatforms.filter((item) => item !== source)
        : [...prev.newEventPlatforms, source];
      return { ...prev, newEventPlatforms: nextPlatforms };
    });
  };

  const addDayThreshold = () => {
    const value = Number(newDayInput);
    if (!Number.isInteger(value) || value < 1) {
      setMessage({ type: 'error', text: '请输入 ≥ 1 的整数天数' });
      return;
    }
    setForm((prev) => ({
      ...prev,
      endingSoonDaysList: [...new Set([...prev.endingSoonDaysList, value])].sort((a, b) => b - a),
    }));
  };

  const removeDayThreshold = (day: number) => {
    setForm((prev) => ({
      ...prev,
      endingSoonDaysList: prev.endingSoonDaysList.filter((item) => item !== day),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    saveAdminToken(adminToken);

    try {
      const payload: Record<string, unknown> = {
        notificationsEnabled: form.notificationsEnabled,
        newEventEnabled: form.newEventEnabled,
        newEventPlatforms: form.newEventPlatforms,
        endingSoonEnabled: form.endingSoonEnabled,
        endingSoonDaysList: form.endingSoonDaysList,
      };

      if (form.feishuWebhookUrl.trim()) {
        payload.feishuWebhookUrl = form.feishuWebhookUrl.trim();
      } else if (!form.webhookConfigured) {
        payload.feishuWebhookUrl = null;
      }

      if (form.feishuSignSecret.trim()) {
        payload.feishuSignSecret = form.feishuSignSecret.trim();
      } else if (!form.secretConfigured) {
        payload.feishuSignSecret = null;
      }

      const updated = await saveTicketConfig(payload);
      applyConfig(updated);
      setEffectiveDays(updated.effectiveEndingSoonDaysList);
      setMessage({ type: 'success', text: '配置已保存' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    saveAdminToken(adminToken);

    try {
      const payload: { feishuWebhookUrl?: string; feishuSignSecret?: string } = {};
      if (form.feishuWebhookUrl.trim()) payload.feishuWebhookUrl = form.feishuWebhookUrl.trim();
      if (form.feishuSignSecret.trim()) payload.feishuSignSecret = form.feishuSignSecret.trim();
      await testFeishuNotification(payload);
      setMessage({ type: 'success', text: '测试消息已发送，请查看飞书群' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '测试发送失败' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <Link href="/ticket-monitor" className="text-sm text-blue-600 hover:underline">
            ← 返回列表
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">票务监控 · 通知配置</h1>
          <p className="mt-1 text-sm text-gray-600">配置飞书 Webhook、上新平台与截止提醒档位</p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">加载中...</div>
        ) : (
          <>
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">管理 Token（可选）</h2>
              <p className="text-sm text-gray-600">若服务端设置了 TICKET_MONITOR_ADMIN_TOKEN，保存与测试前需填写。</p>
              <input
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="x-ticket-monitor-admin-token"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">飞书机器人</h2>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.notificationsEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))}
                />
                启用通知总开关
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type={showWebhook ? 'text' : 'password'}
                    value={form.feishuWebhookUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, feishuWebhookUrl: e.target.value }))}
                    placeholder={form.webhookConfigured ? '已配置，留空则不修改' : 'https://open.feishu.cn/open-apis/bot/v2/hook/...'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => setShowWebhook((v) => !v)} className="rounded-md border border-gray-300 px-3 text-sm">
                    {showWebhook ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">签名密钥（可选）</label>
                <div className="flex gap-2">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={form.feishuSignSecret}
                    onChange={(e) => setForm((prev) => ({ ...prev, feishuSignSecret: e.target.value }))}
                    placeholder={form.secretConfigured ? '已配置，留空则不修改' : '可选'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => setShowSecret((v) => !v)} className="rounded-md border border-gray-300 px-3 text-sm">
                    {showSecret ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleTest()}
                disabled={testing}
                className="rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
              >
                {testing ? '发送中...' : '发送测试消息'}
              </button>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">上新演出通知</h2>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.newEventEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, newEventEnabled: e.target.checked }))}
                />
                启用
              </label>
              <div className="flex flex-wrap gap-2">
                {TICKET_SOURCES.map((source) => {
                  const checked = form.newEventPlatforms.includes(source);
                  return (
                    <button
                      key={source}
                      type="button"
                      onClick={() => togglePlatform(source)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        checked ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      {SOURCE_LABEL_MAP[source]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">默认仅 asobistore；爬虫首次发现所选平台的新演出时推送。</p>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">截止售卖提醒</h2>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.endingSoonEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, endingSoonEnabled: e.target.checked }))}
                />
                启用
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {form.endingSoonDaysList.map((day) => (
                  <span key={day} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {day}
                    天
                    <button type="button" onClick={() => removeDayThreshold(day)} className="text-gray-500 hover:text-red-600">×</button>
                  </span>
                ))}
                {form.endingSoonDaysList.length === 0 ? (
                  <span className="text-sm text-gray-500">
                    未添加档位，将使用默认 3 天（生效：
                    {effectiveDays.join(', ')}
                    {' '}
                    天）
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={newDayInput}
                  onChange={(e) => setNewDayInput(e.target.value)}
                  className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button type="button" onClick={addDayThreshold} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                  + 添加档位
                </button>
              </div>
              <p className="text-xs text-gray-500">进入各档位窗口各推送一次（档位独立去重）。</p>
            </section>

            {message ? (
              <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? '保存中...' : '保存配置'}
              </button>
            </div>

            {syncSummary ? (
              <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
                <p>
                  最近同步：
                  {syncSummary.finishedAt || syncSummary.startedAt}
                  {' '}
                  · 新发现
                  {syncSummary.newEventsFound}
                  {' '}
                  · 截止命中
                  {syncSummary.endingSoonTriggered}
                  {' '}
                  · 推送
                  {syncSummary.notificationsSent}
                </p>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
